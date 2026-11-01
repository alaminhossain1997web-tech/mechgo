
const mongoose = require("mongoose");

const Area = require("../../../models/Area/areaSchema");
const generateSlug = require("../../../helpers/generateSlug");

const createArea = async (req, res) => {
  try {
    const {
      name,
      slug,
      division,
      district,
      upazila,
      boundary,
    } = req.body;

    // 1. Required field validation
    if (!name || !division || !district || !boundary) {
      return res.status(400).json({
        success: false,
        message: "Name, division, district and boundary are required.",
      });
    }

    // 2. Validate boundary type
    if (
      !["Polygon", "MultiPolygon"].includes(boundary.type) ||
      !Array.isArray(boundary.coordinates) ||
      boundary.coordinates.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GeoJSON boundary.",
      });
    }

    // 3. Generate slug
    const areaSlug = generateSlug(slug || name);

    if (!areaSlug) {
      return res.status(400).json({
        success: false,
        message: "A valid English slug is required.",
      });
    }

    // 4. Check duplicate slug
    const existingArea = await Area.findOne({
      slug: areaSlug,
    });

    if (existingArea) {
      return res.status(409).json({
        success: false,
        message: "Area with this slug already exists.",
      });
    }

    // 5. Validate geographic coordinates
    const validatePosition = (position) => {
      return (
        Array.isArray(position) &&
        position.length >= 2 &&
        Number.isFinite(position[0]) &&
        Number.isFinite(position[1]) &&
        position[0] >= -180 &&
        position[0] <= 180 &&
        position[1] >= -90 &&
        position[1] <= 90
      );
    };

    const validateRing = (ring) => {
      if (!Array.isArray(ring) || ring.length < 4) {
        return false;
      }

      if (!ring.every(validatePosition)) {
        return false;
      }

      const first = ring[0];
      const last = ring[ring.length - 1];

      return (
        first[0] === last[0] &&
        first[1] === last[1]
      );
    };

    let isValidBoundary = false;

    if (boundary.type === "Polygon") {
      isValidBoundary =
        boundary.coordinates.every(validateRing);
    }

    if (boundary.type === "MultiPolygon") {
      isValidBoundary =
        boundary.coordinates.every(
          (polygon) =>
            Array.isArray(polygon) &&
            polygon.length > 0 &&
            polygon.every(validateRing)
        );
    }

    if (!isValidBoundary) {
      return res.status(400).json({
        success: false,
        message: "Invalid Polygon or MultiPolygon coordinates.",
      });
    }

    // 6. Create Area
    const area = await Area.create({
      name,
      slug: areaSlug,
      division,
      district,
      upazila: upazila || "",
      boundary: {
        type: boundary.type,
        coordinates: boundary.coordinates,
      },
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

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
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
