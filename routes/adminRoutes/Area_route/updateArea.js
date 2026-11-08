const express = require("express");
const updateArea = require("../../../controllers/adminContoller/Area_Controller/updateArea");

const router = express.Router();

router.patch("/update_areas/:areaId",updateArea)

module.exports = router
