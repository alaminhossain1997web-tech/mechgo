const jwt = require("jsonwebtoken");
const { requiredEnv } = require("../config/env");
const userSchema = require("../models/authSchema/userSchema");

const protect = async (req, res, next) => {
  try {

    const accessToken =
      req.cookies?.accessToken ||
      req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    // Token verify
    const decoded = jwt.verify(
      accessToken,
      requiredEnv("JWT_ACCESS_SECRET")
    );

    const user = await userSchema.findById(decoded.id);


    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    req.user = user;

    next();

  } catch (error) {
    console.log("Auth Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;
