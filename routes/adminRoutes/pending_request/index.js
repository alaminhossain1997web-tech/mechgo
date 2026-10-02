const express =require("express");
const approve = require("./approved_request");
const cancel = require("./cancel_request")
const router = express.Router()

 router.use("/pending_technician",approve,cancel)

module.exports = router