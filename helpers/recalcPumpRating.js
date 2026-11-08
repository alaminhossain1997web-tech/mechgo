const Pump = require("../models/pumpSchema/pumpSchema");
const Review = require("../models/Review/reviewSchema");

const recalcPumpRating = async (pumpId) => {
  const [aggregate] = await Review.aggregate([
    { $match: { pump: pumpId, isHidden: false } },
    {
      $group: {
        _id: "$pump",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = aggregate ? Math.round(aggregate.average * 10) / 10 : 0;
  const reviewCount = aggregate?.count || 0;

  await Pump.findByIdAndUpdate(pumpId, {
    $set: { avgRating, reviewCount },
  });

  return { avgRating, reviewCount };
};

module.exports = recalcPumpRating;
