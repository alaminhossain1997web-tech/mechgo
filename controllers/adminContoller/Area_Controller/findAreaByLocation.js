
const Area = require("../../../models/Area/areaSchema");

const findAreaByLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      lat === undefined ||
      lng === undefined ||
      lat === null ||
      lng === null ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    const point = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    // Find matching Ward and Neighbourhood polygons.
    const matchedAreas = await Area.find({
      type: { $in: ["Ward", "Neighbourhood"] },
      isActive: true,
      boundary: {
        $geoIntersects: {
          $geometry: point,
        },
      },
    })
      .select("-boundary")
      .lean();

    if (!matchedAreas.length) {
      return res.status(404).json({
        success: false,
        message: "No matching area found for this location",
        data: null,
      });
    }

    const results = [];

    for (const matchedArea of matchedAreas) {
      let ward = null;
      let neighbourhood = null;

      if (matchedArea.type === "Ward") {
        ward = matchedArea;
      } else {
        neighbourhood = matchedArea;

        ward = await Area.findOne({
          _id: matchedArea.parentAreaId,
          type: "Ward",
        })
          .select("-boundary")
          .lean();
      }

      let zone = null;

      if (ward) {
        zone = await Area.findOne({
          _id: ward.parentAreaId,
          type: "Zone",
        })
          .select("-boundary")
          .lean();
      }

      results.push({
        neighbourhood,
        ward,
        zone,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Area location matched successfully",
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
      totalMatches: results.length,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to find area by location",
      error: error.message,
    });
  }
};

module.exports = findAreaByLocation;
