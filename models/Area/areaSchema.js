const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    nameBn: {
      type: String,
      trim: true,
      default: "",
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Area hierarchy
    type: {
      type: String,
      enum: ["Zone", "Ward", "Neighbourhood"],
      required: true,
      index: true,
    },

    // Zone -> null
    // Ward -> Zone _id
    // Neighbourhood -> Ward _id
    parentAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      default: null,
      index: true,
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

    cityCorporation: {
      type: String,
      default: "",
      trim: true,
    },

    zoneNo: {
      type: Number,
      default: null,
    },

    wardNo: {
      type: Number,
      default: null,
    },
    areaSqKm: {
      type: Number,
      default: null,
      min: 0,
    },

    // Actual geographic boundary.
    // Neighbourhood-এর boundary না থাকলেও document তৈরি করা যাবে।
    boundary: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
      },

      coordinates: {
        type: mongoose.Schema.Types.Mixed,
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
  },
);

// Zone-এর parent থাকবে না
// Ward এবং Neighbourhood-এর parent অবশ্যই থাকতে হবে
areaSchema.pre("validate", function (next) {
  if (this.type === "Zone" && this.parentAreaId) {
    return next(new Error("Zone cannot have a parent area"));
  }

  if (
    (this.type === "Ward" || this.type === "Neighbourhood") &&
    !this.parentAreaId
  ) {
    return next(new Error(`${this.type} must have a parent area`));
  }

  // Boundary দিলে valid GeoJSON structure থাকতে হবে
  if (this.boundary) {
    if (!this.boundary.type || !this.boundary.coordinates) {
      return next(new Error("Invalid area boundary"));
    }
  }

  next();
});

// Same parent-এর মধ্যে একই type-এর slug unique হবে
areaSchema.index(
  {
    type: 1,
    parentAreaId: 1,
    slug: 1,
  },
  {
    unique: true,
  },
);

// Geospatial index
areaSchema.index({ boundary: "2dsphere" });

module.exports = mongoose.model("Area", areaSchema);
