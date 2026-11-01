const express =require("express");
const router = express.Router()
const create = require("./createPump")
const my_pumps = require("./getmyPump")
const Update_my_pumps = require("./updateMypump")
const update_status = require("./updatePumpStatus")

router.use("/pump", create, my_pumps, Update_my_pumps ,update_status)

module.exports = router
