const express =require("express");
const approvedtechnicians = require("./approvedTechnicians");
const rejecttechnicians = require("./rejecttechnicians");
const router = express.Router()

 router.use("/list",approvedtechnicians)

module.exports = router