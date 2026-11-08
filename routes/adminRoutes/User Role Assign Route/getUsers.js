const express =require("express");
const { searchUserByEmail } = require("../../../controllers/adminContoller/Role Controller/userRoleController");
const router = express.Router()

 router.get("/search",searchUserByEmail)

module.exports = router
