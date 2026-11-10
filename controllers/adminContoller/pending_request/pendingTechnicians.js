const Technician = require("../../../models/tecnicianSchema/tecnicianSchema")
// ========================================
// GET ALL PENDING TECHNICIANS
// GET /api/v1/admin/pending_technician
// ========================================

const getPendingTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find({
      verificationStatus: "pending",
    })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Pending technicians fetched successfully",
      total: technicians.length,
      data: technicians,
    });
  } catch (error) {
    console.error("Get Pending Technicians Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending technicians",
      error: error.message,
    });
  }
};


module.exports = getPendingTechnicians;