const express = require("express");
const updatePumpFuelsController = require("../../controllers/PumpAdmin/updatePumpFuelsController");

const router = express.Router();
router.patch("/my_pumps/:pumpId/fuels", updatePumpFuelsController);

module.exports = router;
