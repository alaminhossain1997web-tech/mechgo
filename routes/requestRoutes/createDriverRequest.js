const express =require("express");
const driverRequestController = require("../../controllers/requestController/driverRequestController");
const router = express.Router()

 router.post("/driver-request",driverRequestController)

module.exports = router