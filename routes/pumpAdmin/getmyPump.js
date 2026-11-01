const express =require("express");
const getMyPumpsController = require("../../controllers/PumpAdmin/getMyPumpsController");
const router = express.Router()

 router.get("/my_pumps",getMyPumpsController)

module.exports = router