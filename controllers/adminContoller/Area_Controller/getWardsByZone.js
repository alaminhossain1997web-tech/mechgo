
const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");

const getWardsByZone = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { includeBoundary = "false" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(zoneId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Zone ID.",
      });
    }

    if (!["true", "false"].includes(includeBoundary)) {
      return res.status(400).json({
        success: false,
        message: "includeBoundary must be true or false.",
      });
    }

    const zone = await Area.findOne({
      _id: zoneId,
      type: "Zone",
      isActive: true,
    }).lean();

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found.",
      });
    }

    let wardQuery = Area.find({
      parentAreaId: zone._id,
      type: "Ward",
      isActive: true,
    }).sort({ wardNo: 1 });

    if (includeBoundary === "false") {
      wardQuery = wardQuery.select("-boundary");
    }

    const wards = await wardQuery.lean();

    return res.status(200).json({
      success: true,
      message: "Wards retrieved successfully.",
      zone: {
        _id: zone._id,
        name: zone.name,
        zoneNo: zone.zoneNo,
        cityCorporation: zone.cityCorporation,
      },
      total: wards.length,
      data: wards,
    });
  } catch (error) {
    console.error("GET WARDS BY ZONE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve wards.",
      error: error.message,
    });
  }
};

module.exports = getWardsByZone;
