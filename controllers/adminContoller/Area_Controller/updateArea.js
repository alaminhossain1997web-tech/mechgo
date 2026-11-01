
const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");
const generateSlug = require("../../../helpers/generateSlug");

const validateBoundary = (boundary) => {
  if (
    !boundary ||
    !["Polygon", "MultiPolygon"].includes(boundary.type) ||
    !Array.isArray(boundary.coordinates)
  ) {
    return false;
  }

  // Polygon coordinates: rings
  // MultiPolygon coordinates: polygons containing rings
  const polygons =
    boundary.type === "Polygon"
      ? [boundary.coordinates]
      : boundary.coordinates;

  if (!polygons.length) return false;

  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !polygon.length) return false;

    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) return false;

      for (const position of ring) {
        if (
          !Array.isArray(position) ||
          position.length !== 2 ||
          !Number.isFinite(position[0]) ||
          !Number.isFinite(position[1]) ||
          position[0] < -180 ||
          position[0] > 180 ||
          position[1] < -90 ||
          position[1] > 90
        ) {
          return false;
        }
      }

      const first = ring[0];
      const last = ring[ring.length - 1];

      if (first[0] !== last[0] || first[1] !== last[1]) {
        return false;
      }
    }
  }

  return true;
};

const updateArea = async (req, res) => {
  try {
    const { areaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(areaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid area ID.",
      });
    }

    const area = await Area.findById(areaId);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found.",
      });
    }

    const {
      name,
      slug,
      division,
      district,
      upazila,
      boundary,
      isActive,
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Area name must be a valid string.",
        });
      }

      area.name = name.trim();
    }

    if (division !== undefined) area.division = division;
    if (district !== undefined) area.district = district;
    if (upazila !== undefined) area.upazila = upazila;

    if (slug !== undefined || name !== undefined) {
      const newSlug = generateSlug(slug !== undefined ? slug : name);

      if (!newSlug) {
        return res.status(400).json({
          success: false,
          message: "A valid English slug is required.",
        });
      }

      area.slug = newSlug;
    }

    if (boundary !== undefined) {
      if (!validateBoundary(boundary)) {
        return res.status(400).json({
          success: false,
          message: "Invalid GeoJSON boundary coordinates.",
        });
      }

      area.boundary = boundary;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean.",
        });
      }

      area.isActive = isActive;
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
