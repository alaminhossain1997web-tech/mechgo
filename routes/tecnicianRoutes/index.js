const express =require("express");
const tecnicianprofile = require("./createProfile")

const router = express.Router()

 router.use("/create-profile",tecnicianprofile)

module.exports = router