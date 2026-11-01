
const mongoose = require("mongoose");

const pumpSchema = new mongoose.Schema(
  {
    // Pump Information
    name: {
      type: String,
      required: [true, "Pump name is required."],
      trim: true,
      maxlength: [150, "Pump name cannot exceed 150 characters."],
    },

    slug: {
      type: String,
      required: [true, "Pump slug is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters."],
    },


    phone: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      required: [true, "Pump address is required."],
      trim: true,
    },

    division: {
      type: String,
      required: [true, "Division is required."],
      trim: true,
    },

    district: {
      type: String,
      required: [true, "District is required."],
      trim: true,
    },

    // Automatically detected service areas
    areaIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Area",
        },
      ],
      required: true,
      validate: {
        validator: function (areaIds) {
          return Array.isArray(areaIds) && areaIds.length > 0;
        },
        message: "At least one service area is required.",
      },
    },

    // GeoJSON Point: [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coordinates) {
            return (
              Array.isArray(coordinates) &&
              coordinates.length === 2 &&
              Number.isFinite(coordinates[0]) &&
              Number.isFinite(coordinates[1]) &&
              coordinates[0] >= -180 &&
              coordinates[0] <= 180 &&
              coordinates[1] >= -90 &&
              coordinates[1] <= 90
            );
          },
          message:
            "Invalid location coordinates. Use [longitude, latitude].",
        },
      },
    },

    // Available Fuel Types
    fuelTypes: {
      type: [
        {
          type: String,
          enum: [
            "Petrol",
            "Octane",
            "Diesel",
            "CNG",
            "LPG",
            "EV",
          ],
        },
      ],
      default: [],
    },

    // Available Facilities
    facilities: {
      type: [
        {
          type: String,
          enum: [
            "Restroom",
            "Prayer Room",
            "Restaurant",
            "Car Wash",
            "Air Pump",
            "ATM",
            "Convenience Store",
            "EV Charging",
          ],
        },
      ],
      default: [],
    },

    // Pump Owner controls availability
    isOpen: {
      type: Boolean,
      default: false,
    },

    // Admin controls activation
    isActive: {
      type: Boolean,
      default: true,
    },

    // Admin verification
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Pump Owner account
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Pump owner is required."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Geospatial index for nearby pump search
pumpSchema.index({ location: "2dsphere" });


pumpSchema.index({
  name: "text",
  address: "text",
});

// Area lookup index
pumpSchema.index({ areaIds: 1 });

// Owner's pump lookup
pumpSchema.index({ createdBy: 1 });

// Rider-facing pump filtering
pumpSchema.index({
  isOpen: 1,
  isActive: 1,
  verificationStatus: 1,
});

module.exports = mongoose.model("Pump", pumpSchema);
