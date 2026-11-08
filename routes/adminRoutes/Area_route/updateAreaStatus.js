const express = require("express");
const updateAreaStatus = require("../../../controllers/adminContoller/Area_Controller/updateAreaStatus");
const router = express.Router();

router.patch("/:areaId/status", updateAreaStatus)

module.exports = router
