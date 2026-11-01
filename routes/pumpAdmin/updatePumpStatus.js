const express = require("express");
const updatePumpStatusController = require("../../controllers/PumpAdmin/updatePumpStatusController");
const router = express.Router()

router.patch("/my_pumps/update_status:pumpId",updatePumpStatusController);

module.exports = router