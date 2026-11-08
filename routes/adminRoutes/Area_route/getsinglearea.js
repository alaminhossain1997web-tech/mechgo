const express = require("express");
const getSingleArea = require("../../../controllers/adminContoller/Area_Controller/getSingleArea");
const router = express.Router();

router.get("/selected_area/:areaId",getSingleArea)

module.exports = router
