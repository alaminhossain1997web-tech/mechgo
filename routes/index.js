const express =require("express");
const authRoute = require("./authRouts/index");
const tecnicianRoutes = require("./tecnicianRoutes/index")
const serviceRoute = require("./serviceRoutes/index")
const requestRoute = require("./requestRoutes/index")
const pumpAdmin = require("./pumpAdmin/index")
const adminRoute = require("./adminRoutes/index")
const protect = require("../middlewares/protect");
const allowTechnicianOrAdmin = require("../middlewares/allowTechnicianOrAdmin");
const publicRoutes = require("./publicRoutes");
const router = express.Router()
const base_url = process.env.BASE_URL

router.use(base_url,authRoute)
router.use(base_url,publicRoutes.router)
router.get(
  `${base_url}/pump/:id`,
  (req, res, next) => {
    if (req.params.id === "my_pumps") return next("route");
    return protect(req, res, next);
  },
  allowTechnicianOrAdmin,
  (req, res, next) => publicRoutes.getPublicPump(req, res, next),
);
//technician Route
router.use(base_url,protect,tecnicianRoutes)
router.use(base_url,protect,serviceRoute)

//User Route
router.use(base_url,protect,requestRoute)

//Pump Admin Route
router.use(base_url,protect,pumpAdmin)


//Pothseba Admin route
router.use(base_url,protect,adminRoute)

module.exports = router
