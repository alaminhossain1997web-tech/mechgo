const Technician = require("../../models/tecnicianSchema/tecnicianSchema");

const updateOnlineStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const { isOnline } = req.body;


    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOnline must be true or false",
      });
    }


    const updateData = {
      isOnline,
    };

    // If Technician offline
    // available- false 
    if (!isOnline) {
      updateData.isAvailable = false;
    }


    const technician = await Technician.findOneAndUpdate(
      {
        userId,
        verificationStatus: "approved",
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
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
      technician,
    });
  } catch (error) {
    console.log("Update Online Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = updateOnlineStatus;