const express =require("express");
const createRequestController = require("../../controllers/requestController/createRequestController");
const updateRequestStatusController = require("../../controllers/requestController/updateRequestStatusController");
const getRiderRequestsController = require("../../controllers/requestController/getRiderRequestsController");
const getRequestLocationController = require("../../controllers/requestController/getRequestLocationController");
const router = express.Router()

 router.post("/createRequest",createRequestController)
 router.patch("/:requestId/status",updateRequestStatusController)
 router.get("/my-requests",getRiderRequestsController)
 router.get("/:requestId/location",getRequestLocationController)

module.exports = router
