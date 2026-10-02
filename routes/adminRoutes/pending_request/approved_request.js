const express =require("express");
const approveTechnician = require("../../../controllers/adminContoller/pending_request/approveTechnician");
const router = express.Router()

 router.patch("/:technicianId",approveTechnician)

module.exports = router