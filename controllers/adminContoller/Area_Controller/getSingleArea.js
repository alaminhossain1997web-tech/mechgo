
const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");

const getSingleArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { includeBoundary = "true" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(areaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid area ID.",
      });
    }

    if (!["true", "false"].includes(includeBoundary)) {
      return res.status(400).json({
        success: false,
        message: "includeBoundary must be true or false.",
      });
    }

    let query = Area.findById(areaId)
      .populate("parentAreaId", "name nameBn type zoneNo wardNo")
      .populate("createdBy", "name email");

    if (includeBoundary === "false") {
      query = query.select("-boundary");
    }

    const area = await query.lean();

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found.",
      });
    }

    let children = [];

    if (area.type === "Zone" || area.type === "Ward") {
      let childQuery = Area.find({
        parentAreaId: area._id,
        isActive: true,
      }).sort({ wardNo: 1, name: 1 });

      if (includeBoundary === "false") {
        childQuery = childQuery.select("-boundary");
      }

      children = await childQuery.lean();
    }

    return res.status(200).json({
      success: true,
      message: "Area retrieved successfully.",
      data: {
        ...area,
        children,
      },
    });
  } catch (error) {
    console.error("GET SINGLE AREA ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve area.",
      error: error.message,
    });
  }
};

module.exports = getSingleArea;
