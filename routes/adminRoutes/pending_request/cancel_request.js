const express =require("express");
const rejectTechnician = require("../../../controllers/adminContoller/pending_request/rejectTechnician");
const router = express.Router()

router.patch("/:technicianId/reject", rejectTechnician)

module.exports = router
