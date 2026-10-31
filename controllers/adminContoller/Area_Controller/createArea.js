const Area = require("../../../models/Area/areaSchema");
const generateSlug = require("../../../helpers/generateSlug");

const createArea = async (req, res) => {
  try {
    const { name, slug, division, district, upazila } = req.body;

    if (!name || !division || !district) {
      return res.status(400).json({
        success: false,
        message: "Name, division and district are required.",
      });
    }

    const areaSlug = generateSlug(slug || name);

    if (!areaSlug) {
      return res.status(400).json({
        success: false,
        message: "A valid English slug is required.",
      });
    }

    const existingArea = await Area.findOne({
      slug: areaSlug,
    });

    if (existingArea) {
      return res.status(409).json({
        success: false,
        message: "Area with this slug already exists.",
      });
    }

    const area = await Area.create({
      name,
      slug: areaSlug,
      division,
      district,
      upazila: upazila || "",
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Area created successfully.",
      data: area,
    });
  } catch (error) {
    console.error("CREATE AREA ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Area slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create area.",
      error: error.message,
    });
  }
};

module.exports = createArea;