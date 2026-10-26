
const mongoose = require("mongoose");

const Technician = require("../../models/tecnicianSchema/tecnicianSchema");
const DriverRequest = require("../../models/requestSchema/driverRequestSchema");
const User = require("../../models/authSchema/userSchema");
const Service = require("../../models/serviceSchema/serviceSchema");
const { getIO } = require("../../config/socket");

const createRequestController = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (req.user.role !== "Rider") {
      return res.status(403).json({
        success: false,
        message: "Rider account required",
      });
    }

    const { technicianId, serviceId, location, description } = req.body;

    if (
      !technicianId ||
      !serviceId ||
      !location ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Technician, service, location and description are required",
      });
    }

    if (
      !mongoose.isValidObjectId(technicianId) ||
      !mongoose.isValidObjectId(serviceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid technician or service ID",
      });
    }

    if (
      location.type !== "Point" ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid location",
      });
    }

    const [longitude, latitude] = location.coordinates;

    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number" ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude or latitude",
      });
    }

    const technician = await Technician.findOne({
      _id: technicianId,
      isOnline: true,
      isAvailable: true,
      verificationStatus: "approved",
    });

    const service = await Service.findOne({ _id: serviceId, isActive: true }).select("_id name");
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found or inactive" });
    }

    if (!technician) {
      return res.status(409).json({
        success: false,
        message: "Technician is no longer available",
      });
    }

    const offersService = technician.services.some(
      (id) => id.toString() === serviceId
    );

    if (!offersService) {
      return res.status(400).json({
        success: false,
        message: "Selected service is not offered by this technician",
      });
    }

    // Save the request first. Database persistence is authoritative.
    const request = await DriverRequest.create({
      userId: req.user._id,
      technicianId: technician._id,
      serviceId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      description: description.trim(),
      status: "pending",
    });

    // Send the new request to the assigned technician in real time.
    try {
      const [rider] = await Promise.all([
        User.findById(req.user._id).select("name"),
      ]);

      const requestForSocket = {
        ...request.toObject(),

        _id: request._id.toString(),
        requestId: request._id.toString(),

        userId: req.user._id.toString(),
        riderId: req.user._id.toString(),

        rider: {
          _id: req.user._id.toString(),
          id: req.user._id.toString(),
          name: rider?.name || "",
        },

        technicianId: technician._id.toString(),

        serviceId: serviceId.toString(),

        service: {
          _id: serviceId.toString(),
          id: serviceId.toString(),
          name: service?.name || "",
        },

        serviceName: service?.name || "",
        description: request.description,
        location: request.location,
        status: request.status,
        createdAt: request.createdAt,
      };

      const io = getIO();

      if (io) {
        io.to(`technician:${technician._id.toString()}`).emit(
          "request:new",
          requestForSocket
        );

        console.info(
          `New request ${request._id} emitted to technician ${technician._id}`
        );
      } else {
        console.error("Socket.IO instance is not initialized.");
      }
    } catch (socketError) {
      // A socket failure should not undo a saved request.
      console.error("REQUEST EVENT ERROR:", socketError);
    }

    return res.status(201).json({
      success: true,
      message: "Service request sent successfully",
      data: {
        request,
      },
    });
  } catch (error) {
    console.error("CREATE REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = createRequestController;
