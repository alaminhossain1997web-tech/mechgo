const Technician = require("../../models/tecnicianSchema/tecnicianSchema");

const updateAvailability = async (req, res) => {
  try {
    const userId = req.user._id;

    const { isAvailable } = req.body;

    // =========================
    // Validation
    // =========================

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be true or false",
      });
    }

    // =========================
    // Update Technician
    // =========================

    const technician = await Technician.findOneAndUpdate(
      {
        userId,
        verificationStatus: "approved",
        isOnline: true,
      },
      {
        isAvailable,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // =========================
    // Technician Not Found
    // =========================

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Online technician profile not found",
      });
    }

    // =========================
    // Response
    // =========================

    return res.status(200).json({
      success: true,
      message: isAvailable
        ? "You are now available"
        : "You are now busy",
      technician,
    });
  } catch (error) {
    console.log("Update Availability Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = updateAvailability;