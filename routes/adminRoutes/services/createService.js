const express =require("express");
const serviceController = require("../../../controllers/adminContoller/serviceController/createService")
const router = express.Router()

 router.post("/createService",serviceController)

module.exports = router