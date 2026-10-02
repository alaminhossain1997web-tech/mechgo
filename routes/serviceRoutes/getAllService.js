const express =require("express");
const getAllServiceController = require("../../controllers/adminContoller/serviceController/getallServices");
const router = express.Router()

 router.get("/getallService",getAllServiceController)

module.exports = router