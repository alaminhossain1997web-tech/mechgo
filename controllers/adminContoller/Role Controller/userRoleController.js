
const mongoose = require("mongoose");
const User = require("../../../models/authSchema/userSchema.js");
const RoleHistory = require("../../../models/RoleHistory/roleHistorySchema.js");

// Allowed roles for Admin-controlled assignment.
const ALLOWED_ROLES = [
  "User",
  "Rider",
  "Technician",
  "PumpOwner",
];

// ========================================
// 1. SEARCH USER BY EMAIL
// ========================================

const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    // Explicitly select only safe fields.
    const user = await User.findOne({
      email: normalizedEmail,
    })
      .select("_id name email role isActive createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User found successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Search User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search user.",
    });
  }
};

// ========================================
// 2. UPDATE USER ROLE
// PATCH /api/v1/admin/users/:userId/role
// ========================================

const updateUserRole = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId } = req.params;
    const { role, reason } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Validate new role
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    // Validate reason
    if (
      reason !== undefined &&
      (typeof reason !== "string" || reason.trim().length > 300)
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason must be a string with maximum 300 characters.",
      });
    }

    const adminId = req.user?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    if (userId === adminId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    let updatedUser;

    await session.withTransaction(async () => {
      // Find target user
      const targetUser = await User.findById(userId)
        .select("_id name email role")
        .session(session);

      if (!targetUser) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }

      // Never modify another Admin through this endpoint.
      if (targetUser.role === "Admin") {
        const error = new Error(
          "Admin role cannot be modified through this endpoint."
        );
        error.statusCode = 403;
        throw error;
      }

      const previousRole = targetUser.role;

      if (previousRole === role) {
        const error = new Error(
          "User already has this role."
        );
        error.statusCode = 409;
        throw error;
      }

      // Update user role.
      const result = await User.findOneAndUpdate(
        {
          _id: userId,
          role: previousRole,
        },
        {
          $set: {
            role,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      )
        .select("_id name email role isActive createdAt")
        .lean();

      if (!result) {
        const error = new Error(
          "User role changed by another request. Please try again."
        );
        error.statusCode = 409;
        throw error;
      }

      // Create audit history in the same transaction.
      await RoleHistory.create(
        [
          {
            userId: targetUser._id,
            previousRole,
            newRole: role,
            changedBy: adminId,
            reason: reason?.trim() || "",
            ipAddress: req.ip,
            userAgent: req.get("user-agent") || "",
          },
        ],
        { session }
      );

      updatedUser = result;
    });

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User Role Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : "Failed to update user role.",
    });
  } finally {
    await session.endSession();
  }
};

// ========================================
// 3. GET USER ROLE HISTORY
// GET /api/v1/admin/users/:userId/role-history
// ========================================

const getUserRoleHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const userExists = await User.exists({
      _id: userId,
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const [history, total] = await Promise.all([
      RoleHistory.find({ userId })
        .populate({
          path: "changedBy",
          select: "name email",
        })
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      RoleHistory.countDocuments({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Role history retrieved successfully.",
      data: history,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get User Role History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve role history.",
    });
  }
};

module.exports = {
  searchUserByEmail,
  updateUserRole,
  getUserRoleHistory,
};
