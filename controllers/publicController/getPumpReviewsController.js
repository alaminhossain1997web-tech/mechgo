const mongoose = require("mongoose");
const Pump = require("../../models/pumpSchema/pumpSchema");
const Review = require("../../models/Review/reviewSchema");

const getPumpReviewsController = async (req, res) => {
  try {
    const { pumpId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(pumpId)) {
      return res.status(400).json({ success: false, message: "Invalid pump ID." });
    }

    const pump = await Pump.findOne({
      _id: pumpId,
      approvalStatus: "approved",
      isActive: true,
    }).select("_id");
    if (!pump) {
      return res.status(404).json({ success: false, message: "Pump not found." });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const [reviews, total] = await Promise.all([
      Review.find({ pump: pump._id, isHidden: false })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments({ pump: pump._id, isHidden: false }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Pump reviews retrieved successfully.",
      data: {
        reviews,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("GET PUMP REVIEWS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve pump reviews." });
  }
};

module.exports = getPumpReviewsController;
