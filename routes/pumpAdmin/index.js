const express =require("express");
const router = express.Router()
const create = require("./createPump")
const my_pumps = require("./getmyPump")
const Update_my_pumps = require("./updateMypump")
const update_status = require("./updatePumpStatus")
const update_fuels = require("./updatePumpFuels")
const pump_reviews = require("./pumpReview")

router.use("/pump", create, my_pumps, Update_my_pumps ,update_status, update_fuels, pump_reviews)

module.exports = router
