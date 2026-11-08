const express =require("express");
const {getUserRoleHistory } = require("../../../controllers/adminContoller/Role Controller/userRoleController");
const router = express.Router()

router.get("/history/:userId", getUserRoleHistory)

module.exports = router

