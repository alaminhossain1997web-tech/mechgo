const mongoose = require("mongoose");

const technicianSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },

  shopname: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  services: [
    {
      type:  mongoose.Schema.Types.ObjectId,
      ref: "services"
    },
  ],

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },

    coordinates: {
      type: [Number],
      required: true,
    },
  },

  isOnline: {
    type: Boolean,
    default: false,
  },

  isAvailable: {
    type: Boolean,
    default: false,
  },

  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

// GeoSpatial Index
technicianSchema.index({
  location: "2dsphere",
});

module.exports = mongoose.model("Technician", technicianSchema);