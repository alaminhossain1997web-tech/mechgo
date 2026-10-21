const express =require("express");
const { updateTechnicianStatus } = require("../../controllers/tecnicianController/updateTechnicianStatus");


const router = express.Router()

 router.patch("/status",updateTechnicianStatus)

module.exports = router