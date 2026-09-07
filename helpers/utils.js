const jwt = require("jsonwebtoken");
const { requiredEnv } = require("../config/env");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    requiredEnv("JWT_ACCESS_SECRET"),
    {
      expiresIn: "1d",
    }
  );
};

module.exports = {
  generateAccessToken,
};
