const express =require("express");
const adminPass = require("../../middlwares/adminpass");
const services = require("./services/index");
const pending_technician = require("./pending_request/index")
const Area_route = require("./Area_route/index")
const router = express.Router()

 router.use("/admin",adminPass,services,pending_technician,Area_route)

module.exports = router