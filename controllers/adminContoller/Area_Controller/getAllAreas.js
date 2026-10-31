const Area = require("../../../models/Area/areaSchema");

const getAllAreas = async (req, res) => {
  try {
    const {
      search,
      division,
      district,
      upazila,
      isActive,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ];
    }

    if (division) {
      filter.division = {
        $regex: division,
        $options: "i",
      };
    }

    if (district) {
      filter.district = {
        $regex: district,
        $options: "i",
      };
    }

    if (upazila) {
      filter.upazila = {
        $regex: upazila,
        $options: "i",
      };
    }

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = isActive === "true";
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const skip = (currentPage - 1) * perPage;

    const [areas, totalAreas] = await Promise.all([
      Area.find(filter)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage),

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