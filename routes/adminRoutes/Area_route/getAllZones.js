const express = require("express");
const getAllZones = require("../../../controllers/adminContoller/Area_Controller/getAllZones");
const router = express.Router();

router.get("/zones",getAllZones)

module.exports = router