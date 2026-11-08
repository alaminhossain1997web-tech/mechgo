const express = require("express");
const deleteArea = require("../../../controllers/adminContoller/Area_Controller/deleteArea");
const router = express.Router();

router.delete("/:areaId",deleteArea)

module.exports = router