const express =require("express");
const findTechnicianController = require("../../controllers/requestController/findTechnicianController");
const router = express.Router()

 router.get("/findTechnician",findTechnicianController)

module.exports = router