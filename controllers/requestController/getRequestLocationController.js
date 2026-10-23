const mongoose = require("mongoose");
const DriverRequest = require("../../models/requestSchema/driverRequestSchema");

const getRequestLocationController = async (req, res) => {
  try {
    if (req.user?.role !== "Rider") {
      return res.status(403).json({ success: false, message: "Rider account required" });
    }
    const { requestId } = req.params;
    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }
    const request = await DriverRequest.findOne({ _id: requestId, userId: req.user._id })
      .select("_id technicianId status liveLocation");
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (request.status !== "accepted") {
      return res.status(409).json({ success: false, message: "Technician tracking is unavailable for this request" });
    }
    if (!request.liveLocation?.coordinates || !request.liveLocation.updatedAt) {
      return res.status(404).json({ success: false, message: "No Technician location is available yet" });
    }
    return res.status(200).json({
      success: true,
      data: {
        requestId: request._id.toString(),
        technicianId: request.technicianId.toString(),
        coordinates: request.liveLocation.coordinates,
        timestamp: request.liveLocation.updatedAt,
      },
    });
  } catch (error) {
    console.error("GET REQUEST LOCATION ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch Technician location" });
  }
};

module.exports = getRequestLocationController;
