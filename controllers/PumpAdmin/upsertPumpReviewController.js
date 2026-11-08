const mongoose = require("mongoose");
const Pump = require("../../models/pumpSchema/pumpSchema");
const Review = require("../../models/Review/reviewSchema");
const recalcPumpRating = require("../../helpers/recalcPumpRating");

const upsertPumpReviewController = async (req, res) => {
  try {
    const { pumpId } = req.params;
    const { rating, comment } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(pumpId)) {
      return res.status(400).json({ success: false, message: "Invalid pump ID." });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be an integer from 1 to 5." });
    }
    if (comment !== undefined && (typeof comment !== "string" || comment.trim().length > 500)) {
      return res.status(400).json({ success: false, message: "Comment must be a string of 500 characters or fewer." });
    }

    const pump = await Pump.findById(pumpId).select("createdBy approvalStatus isActive");
    if (!pump) {
      return res.status(404).json({ success: false, message: "Pump not found." });
    }
    if (String(pump.createdBy) === String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Pump owners cannot review their own pump." });
    }
    if (pump.approvalStatus !== "approved" || pump.isActive !== true) {
      return res.status(409).json({ success: false, message: "Only approved and active pumps can be reviewed." });
    }

    const update = { rating };
    if (comment !== undefined) update.comment = comment.trim();

    const review = await Review.findOneAndUpdate(
      { pump: pump._id, user: req.user._id },
      { $set: update, $setOnInsert: { pump: pump._id, user: req.user._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).populate("user", "name");

    const ratingSummary = await recalcPumpRating(pump._id);
    return res.status(200).json({
      success: true,
      message: "Review saved successfully.",
      data: { review, ...ratingSummary },
    });
  } catch (error) {
    console.error("UPSERT PUMP REVIEW ERROR:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already reviewed this pump." });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ success: false, message: "Review validation failed." });
    }
    return res.status(500).json({ success: false, message: "Failed to save review." });
  }
};

module.exports = upsertPumpReviewController;
