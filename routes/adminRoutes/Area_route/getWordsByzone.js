const express = require("express");
const getWardsByZone = require("../../../controllers/adminContoller/Area_Controller/getWardsByZone");
const router = express.Router();

router.get("/zones/:zoneId/wards", getWardsByZone)

module.exports = router
