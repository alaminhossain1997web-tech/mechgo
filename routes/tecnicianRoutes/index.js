const express =require("express");
const tecnicianprofile = require("./createProfile")
const getrequest =require("./getRequest")
const status =require("./tecnichianStatus")
const router = express.Router()

 router.use("/create-profile",tecnicianprofile)
 router.use("/request",getrequest)
 router.use("/technician",status)

module.exports = router
