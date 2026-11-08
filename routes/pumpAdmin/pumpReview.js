const express = require("express");
const upsertPumpReviewController = require("../../controllers/PumpAdmin/upsertPumpReviewController");
const deletePumpReviewController = require("../../controllers/PumpAdmin/deletePumpReviewController");

const router = express.Router();
router.post("/:pumpId/review", upsertPumpReviewController);
router.delete("/:pumpId/review", deletePumpReviewController);

module.exports = router;
