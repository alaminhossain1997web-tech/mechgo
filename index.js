require("./config/env");

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const dbConnect = require("./config/dbConfig");
const router = require("./routes/index");

const app = express();

const PORT = process.env.PORT || 8000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://pothseba.netlify.app",
];

app.use(
  cors({
    origin: "https://pothseba.netlify.app",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PothSeba Backend is running",
  });
});

app.use(router);
dbConnect();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PothSeba server is running on port: ${PORT}`);
});
