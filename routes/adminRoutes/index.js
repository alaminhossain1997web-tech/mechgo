const express =require("express");
const adminPass = require("../../middlewares/adminpass");
const services = require("./services/index");
const pending_technician = require("./pending_request/index")
const Area_route = require("./Area_route/index")
const Pump_route = require("./pump/index")
const Review_route = require("./review/index")
const PendingRole = require("./User Role Assign Route/index")
const router = express.Router()

 router.use("/admin",adminPass,services,pending_technician,Area_route,Pump_route,Review_route,PendingRole)

module.exports = router
