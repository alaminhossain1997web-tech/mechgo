const express = require("express");
const router = express.Router();

const createArea = require("./createArea");
const allAreas = require("./getAllArea");
const updateAreas = require("./updateArea");
const selectedArea = require("./getsinglearea");
const updateAreaStatus = require("./updateAreaStatus");
const findAreaByLocation = require("./findAreaByLocation");
const wardsByZone = require("./getWordsByzone");
const areaHierarchy = require("./getAreaHierarchy");
const areaChildren = require("./getAreaChildren");
const deleteArea = require("./deleteArea");

router.use("/area", createArea);
router.use("/area", allAreas);
router.use("/area", updateAreas);
router.use("/area", selectedArea);
router.use("/area", updateAreaStatus);
router.use("/area", findAreaByLocation);
router.use("/area", wardsByZone);
router.use("/area", areaHierarchy);
router.use("/area", areaChildren);
router.use("/area", deleteArea);

module.exports = router;
