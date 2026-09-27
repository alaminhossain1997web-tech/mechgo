const express =require("express");
const createService = require("./createService");
const getallService = require("./getallServices")
const router = express.Router()

 router.use("/services",createService,getallService)

module.exports = router