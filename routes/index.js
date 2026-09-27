const express =require("express");
const authRoute = require("./authRouts/index");
const tecnicianRoutes = require("./tecnicianRoutes/index")
const requestRoute = require("./requestRoutes/index")
const adminRoute = require("./adminRoutes/index")
const protect = require("../middlwares/protect")
const router = express.Router()
const base_url = process.env.BASE_URL

router.use(base_url,authRoute)
router.use(base_url,protect,tecnicianRoutes)
router.use(base_url,protect,requestRoute)
router.use(base_url,protect,adminRoute)

module.exports = router