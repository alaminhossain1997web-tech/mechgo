const express = require("express");
const updatePumpStatusController = require("../../controllers/PumpAdmin/updatePumpStatusController");
const router = express.Router()

router.patch("/my_pumps/:pumpId/status",updatePumpStatusController);

module.exports = router
