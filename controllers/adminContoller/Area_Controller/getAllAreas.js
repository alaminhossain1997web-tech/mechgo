
const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAllAreas = async (req, res) => {
  try {
    const {
      search,
      division,
      district,
      upazila,
      type,
      parentAreaId,
      zoneNo,
      wardNo,
      isActive,
      includeBoundary = "false",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // Search
    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        { name: regex },
        { nameBn: regex },
        { slug: regex },
        { district: regex },
        { cityCorporation: regex },
      ];
    }

    // Division
    if (division?.trim()) {
      filter.division = {
        $regex: escapeRegex(division.trim()),
        $options: "i",
      };
    }

    // District
    if (district?.trim()) {
      filter.district = {
        $regex: escapeRegex(district.trim()),
        $options: "i",
      };
    }

    // Upazila
    if (upazila?.trim()) {
      filter.upazila = {
        $regex: escapeRegex(upazila.trim()),
        $options: "i",
      };
    }

    // Area type
    if (type) {
      if (!["Zone", "Ward", "Neighbourhood"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid area type.",
        });
      }

      filter.type = type;
    }

    // Parent
    if (parentAreaId) {
      if (!mongoose.Types.ObjectId.isValid(parentAreaId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parentAreaId.",
        });
      }

      filter.parentAreaId = parentAreaId;
    }

    // Zone number
    if (zoneNo !== undefined) {
      const number = Number(zoneNo);

      if (!Number.isInteger(number) || number < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid zoneNo.",
        });
      }

      filter.zoneNo = number;
    }

    // Ward number
    if (wardNo !== undefined) {
      const number = Number(wardNo);

      if (!Number.isInteger(number) || number < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid wardNo.",
        });
      }

      filter.wardNo = number;
    }

    // Active status
    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = isActive === "true";
    }

    // Boundary
    if (!["true", "false"].includes(includeBoundary)) {
      return res.status(400).json({
        success: false,
        message: "includeBoundary must be true or false.",
      });
    }

    // Pagination
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const skip = (currentPage - 1) * perPage;

    let query = Area.find(filter)
      .populate("parentAreaId", "name type zoneNo wardNo")
      .populate("createdBy", "name email")
      .sort({ type: 1, zoneNo: 1, wardNo: 1, createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    if (includeBoundary === "false") {
      query = query.select("-boundary");
    }

    const [areas, total] = await Promise.all([
      query.lean(),
      Area.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Areas retrieved successfully.",
      total,
      pagination: {
        currentPage,
        limit: perPage,
        totalPages: Math.ceil(total / perPage),
      },
      filters: {
        type: type || null,
        zoneNo: zoneNo || null,
        wardNo: wardNo || null,
      },
      data: areas,
    });
  } catch (error) {
    console.error("GET ALL AREAS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve areas.",
      error: error.message,
    });
  }
};

module.exports = getAllAreas;
