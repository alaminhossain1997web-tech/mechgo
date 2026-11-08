const reverseGeocode = require("./reverseGeocode");

const getPumpLocationName = async (longitude, latitude, fallback = "") => {
  try {
    const location = await reverseGeocode(longitude, latitude);
    return location.place || location.address || fallback;
  } catch (error) {
    console.error("Pump reverse geocoding failed:", error.message);
    return fallback;
  }
};

module.exports = getPumpLocationName;
