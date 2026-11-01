const express = require("express");
const updateMyPumpController = require("../../controllers/PumpAdmin/updateMyPumpController");
const router = express.Router()

router.patch("/my_pumps/Update_my_pumps:pumpId",updateMyPumpController);

module.exports = router