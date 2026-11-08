
const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");

const getAreaChildren = async (req, res) => {
  try {
    const { areaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(areaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Area ID.",
      });
    }

    const parent = await Area.findOne({
      _id: areaId,
      isActive: true,
    }).lean();

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Area not found.",
      });
    }

    if (parent.type === "Neighbourhood") {
      return res.status(400).json({
        success: false,
        message: "Neighbourhood does not have child areas.",
      });
    }

    const childType =
      parent.type === "Zone" ? "Ward" : "Neighbourhood";

    const children = await Area.find({
      parentAreaId: parent._id,
      type: childType,
      isActive: true,
    })
      .sort({ wardNo: 1, name: 1 })
      .select("-boundary")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Child areas retrieved successfully.",
      parent: {
        _id: parent._id,
        name: parent.name,
        type: parent.type,
      },
      childType,
      total: children.length,
      data: children,
    });
  } catch (error) {
    console.error("GET AREA CHILDREN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve child areas.",
      error: error.message,
    });
  }
};

module.exports = getAreaChildren;
