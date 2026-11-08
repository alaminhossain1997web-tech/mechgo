
const Area = require("../../../models/Area/areaSchema");

const getAreaHierarchy = async (req, res) => {
  try {
    const { cityCorporation, division, district, isActive } = req.query;

    const filter = {};

    if (cityCorporation) filter.cityCorporation = cityCorporation;
    if (division) filter.division = division;
    if (district) filter.district = district;

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      filter.isActive = isActive === "true";
    }

    const areas = await Area.find(filter)
      .select("-boundary")
      .sort({ zoneNo: 1, wardNo: 1, name: 1 })
      .lean();

    const areaMap = new Map();

    areas.forEach((area) => {
      area.children = [];
      areaMap.set(area._id.toString(), area);
    });

    const hierarchy = [];

    areas.forEach((area) => {
      if (area.parentAreaId) {
        const parent = areaMap.get(area.parentAreaId.toString());

        if (parent) {
          parent.children.push(area);
        }
      } else if (area.type === "Zone") {
        hierarchy.push(area);
      }
    });

    return res.status(200).json({
      success: true,
      totalZones: hierarchy.length,
      totalAreas: areas.length,
      data: hierarchy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get area hierarchy",
      error: error.message,
    });
  }
};

module.exports = getAreaHierarchy;
