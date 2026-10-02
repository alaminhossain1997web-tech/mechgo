const Technician = require("../../../models/tecnicianSchema/tecnicianSchema");

const approveTechnician = async (req, res) => {
  try {
    const { technicianId } = req.params;

    const technician = await Technician.findByIdAndUpdate(
      technicianId,
      {
        verificationStatus: "approved",
        isOnline: false,
        isAvailable: false,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Technician approved successfully",
      technician,
    });
  } catch (error) {
    console.log("Approve Technician Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = approveTechnician;