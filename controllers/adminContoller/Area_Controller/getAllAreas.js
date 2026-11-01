
const Area = require("../../../models/Area/areaSchema");

const getAllAreas = async (req, res) => {
  try {
    const {
      search,
      division,
      district,
      upazila,
      isActive,
      includeBoundary = "false",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // 1. Search filter
    if (search?.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { district: searchRegex },
      ];
    }

    // 2. Division filter
    if (division?.trim()) {
      filter.division = {
        $regex: division.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    // 3. District filter
    if (district?.trim()) {
      filter.district = {
        $regex: district.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    // 4. Upazila filter
    if (upazila?.trim()) {
      filter.upazila = {
        $regex: upazila.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    // 5. Active status filter
    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = isActive === "true";
    }

    // 6. Boundary query validation
    if (!["true", "false"].includes(includeBoundary)) {
      return res.status(400).json({
        success: false,
        message: "includeBoundary must be true or false.",
      });
    }

    // 7. Pagination
    const currentPage = Math.max(1, parseInt(page, 10) || 1);

    const perPage = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const skip = (currentPage - 1) * perPage;

    // 8. Query
    let areaQuery = Area.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    // Exclude large boundary data by default
    if (includeBoundary === "false") {
      areaQuery = areaQuery.select("-boundary");
    }

    const [areas, totalAreas] = await Promise.all([
      areaQuery,
      Area.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Areas retrieved successfully.",
      total: totalAreas,
      pagination: {
        currentPage,
        limit: perPage,
        totalPages: Math.ceil(totalAreas / perPage),
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
