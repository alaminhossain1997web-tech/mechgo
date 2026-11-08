const mongoose = require("mongoose");

const roleHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    previousRole: {
      type: String,
      required: true
    },

    newRole: {
      type: String,
      required: true
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 300
    },

    ipAddress: String,
    userAgent: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RoleHistory",
  roleHistorySchema
);
