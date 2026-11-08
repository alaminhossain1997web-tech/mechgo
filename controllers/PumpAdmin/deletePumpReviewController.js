const mongoose = require("mongoose");
const Review = require("../../models/Review/reviewSchema");
const recalcPumpRating = require("../../helpers/recalcPumpRating");

const deletePumpReviewController = async (req, res) => {
  try {
    const { pumpId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(pumpId)) {
      return res.status(400).json({ success: false, message: "Invalid pump ID." });
    }

    const review = await Review.findOneAndDelete({ pump: pumpId, user: req.user._id });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const ratingSummary = await recalcPumpRating(review.pump);
    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
      data: { pump: review.pump, ...ratingSummary },
    });
  } catch (error) {
    console.error("DELETE PUMP REVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete review." });
  }
};

module.exports = deletePumpReviewController;
