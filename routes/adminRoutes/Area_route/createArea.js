const express = require("express");
const createArea = require("../../../controllers/adminContoller/Area_Controller/createArea");
const router = express.Router();

router.post("/create",createArea)

module.exports = router