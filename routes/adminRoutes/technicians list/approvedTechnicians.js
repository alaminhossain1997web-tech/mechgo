const express =require("express");
const getAllTechnicians = require("../../../controllers/adminContoller/technician list/getAllTechnicians");

const router = express.Router()

router.get("/approvedtechnicians",getAllTechnicians)

module.exports = router
