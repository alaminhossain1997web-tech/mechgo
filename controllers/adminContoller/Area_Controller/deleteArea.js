
const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");

const deleteArea = async (req, res) => {
  try {
    const { areaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(areaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Area ID",
      });
    }

    const area = await Area.findById(areaId);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    const childArea = await Area.findOne({
      parentAreaId: area._id,
    }).select("_id name type");

    if (childArea) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate area because child areas exist",
        childArea,
      });
    }

    if (!area.isActive) {
      return res.status(400).json({
        success: false,
        message: "Area is already inactive",
      });
    }

    area.isActive = false;
    await area.save();

    return res.status(200).json({
      success: true,
      message: "Area deactivated successfully",
      data: area,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate area",
      error: error.message,
    });
  }
};

module.exports = deleteArea;
