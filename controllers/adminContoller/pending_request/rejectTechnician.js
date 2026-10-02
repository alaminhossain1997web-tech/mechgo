const Technician = require("../../../models/tecnicianSchema/tecnicianSchema");

const rejectTechnician = async (req, res) => {
  try {
    const { technicianId } = req.params;

    const technician = await Technician.findByIdAndUpdate(
      technicianId,
      {
        verificationStatus: "rejected",
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
      message: "Technician rejected successfully",
      technician,
    });
  } catch (error) {
    console.log("Reject Technician Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = rejectTechnician;