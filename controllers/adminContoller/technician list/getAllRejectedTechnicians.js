const Technician = require("../../../models/tecnicianSchema/tecnicianSchema");

// ========================================
// GET ALL REJECTED TECHNICIANS
// ========================================

const getAllRejectedTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find({
      verificationStatus: "rejected",
    })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Rejected technicians fetched successfully",
      total: technicians.length,
      data: technicians,
    });
  } catch (error) {
    console.error("Get Rejected Technicians Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rejected technicians",
      error: error.message,
    });
  }
};

module.exports = getAllRejectedTechnicians;
