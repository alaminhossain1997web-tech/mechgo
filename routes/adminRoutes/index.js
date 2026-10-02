const express =require("express");
const services = require("./services/index");
const pending_technician = require("./pending_request/index")
const router = express.Router()

 router.use("/admin",services,pending_technician)

module.exports = router