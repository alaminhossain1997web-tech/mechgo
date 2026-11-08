const express = require("express");
const getActiveAreas = require("../../controllers/publicController/getActiveAreasController");
const publicPumps = require("../../controllers/publicController/getPublicPumpsController");
const getPumpReviews = require("../../controllers/publicController/getPumpReviewsController");
const protect = require("../../middlewares/protect");
const allowRiderOrAdmin = require("../../middlewares/allowRiderOrAdmin");

const router = express.Router();
router.get("/area/list", protect, allowRiderOrAdmin, getActiveAreas);
router.get("/pump/by_area", protect, allowRiderOrAdmin, publicPumps.getByArea);
router.get("/pump/:pumpId/reviews", protect, allowRiderOrAdmin, getPumpReviews);

module.exports = { router, getPublicPump: publicPumps.getOne };
