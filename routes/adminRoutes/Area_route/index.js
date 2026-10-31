const express =require("express");
const create = require("./createArea")
const router = express.Router()

 router.use("/area",create)

module.exports = router