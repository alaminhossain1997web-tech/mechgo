const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Area name is required"],
      trim: true,
      maxlength: [100, "Area name cannot exceed 100 characters"],
    },


    slug: {
      type: String,
      required: [true, "Area slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },


    division: {
      type: String,
      required: [true, "Division is required"],
      trim: true,
    },


    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },

    upazila: {
      type: String,
      trim: true,
      default: "",
    },


    isActive: {
      type: Boolean,
      default: true,
    },


    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

areaSchema.index({
  division: 1,
  district: 1,
  name: 1,
});

module.exports = mongoose.model("Area", areaSchema);