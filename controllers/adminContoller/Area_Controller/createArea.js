
const mongoose = require("mongoose");

const Area = require("../../../models/Area/areaSchema");
const generateSlug = require("../../../helpers/generateSlug");
const validateAreaBoundary = require("../../../helpers/validateAreaBoundary");

const createArea = async (req, res) => {
  try {
    const {
      name,
      nameBn,
      slug,
      type,
      parentAreaId,
      division,
      district,
      upazila,
      cityCorporation,
      zoneNo,
      wardNo,
      areaSqKm,
      boundary,
    } = req.body;

    // 1. Required fields
    if (!name || !division || !district || !type) {
      return res.status(400).json({
        success: false,
        message: "Name, division, district and type are required.",
      });
    }

    // 2. Validate area type
    const allowedTypes = ["Zone", "Ward", "Neighbourhood"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid area type.",
      });
    }

    // 3. Validate hierarchy
    if (type === "Zone" && parentAreaId) {
      return res.status(400).json({
        success: false,
        message: "Zone cannot have a parent area.",
      });
    }

    if (type !== "Zone" && !parentAreaId) {
      return res.status(400).json({
        success: false,
        message: `${type} must have a parent area.`,
      });
    }

    let parentArea = null;

    if (parentAreaId) {
      if (!mongoose.Types.ObjectId.isValid(parentAreaId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parentAreaId.",
        });
      }

      parentArea = await Area.findOne({
        _id: parentAreaId,
        isActive: true,
      });

      if (!parentArea) {
        return res.status(404).json({
          success: false,
          message: "Parent area not found or inactive.",
        });
      }

      const expectedParentType =
        type === "Ward" ? "Zone" : "Ward";

      if (parentArea.type !== expectedParentType) {
        return res.status(400).json({
          success: false,
          message: `${type} must belong to a ${expectedParentType}.`,
        });
      }
    }

    // 4. Validate Zone and Ward numbers
    if (type === "Zone" && !Number.isInteger(Number(zoneNo))) {
      return res.status(400).json({
        success: false,
        message: "Valid zoneNo is required for Zone.",
      });
    }

    if (type === "Ward" && !Number.isInteger(Number(wardNo))) {
      return res.status(400).json({
        success: false,
        message: "Valid wardNo is required for Ward.",
      });
    }

    // 5. Validate optional boundary
    if (boundary !== undefined && !validateAreaBoundary(boundary)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Polygon or MultiPolygon boundary.",
      });
    }

    // 6. Generate slug
    const areaSlug = generateSlug(slug || name);

    if (!areaSlug) {
      return res.status(400).json({
        success: false,
        message: "A valid English slug is required.",
      });
    }

    // 7. Duplicate check within same hierarchy
    const existingArea = await Area.findOne({
      type,
      parentAreaId: parentArea ? parentArea._id : null,
      slug: areaSlug,
    });

    if (existingArea) {
      return res.status(409).json({
        success: false,
        message: "Area with this slug already exists under this parent.",
      });
    }

    // 8. Create Area
    const area = await Area.create({
      name: name.trim(),
      nameBn: nameBn || "",
      slug: areaSlug,
      type,
      parentAreaId: parentArea ? parentArea._id : null,
      division,
      district,
      upazila: upazila || "",
      cityCorporation: cityCorporation || "",
      zoneNo: type === "Zone" ? Number(zoneNo) : parentArea?.zoneNo ?? null,
      wardNo: type === "Ward" ? Number(wardNo) : null,
      areaSqKm: areaSqKm === undefined ? null : Number(areaSqKm),
      ...(boundary ? { boundary } : {}),
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: `${type} created successfully.`,
      data: area,
    });
  } catch (error) {
    console.error("CREATE AREA ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Area already exists.",
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
      message: "Failed to create area.",
      error: error.message,
    });
  }
};

module.exports = createArea;
