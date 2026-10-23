const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { requiredEnv } = require("./env");
const User = require("../models/authSchema/userSchema");
const Technician = require("../models/tecnicianSchema/tecnicianSchema");
const mongoose = require("mongoose");
const DriverRequest = require("../models/requestSchema/driverRequestSchema");

const LOCATION_UPDATE_INTERVAL_MS = 3000;

const rejectLocation = (socket, ack, code, message) => {
  const error = { code, message };
  if (typeof ack === "function") ack({ success: false, error });
  socket.emit("technician:location:error", error);
};

const handleLocationUpdate = async (socket, payload, ack) => {
  if (socket.data.user.role !== "Technician") {
    return rejectLocation(socket, ack, "FORBIDDEN", "Technician account required");
  }
  const { requestId, coordinates } = payload && typeof payload === "object" ? payload : {};
  if (!mongoose.isValidObjectId(requestId)) {
    return rejectLocation(socket, ack, "INVALID_REQUEST_ID", "Invalid request ID");
  }
  if (
    !Array.isArray(coordinates) || coordinates.length !== 2 ||
    typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number" ||
    !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1]) ||
    coordinates[0] < -180 || coordinates[0] > 180 ||
    coordinates[1] < -90 || coordinates[1] > 90
  ) {
    return rejectLocation(socket, ack, "INVALID_COORDINATES", "Coordinates must be [longitude, latitude] within valid ranges");
  }

  const now = Date.now();
  try {
    // The persisted timestamp makes the throttle atomic across server workers.
    // The status and ownership predicates prevent updates after tracking ends.
    const request = await DriverRequest.findOneAndUpdate(
      {
        _id: requestId,
        technicianId: socket.data.technicianId,
        status: "accepted",
        $or: [
          { "liveLocation.updatedAt": { $lte: new Date(now - LOCATION_UPDATE_INTERVAL_MS) } },
          { "liveLocation.updatedAt": { $exists: false } },
        ],
      },
      { $set: { liveLocation: { coordinates, updatedAt: new Date(now) } } },
      { new: true, runValidators: true }
    ).select("userId technicianId liveLocation");
    if (!request) {
      const activeRequest = await DriverRequest.exists({
        _id: requestId,
        technicianId: socket.data.technicianId,
        status: "accepted",
      });
      if (activeRequest) {
        return rejectLocation(socket, ack, "RATE_LIMITED", "Location updates must be at least 3 seconds apart");
      }
      return rejectLocation(socket, ack, "TRACKING_UNAVAILABLE", "Accepted request not found for this Technician");
    }
    const location = {
      requestId: request._id.toString(),
      technicianId: request.technicianId.toString(),
      coordinates: request.liveLocation.coordinates,
      timestamp: request.liveLocation.updatedAt,
    };
    getIO()?.to(`rider:${request.userId}`).emit("technician:location", location);
    if (typeof ack === "function") ack({ success: true, data: location });
  } catch (error) {
    console.error("TECHNICIAN LOCATION UPDATE ERROR:", error);
    rejectLocation(socket, ack, "LOCATION_UPDATE_FAILED", "Unable to update location");
  }
};

let io;

const allowedOrigins = () => [
  "http://localhost:5173",
  "https://pothseba.netlify.app",
  ...(process.env.FRONTEND_URL || "").split(",").map((value) => value.trim()).filter(Boolean),
];

const initializeSocket = (httpServer) => {
  // Keep initialization idempotent so repeated imports/startup hooks cannot
  // attach a second Engine.IO server to the same HTTP server.
  if (io) return io;

  io = new Server(httpServer, {
    path: "/socket.io/",
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || !token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, requiredEnv("JWT_ACCESS_SECRET"));
      if (!decoded.id) return next(new Error("Invalid authentication token"));
      const user = await User.findById(decoded.id).select("name email role");
      if (!user || !["Rider", "Technician"].includes(user.role)) {
        return next(new Error("Unauthorized account"));
      }
      socket.data.user = { id: user._id.toString(), role: user.role, name: user.name };
      if (user.role === "Technician") {
        const technician = await Technician.findOne({ userId: user._id }).select("_id");
        if (!technician) return next(new Error("Technician profile not found"));
        socket.data.technicianId = technician._id.toString();
      }
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.user.role === "Technician") {
      socket.join(`technician:${socket.data.technicianId}`);
    } else {
      socket.join(`rider:${socket.data.user.id}`);
    }
    socket.on("technician:location:update", (payload, ack) => {
      void handleLocationUpdate(socket, payload, ack);
    });
  });
  return io;
};

const getIO = () => io;
module.exports = { initializeSocket, getIO };
