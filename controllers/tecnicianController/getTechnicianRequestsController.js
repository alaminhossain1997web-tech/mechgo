const Technician = require("../../models/tecnicianSchema/tecnicianSchema");
const DriverRequest = require("../../models/requestSchema/driverRequestSchema");

const getTechnicianRequestsController = async (req, res) => {
  try {
    if (req.user?.role !== "Technician") {
      return res.status(403).json({ success: false, message: "Technician account required" });
    }
    const technician = await Technician.findOne({
      userId: req.user._id,
    });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found",
      });
    }

    const requests = await DriverRequest.find({
      technicianId: technician._id,
    })
      .populate("userId", "name")
      .populate("serviceId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: requests.length,
      data: { requests },
    });
  } catch (error) {
    console.error("GET TECHNICIAN REQUESTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch technician requests",
    });
  }
};

module.exports = getTechnicianRequestsController;
