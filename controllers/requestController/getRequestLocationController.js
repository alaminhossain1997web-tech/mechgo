const mongoose = require("mongoose");
const DriverRequest = require("../../models/requestSchema/driverRequestSchema");
const Technician = require("../../models/tecnicianSchema/tecnicianSchema");

const getRequestLocationController = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ success: false, message: "Unauthorized request" });
    if (!["Rider", "Technician"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Rider or Technician account required" });
    const { requestId } = req.params;
    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }
    let query = { _id: requestId, userId: req.user._id };
    if (req.user.role === "Technician") {
      const technician = await Technician.findOne({ userId: req.user._id }).select("_id");
      if (!technician) return res.status(404).json({ success: false, message: "Technician profile not found" });
      query = { _id: requestId, technicianId: technician._id };
    }
    const request = await DriverRequest.findOne(query)
      .select("_id technicianId status location liveLocation");
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (req.user.role === "Technician") {
      return res.status(200).json({
        success: true,
        data: { requestId: request._id.toString(), status: request.status, location: request.location },
      });
    }
    if (!["accepted", "on_the_way", "in_progress"].includes(request.status)) {
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
