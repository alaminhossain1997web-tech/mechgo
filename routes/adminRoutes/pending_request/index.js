const express =require("express");
const approve_request = require("./approved_request")
const router = express.Router()

 router.use("/pending_technician",approve_request)

module.exports = router