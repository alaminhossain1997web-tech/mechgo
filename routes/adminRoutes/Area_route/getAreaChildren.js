const express = require("express");
const getAreaChildren = require("../../../controllers/adminContoller/Area_Controller/getAreaChildren");
const router = express.Router();

router.get("/:areaId/children",getAreaChildren)

module.exports = router