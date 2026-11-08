const express = require("express");
const updateMyPumpController = require("../../controllers/PumpAdmin/updateMyPumpController");
const router = express.Router()

router.patch("/my_pumps/:pumpId/update",updateMyPumpController);

module.exports = router
