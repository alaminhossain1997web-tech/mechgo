const express =require("express");
const approveTechnician = require("../../../controllers/adminContoller/pending_request/approveTechnician");
const router = express.Router()

 router.post("/approve_request",approveTechnician)

module.exports = router