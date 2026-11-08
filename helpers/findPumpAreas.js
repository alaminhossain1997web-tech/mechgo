const Area = require("../models/Area/areaSchema");

const findPumpAreas = async (longitude, latitude) => {
  const areas = await Area.find({
    isActive: true,
    boundary: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
    },
  }).select("_id name division district upazila");

  areas.sort((a, b) => {
    const upazilaMatch = Number(Boolean(b.upazila)) - Number(Boolean(a.upazila));
    return upazilaMatch || String(a._id).localeCompare(String(b._id));
  });

  return areas;
};

module.exports = findPumpAreas;
