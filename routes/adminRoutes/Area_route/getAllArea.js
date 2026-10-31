const express = require("express");
const getAllAreas = require("../../../controllers/adminContoller/Area_Controller/getAllAreas");
const router = express.Router();

router.get("/all_areas",getAllAreas)

module.exports = router