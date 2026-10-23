const mongoose = require("mongoose");
const Technician = require("../../models/tecnicianSchema/tecnicianSchema");
const DriverRequest = require("../../models/requestSchema/driverRequestSchema");
const { getIO } = require("../../config/socket");

const updateRequestStatusController = async (req, res) => {
  try {
    if (req.user?.role !== "Technician") {
      return res.status(403).json({ success: false, message: "Technician account required" });
    }
    const { requestId } = req.params;
    const { status } = req.body || {};
    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be accepted or rejected" });
    }
    const technician = await Technician.findOne({ userId: req.user._id }).select("_id");
    if (!technician) {
      return res.status(404).json({ success: false, message: "Technician profile not found" });
    }
    const request = await DriverRequest.findOneAndUpdate(
      { _id: requestId, technicianId: technician._id, status: "pending" },
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!request) {
      const ownedRequest = await DriverRequest.exists({ _id: requestId, technicianId: technician._id });
      if (!ownedRequest) return res.status(404).json({ success: false, message: "Request not found" });
      return res.status(409).json({ success: false, message: "Request has already been processed" });
    }
    const payload = {
      requestId: request._id.toString(),
      status: request.status,
      riderId: request.userId.toString(),
      technicianId: technician._id.toString(),
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
    getIO()?.to(`technician:${technician._id}`).emit("request:updated", payload);
    getIO()?.to(`rider:${request.userId}`).emit("request:updated", payload);
    return res.status(200).json({ success: true, message: "Request status updated", data: { request } });
  } catch (error) {
    console.error("UPDATE REQUEST STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update request status" });
  }
};

module.exports = updateRequestStatusController;
