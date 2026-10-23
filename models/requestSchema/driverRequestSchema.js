
const mongoose = require("mongoose");

const driverRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "services",
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coordinates) =>
            Array.isArray(coordinates) &&
            coordinates.length === 2 &&
            coordinates.every(Number.isFinite) &&
            coordinates[0] >= -180 &&
            coordinates[0] <= 180 &&
            coordinates[1] >= -90 &&
            coordinates[1] <= 90,
          message: "Invalid longitude or latitude",
        },
      },
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },

    // Temporary per-request GPS position; never modify Technician.location.

    // Temporary GPS position; optional when creating a request.
    liveLocation: {
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator: (coordinates) =>
            coordinates === undefined ||
            (
              Array.isArray(coordinates) &&
              coordinates.length === 2 &&
              coordinates.every(Number.isFinite) &&
              coordinates[0] >= -180 &&
              coordinates[0] <= 180 &&
              coordinates[1] >= -90 &&
              coordinates[1] <= 90
            ),
          message: "Invalid live location coordinates",
        },
      },
      updatedAt: Date,
    },

  },
  { timestamps: true }
);

driverRequestSchema.index({ technicianId: 1, status: 1 });
driverRequestSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("driverRequest", driverRequestSchema);
