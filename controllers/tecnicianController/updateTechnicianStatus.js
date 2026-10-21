const Technician = require("../../models/tecnicianSchema/tecnicianSchema");

const updateTechnicianStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    // Validate status
    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOnline must be true or false",
      });
    }

    // Find the logged-in technician's profile
    const technician = await Technician.findOneAndUpdate(
      {
        userId: req.user._id,
        verificationStatus: "approved",
      },
      {
        isOnline,
        ...(isOnline ? {} : { isAvailable: false }),
      },
      { new: true, runValidators: true }
    );

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Approved technician profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: isOnline
        ? "You are now online"
        : "You are now offline",
      data: {
        isOnline: technician.isOnline,
        isAvailable: technician.isAvailable,
      },
    });
  } catch (error) {
    console.error("Update technician status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update technician status",
    });
  }
};

module.exports = { updateTechnicianStatus };
