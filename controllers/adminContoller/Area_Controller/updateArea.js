const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");
const generateSlug = require("../../../helpers/generateSlug");

const updateArea = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid area ID.",
      });
    }

    const area = await Area.findById(id);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found.",
      });
    }

    const { name, slug, division, district, upazila } = req.body;

    if (name !== undefined) area.name = name;
    if (division !== undefined) area.division = division;
    if (district !== undefined) area.district = district;
    if (upazila !== undefined) area.upazila = upazila;

    if (slug !== undefined) {
      area.slug = generateSlug(slug);
    } else if (name !== undefined) {
      area.slug = generateSlug(name);
    }

    if (!area.slug) {
      return res.status(400).json({
        success: false,
        message: "A valid English slug is required.",
      });
    }

    const updatedArea = await area.save();

    return res.status(200).json({
      success: true,
      message: "Area updated successfully.",
      data: updatedArea,
    });
  } catch (error) {
    console.error("UPDATE AREA ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Area slug already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update area.",
      error: error.message,
    });
  }
};

module.exports = updateArea;