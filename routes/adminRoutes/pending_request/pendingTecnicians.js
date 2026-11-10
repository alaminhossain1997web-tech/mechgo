const express =require("express");
const getPendingTechnicians = require("../../../controllers/adminContoller/pending_request/pendingTechnicians");
const router = express.Router()

router.get("/all",getPendingTechnicians)

module.exports = router
