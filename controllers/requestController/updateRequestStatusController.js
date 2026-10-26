
const mongoose = require("mongoose");
const Technician = require("../../models/tecnicianSchema/tecnicianSchema");
const DriverRequest = require("../../models/requestSchema/driverRequestSchema");
const { getIO } = require("../../config/socket");

const allowedTransitions = {
  pending: ["accepted", "rejected"],
  accepted: ["on_the_way"],
  on_the_way: ["in_progress"],
  in_progress: ["completed"],
};

// Riders may withdraw a request before work starts. Once the Technician is
// travelling or has started work, cancellation must be handled operationally.
const riderCancellationStatuses = ["pending", "accepted"];

const updateRequestStatusController = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ success: false, message: "Unauthorized request" });

    const { requestId } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const validStatuses = [
      "accepted",
      "rejected",
      "on_the_way",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request status",
      });
    }

    const isRider = req.user.role === "Rider";
    const isTechnician = req.user.role === "Technician";
    if (!isRider && !isTechnician) return res.status(403).json({ success: false, message: "Rider or Technician account required" });

    let technician = null;
    let ownership = { userId: req.user._id };
    if (isTechnician) {
      technician = await Technician.findOne({ userId: req.user._id }).select("_id");
      if (!technician) return res.status(404).json({ success: false, message: "Technician profile not found" });
      ownership = { technicianId: technician._id };
    }

    const existingRequest = await DriverRequest.findOne({ _id: requestId, ...ownership }).select("status userId technicianId");

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const currentStatus = existingRequest.status;
    const allowed = isRider && status === "cancelled"
      ? riderCancellationStatuses.includes(currentStatus)
      : isTechnician && status !== "cancelled"
        ? (allowedTransitions[currentStatus] || []).includes(status)
        : false;

    if (!allowed) {
      return res.status(409).json({
        success: false,
        message: isRider
          ? `Riders may cancel only pending or accepted requests (current: ${currentStatus})`
          : `Cannot change request from ${currentStatus} to ${status}`,
      });
    }

    // Atomic conditional update prevents conflicting transitions.
    const request = await DriverRequest.findOneAndUpdate(
      {
        _id: requestId,
        ...ownership,
        status: currentStatus,
      },
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("technicianId", "shopname phone")
      .populate("serviceId", "name");

    if (!request) {
      return res.status(409).json({
        success: false,
        message: "Request changed concurrently. Refresh and try again.",
      });
    }

    const payload = {
      requestId: request._id.toString(),
      riderId: request.userId.toString(),
      technicianId: existingRequest.technicianId.toString(),
      status: request.status,
      updatedAt: request.updatedAt,
    };

    // A Socket.IO failure must not undo the saved database update.
    try {
      const io = getIO();

      if (io) {
        io.to(`rider:${request.userId}`).emit(
          "request:updated",
          payload
        );

        io.to(`technician:${existingRequest.technicianId}`).emit(
          "request:updated",
          payload
        );
      }
    } catch (socketError) {
      console.error("REQUEST STATUS SOCKET ERROR:", socketError);
    }

    return res.status(200).json({
      success: true,
      message: "Request status updated successfully",
      data: { request },
    });
  } catch (error) {
    console.error("UPDATE REQUEST STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update request status",
    });
  }
};

module.exports = updateRequestStatusController;
