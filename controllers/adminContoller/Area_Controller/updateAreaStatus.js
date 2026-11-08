
const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");

const updateAreaStatus = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(areaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Area ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const area = await Area.findById(areaId);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    if (isActive && area.parentAreaId) {
      const parent = await Area.findById(area.parentAreaId);

      if (!parent || !parent.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot activate area because its parent is inactive",
        });
      }
    }

    if (!isActive) {
      const activeChild = await Area.findOne({
        parentAreaId: area._id,
        isActive: true,
      });

      if (activeChild) {
        return res.status(400).json({
          success: false,
          message: "Deactivate child areas before deactivating this area",
        });
      }
    }

    area.isActive = isActive;
    await area.save();

    return res.status(200).json({
      success: true,
      message: `Area ${isActive ? "activated" : "deactivated"} successfully`,
      data: area,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update area status",
      error: error.message,
    });
  }
};

module.exports = updateAreaStatus;
