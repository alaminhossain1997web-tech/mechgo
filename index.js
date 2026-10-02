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
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Postman / server-to-server request
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PothSeba Backend is running",
  });
});

// API Routes
app.use(router);

// Database
dbConnect();

// Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`PothSeba server is running on port: ${PORT}`);
});