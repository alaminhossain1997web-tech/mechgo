const express =require("express");
const createPumpController = require("../../controllers/PumpAdmin/createPumpController");
const router = express.Router()

 router.post("/create",createPumpController)

module.exports = router