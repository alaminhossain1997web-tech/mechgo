const express =require("express");
const registration = require("./registration");
const login = require("./login")
const router = express.Router()

 router.use("/auth",registration,login)

module.exports = router