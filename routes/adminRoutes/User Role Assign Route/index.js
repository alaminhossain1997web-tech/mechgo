const express =require("express");
const searchUser = require("./getUsers");
const updateRole = require("./updateUserRole");
const RoleHistory = require("./getRoleChangeHistory")
const router = express.Router()

router.use("/role", searchUser, updateRole, RoleHistory)

module.exports = router
