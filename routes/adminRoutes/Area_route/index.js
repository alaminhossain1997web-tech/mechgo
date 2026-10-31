const express =require("express");
const create = require("./createArea")
const all_areas = require("./getAllArea")
const update_areas = require("./updateArea")
const selected_area = require("./getsinglearea")
const router = express.Router()

 router.use("/area",create,all_areas,update_areas,selected_area)

module.exports = router