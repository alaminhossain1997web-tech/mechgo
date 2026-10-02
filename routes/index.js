const express =require("express");
const authRoute = require("./authRouts/index");
const tecnicianRoutes = require("./tecnicianRoutes/index")
const serviceRoute = require("./serviceRoutes/index")
const requestRoute = require("./requestRoutes/index")
const adminRoute = require("./adminRoutes/index")
const protect = require("../middlwares/protect");
const adminPass = require("../middlwares/adminpass");
const router = express.Router()
const base_url = process.env.BASE_URL

router.use(base_url,authRoute)
//technician Route
router.use(base_url,protect,tecnicianRoutes)
router.use(base_url,protect,serviceRoute)

//User Route
router.use(base_url,protect,requestRoute)
//Admin route
router.use(base_url,protect,adminPass,adminRoute)

module.exports = router