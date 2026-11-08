const express =require("express");
const approveTechnician = require("../../../controllers/adminContoller/pending_request/approveTechnician");
const router = express.Router()

router.patch("/:technicianId/approve", approveTechnician)
// Keep the original approval URL working for existing clients.
router.patch("/:technicianId", approveTechnician)

module.exports = router
