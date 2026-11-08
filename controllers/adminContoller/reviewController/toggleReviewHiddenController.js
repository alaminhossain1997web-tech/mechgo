const mongoose = require("mongoose");
const Review = require("../../../models/Review/reviewSchema");
const recalcPumpRating = require("../../../helpers/recalcPumpRating");

const toggleReviewHiddenController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID." });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    review.isHidden = !review.isHidden;
    await review.save();
    const ratingSummary = await recalcPumpRating(review.pump);

    return res.status(200).json({
      success: true,
      message: review.isHidden ? "Review hidden successfully." : "Review unhidden successfully.",
      data: { review, ...ratingSummary },
    });
  } catch (error) {
    console.error("TOGGLE REVIEW HIDDEN ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update review visibility." });
  }
};

module.exports = toggleReviewHiddenController;
