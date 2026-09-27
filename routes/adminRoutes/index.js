const express =require("express");
const services = require("./services/index");

const router = express.Router()

 router.use("/admin",services)

module.exports = router