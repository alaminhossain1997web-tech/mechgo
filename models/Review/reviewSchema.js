const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    pump: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pump",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer from 1 to 5.",
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ pump: 1, user: 1 }, { unique: true });
reviewSchema.index({ pump: 1, isHidden: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
