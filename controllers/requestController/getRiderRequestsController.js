const DriverRequest = require("../../models/requestSchema/driverRequestSchema");

const getRiderRequestsController = async (req, res) => {
  try {
    if (req.user?.role !== "Rider") {
      return res.status(403).json({ success: false, message: "Rider account required" });
    }
    const requests = await DriverRequest.find({ userId: req.user._id })
      .populate("technicianId", "shopname phone")
      .populate("serviceId", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, total: requests.length, data: { requests } });
  } catch (error) {
    console.error("GET RIDER REQUESTS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch rider requests" });
  }
};

module.exports = getRiderRequestsController;
