const express =require("express");
const getallService= require("./getAllService")
const router = express.Router()

 router.use("/allservice",getallService)

module.exports = router