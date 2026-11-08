const express = require("express");
const getAreaHierarchy = require("../../../controllers/adminContoller/Area_Controller/getAreaHierarchy");
const router = express.Router();

router.get("/hierarchy",getAreaHierarchy)

module.exports = router