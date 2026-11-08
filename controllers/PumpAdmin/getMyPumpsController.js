const mongoose = require("mongoose");
const Pump = require("../../models/pumpSchema/pumpSchema");

// Get all pumps belonging to the logged-in Pump Owner
const getMyPumpsController = async (req, res) => {
  try {
    const ownerId = req.user?._id;

    // Authentication check
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Pump Owner ID.",
      });
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const skip = (page - 1) * limit;

    // Base filter: only logged-in owner's pumps
    const filter = {
      createdBy: ownerId,
    };

    // Search by pump name, address or slug
    if (req.query.search?.trim()) {
      const search = req.query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by verification status
    if (req.query.approvalStatus) {
      const allowedStatuses = ["pending", "approved", "rejected"];

      if (!allowedStatuses.includes(req.query.approvalStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification status.",
        });
      }

      filter.approvalStatus = req.query.approvalStatus;
    }

    // Filter by Open / Close status
    if (req.query.isOpen !== undefined) {
      if (!["true", "false"].includes(req.query.isOpen)) {
        return res.status(400).json({
          success: false,
          message: "isOpen must be true or false.",
        });
      }

      filter.isOpen = req.query.isOpen === "true";
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      if (!["true", "false"].includes(req.query.isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      filter.isActive = req.query.isActive === "true";
    }

    // Get pumps, total count and owner dashboard summary
    const [
      pumps,
      totalPumps,
      pendingPumps,
      approvedPumps,
      rejectedPumps,
      openPumps,
      closedPumps,
    ] = await Promise.all([
      Pump.find(filter)
        .populate("areaIds", "name slug division district")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Pump.countDocuments(filter),

      Pump.countDocuments({
        createdBy: ownerId,
        approvalStatus: "pending",
      }),

      Pump.countDocuments({
        createdBy: ownerId,
        approvalStatus: "approved",
      }),

      Pump.countDocuments({
        createdBy: ownerId,
        approvalStatus: "rejected",
      }),

      Pump.countDocuments({
        createdBy: ownerId,
        isOpen: true,
      }),

      Pump.countDocuments({
        createdBy: ownerId,
        isOpen: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Your pumps retrieved successfully.",

      data: {
        summary: {
          totalPumps: pendingPumps + approvedPumps + rejectedPumps,
          pendingPumps,
          approvedPumps,
          rejectedPumps,
          openPumps,
          closedPumps,
        },

        pumps,

        pagination: {
          totalPumps,
          currentPage: page,
          totalPages: Math.ceil(totalPumps / limit),
          limit,
          hasNextPage: page * limit < totalPumps,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get My Pumps Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your pumps.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = getMyPumpsController;
