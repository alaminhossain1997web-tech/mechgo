const express =require("express");
const getTechnicianRequestsController = require("../../controllers/tecnicianController/getTechnicianRequestsController");

const router = express.Router()

 router.get("/getrequest",getTechnicianRequestsController)

module.exports = router