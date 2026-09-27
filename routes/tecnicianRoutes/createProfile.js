const express =require("express");
const tecnicianController = require("../../controllers/tecnicianController/tecnicianController");

const router = express.Router()

 router.post("/tecnicianprofile",tecnicianController)

module.exports = router