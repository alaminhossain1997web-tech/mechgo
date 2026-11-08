const express =require("express");
const {updateUserRole } = require("../../../controllers/adminContoller/Role Controller/userRoleController");
const router = express.Router()

router.patch("/update/:userId", updateUserRole)

module.exports = router
