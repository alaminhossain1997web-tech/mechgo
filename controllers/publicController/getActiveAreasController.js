const Area = require("../../models/Area/areaSchema");

const getActiveAreasController = async (req, res) => {
  try {
    const areas = await Area.find({ isActive: true })
      .select("name slug division district upazila")
      .sort({ name: 1 });
    return res.status(200).json({ success: true, message: "Areas retrieved successfully.", data: areas });
  } catch (error) {
    console.error("GET PUBLIC AREAS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve areas." });
  }
};

module.exports = getActiveAreasController;
