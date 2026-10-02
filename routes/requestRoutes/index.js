const express =require("express");
const findTechnician =require("./FindTechnician")
const router = express.Router()

 router.use("/request",findTechnician)

module.exports = router