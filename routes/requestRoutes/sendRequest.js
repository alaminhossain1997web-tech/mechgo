const express =require("express");
const createRequestController = require("../../controllers/requestController/createRequestController");
const router = express.Router()

 router.post("/createRequest",createRequestController)

module.exports = router