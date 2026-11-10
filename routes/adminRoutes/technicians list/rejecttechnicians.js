const express =require("express");
const getAllRejectedTechnicians = require("../../../controllers/adminContoller/technician list/getAllRejectedTechnicians");

const router = express.Router()

router.get("/rejecttechnicians",getAllRejectedTechnicians)

module.exports = router
