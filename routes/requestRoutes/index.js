const express =require("express");
const findTechnician =require("./FindTechnician")
const createRequest = require("./sendRequest")
const router = express.Router()

 router.use("/request",findTechnician)
 router.use("/request",createRequest)

module.exports = router