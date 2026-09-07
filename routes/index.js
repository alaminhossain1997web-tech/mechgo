const express =require("express");
const authRoute = require("./authRouts");
const router = express.Router()
const base_url = process.env.BASE_URL

router.use(base_url,authRoute)

module.exports = router