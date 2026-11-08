const mongoose = require("mongoose");
const Pump = require("../../models/pumpSchema/pumpSchema");

const updatePumpStatusController = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    const { pumpId } = req.params;
    const { isOpen } = req.body;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(pumpId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pump ID.",
      });
    }

    //Validate isOpen
    if (typeof isOpen !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOpen must be true or false.",
      });
    }

    //Find pump belonging to logged-in owner
    const pump = await Pump.findOne({
      _id: pumpId,
      createdBy: ownerId,
    });

    if (!pump) {
      return res.status(404).json({
        success: false,
        message: "Pump not found or you are not authorized.",
      });
    }

    //Check current status
    if (pump.isOpen === isOpen) {
      return res.status(200).json({
        success: true,
        message: isOpen ? "Pump is already open." : "Pump is already closed.",
        data: {
          _id: pump._id,
          name: pump.name,
          isOpen: pump.isOpen,
          approvalStatus: pump.approvalStatus,
          isActive: pump.isActive,
        },
      });
    }

    //Only approved pumps can be opened
    if (isOpen === true) {
      if (pump.approvalStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message:
            "Your pump is not approved yet. Admin approval is required before opening.",
        });
      }

      if (pump.isActive !== true) {
        return res.status(403).json({
          success: false,
          message: "Your pump is inactive. Please contact admin.",
        });
      }
    }

    // 7. Update Open / Close status
    pump.isOpen = isOpen;

    await pump.save();

    return res.status(200).json({
      success: true,
      message: isOpen
        ? "Pump is now open successfully."
        : "Pump is now closed successfully.",

      data: {
        _id: pump._id,
        name: pump.name,
        isOpen: pump.isOpen,
        isActive: pump.isActive,
        approvalStatus: pump.approvalStatus,
      },
    });
  } catch (error) {
    console.error("UPDATE PUMP STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update pump status. Please try again.",
    });
  }
};

module.exports = updatePumpStatusController;
