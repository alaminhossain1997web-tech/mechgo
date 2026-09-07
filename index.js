require("./config/env");
const express =require("express");
const cookieParser = require("cookie-parser");
const dbConnect = require("./config/dbConfig");
const router = require("./routes");
const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(cookieParser());
app.use(router)
dbConnect();


app.listen(port,(req,res)=>{
    console.log(`server is running on port: ${port}`)
})
