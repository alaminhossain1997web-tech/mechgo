
const Area = require("../../../models/Area/areaSchema");

const getAllZones = async (req, res) => {
  try {
    const {
      cityCorporation,
      division,
      district,
      isActive = "true",
    } = req.query;

    if (!["true", "false", "all"].includes(isActive)) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true, false or all.",
      });
    }

    const filter = {
      type: "Zone",
    };

    if (isActive !== "all") {
      filter.isActive = isActive === "true";
    }

    if (cityCorporation) {
      filter.cityCorporation = {
        $regex: cityCorporation,
        $options: "i",
      };
    }

    if (division) {
      filter.division = {
        $regex: division,
        $options: "i",
      };
    }

    if (district) {
      filter.district = {
        $regex: district,
        $options: "i",
      };
    }

    const zones = await Area.find(filter)
      .sort({ zoneNo: 1 })
      .select("-boundary")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Zones retrieved successfully.",
      total: zones.length,
      data: zones,
    });
  } catch (error) {
    console.error("GET ALL ZONES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve zones.",
      error: error.message,
    });
  }
};

module.exports = getAllZones;
