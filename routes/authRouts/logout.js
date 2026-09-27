const express =require("express");
const logoutController = require("../../controllers/authController/logoutController");



const router = express.Router()

 router.post("/logout",logoutController)

module.exports = router