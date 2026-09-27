const express =require("express");
const registration = require("./registration");
const login = require("./login");
const logout = require("./logout")
const router = express.Router()

 router.use("/auth",registration,login,logout)

module.exports = router