require("./config/env");
const express =require("express");
const cookieParser = require("cookie-parser");
const dbConnect = require("./config/dbConfig");
const cors =  require("cors");
const router = require("./routes");
const app = express()
const port = process.env.PORT
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json())
app.use(cookieParser());
app.use(router)
dbConnect();


app.listen(port, "0.0.0.0",(req,res)=>{
    console.log(`server is running on port: ${port}`)
})
