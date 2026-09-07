const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const requiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Add it to the project's .env file.`);
  }

  return value;
};

module.exports = { requiredEnv };
