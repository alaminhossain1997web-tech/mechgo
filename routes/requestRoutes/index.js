const express =require("express");
const findTechnician =require("./FindTechnician")
const createRequest = require("./sendRequest")
const getTechnicianRequestsController = require("../../controllers/tecnicianController/getTechnicianRequestsController");
const router = express.Router()

 router.use("/request",findTechnician)
 router.use("/request",createRequest)
// Compatibility endpoint in the request API namespace, scoped to the
// authenticated Technician profile by the controller.
router.get("/request/getrequest",getTechnicianRequestsController)

module.exports = router
