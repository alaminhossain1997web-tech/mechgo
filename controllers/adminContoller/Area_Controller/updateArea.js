
const mongoose = require("mongoose");

const Area = require("../../../models/Area/areaSchema");
const generateSlug = require("../../../helpers/generateSlug");
const validateAreaBoundary = require("../../../helpers/validateAreaBoundary");

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
      nameBn,
      slug,
      division,
      district,
      upazila,
      cityCorporation,
      areaSqKm,
      boundary,
      isActive,
    } = req.body;

    // Name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Area name must be a valid string.",
        });
      }

      area.name = name.trim();
    }

    // Bangla name
    if (nameBn !== undefined) {
      if (typeof nameBn !== "string") {
        return res.status(400).json({
          success: false,
          message: "nameBn must be a string.",
        });
      }

      area.nameBn = nameBn.trim();
    }

    // Slug
    if (slug !== undefined || name !== undefined) {
      const newSlug = generateSlug(
        slug !== undefined ? slug : name
      );

      if (!newSlug) {
        return res.status(400).json({
          success: false,
          message: "Invalid area slug.",
        });
      }

      const duplicate = await Area.findOne({
        _id: { $ne: area._id },
        type: area.type,
        parentAreaId: area.parentAreaId,
        slug: newSlug,
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Slug already exists under this parent.",
        });
      }

      area.slug = newSlug;
    }

    // Basic information
    if (division !== undefined) area.division = division;
    if (district !== undefined) area.district = district;
    if (upazila !== undefined) area.upazila = upazila;

    if (cityCorporation !== undefined) {
      area.cityCorporation = cityCorporation;
    }

    // Area size
    if (areaSqKm !== undefined) {
      const size = Number(areaSqKm);

      if (!Number.isFinite(size) || size < 0) {
        return res.status(400).json({
          success: false,
          message: "areaSqKm must be a valid non-negative number.",
        });
      }

      area.areaSqKm = size;
    }

    // Boundary
    if (boundary !== undefined) {
      if (boundary === null) {
        area.boundary = undefined;
      } else {
        if (!validateAreaBoundary(boundary)) {
          return res.status(400).json({
            success: false,
            message: "Invalid GeoJSON boundary.",
          });
        }

        area.boundary = boundary;
      }
    }

    // Active status
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean.",
        });
      }

      area.isActive = isActive;
    }

    // Do not allow hierarchy changes through this endpoint
    if (
      req.body.type !== undefined ||
      req.body.parentAreaId !== undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Area type and parent cannot be changed through this endpoint.",
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
      message: "Failed to update area.",
      error: error.message,
    });
  }
};

module.exports = updateArea;
