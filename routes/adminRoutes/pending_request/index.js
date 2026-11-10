const express =require("express");
const approve = require("./approved_request");
const cancel = require("./cancel_request");
const all = require("./pendingTecnicians")
const router = express.Router()

 router.use("/pending_technician",all,approve,cancel)

module.exports = router