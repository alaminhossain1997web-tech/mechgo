const express = require("express");
const findAreaByLocation = require("../../../controllers/adminContoller/Area_Controller/findAreaByLocation");
const router = express.Router();

router.post("/find-by-location", findAreaByLocation)

module.exports = router
