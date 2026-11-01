
const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    division: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    upazila: {
      type: String,
      default: "",
      trim: true,
    },

    // Geographic boundary of this area
    boundary: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        required: true,
      },

      coordinates: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index
areaSchema.index({ boundary: "2dsphere" });

module.exports = mongoose.model("Area", areaSchema);
