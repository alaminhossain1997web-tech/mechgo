const mongoose = require("mongoose");
const { requiredEnv } = require("./env");

const dbConnect = async () => {
  const connection = await mongoose.connect(requiredEnv("DB_URL"));
  console.log(`Database connected: ${connection.connection.name}`);
};

module.exports = dbConnect
