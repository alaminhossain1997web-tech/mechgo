const express = require("express");
const toggleReviewHiddenController = require("../../../controllers/adminContoller/reviewController/toggleReviewHiddenController");
const allowRiderOrAdmin = require("../../../middlewares/allowRiderOrAdmin")
const protect = require("../../../middlewares/protect")
const router = express.Router();
router.patch("/review/:id/hide",protect, allowRiderOrAdmin,toggleReviewHiddenController);

module.exports = router;
