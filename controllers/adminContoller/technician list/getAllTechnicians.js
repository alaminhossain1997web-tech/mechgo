const Technician = require("../../../models/tecnicianSchema/tecnicianSchema");

// ========================================
// GET ALL APPROVED TECHNICIANS
// ========================================

const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find({
      verificationStatus: "approved",
    })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Approved technicians fetched successfully",
      total: technicians.length,
      data: technicians,
    });
  } catch (error) {
    console.error("Get All Technicians Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved technicians",
      error: error.message,
    });
  }
};

module.exports = getAllTechnicians;
