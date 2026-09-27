const Technician = require("../../models/tecnicianSchema/tecnicianSchema");

const DriverRequest = require("../../models/requestSchema/driverRequestSchema");

const reverseGeocode = require("../../helpers/reverseGeocode");

const driverRequestController = async (req, res) => {
  try {
    const errors = {};

    // =========================
    // User
    // =========================

    const userId = req.user._id;

    // =========================
    // Request Body
    // =========================

    const {
      serviceId,
      description,
      location,
    } = req.body;

    // =========================
    // Validation
    // =========================

    if (!serviceId) {
      errors.serviceId = "Service id is required";
    }

    if (!location) {
      errors.location = "Location is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    // =========================
    // Location Validation
    // =========================

    if (
      location.type !== "Point" ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid location",
      });
    }

    // GeoJSON:
    // [longitude, latitude]

    const [longitude, latitude] = location.coordinates;

    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude must be numbers",
      });
    }

    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude or latitude",
      });
    }

    // =========================
    // Reverse Geocoding
    // =========================

    const locationData = await reverseGeocode(
      longitude,
      latitude
    );

    // =========================
    // Find Nearby Technician
    // =========================

    const technicians = await Technician.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [
              longitude,
              latitude,
            ],
          },

          distanceField: "distance",

          spherical: true,

          // 5 KM
          maxDistance: 5000,

          query: {
            isOnline: true,
            isAvailable: true,
            verificationStatus: "approved",

            // Service অনুযায়ী technician খোঁজা
            services: serviceId,
          },
        },
      },

      // nearest technician first
      {
        $limit: 1,
      },
    ]);

    // =========================
    // No Technician Found
    // =========================

    if (technicians.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No technician found nearby",
        location: {
          address: locationData.address,
          coordinates: [
            longitude,
            latitude,
          ],
        },
      });
    }

    // =========================
    // Nearest Technician
    // =========================

    const technician = technicians[0];

    // =========================
    // Create Request
    // =========================

    const request = await DriverRequest.create({
      userId,

      technicianId: technician._id,

      serviceId,

      location: {
        type: "Point",
        coordinates: [
          longitude,
          latitude,
        ],
      },

      description,

      status: "pending",
    });

    // =========================
    // Response
    // =========================

    return res.status(201).json({
      success: true,

      message: "Request sent successfully",

      data: {
        request,

        driverLocation: {
          address: locationData.address,
          place: locationData.place,
          district: locationData.district,
          country: locationData.country,

          coordinates: [
            longitude,
            latitude,
          ],
        },

        technician: {
          id: technician._id,

          shopname: technician.shopname,

          phone: technician.phone,

          address: technician.address,

          distance: `${(
            technician.distance / 1000
          ).toFixed(2)} km`,
        },
      },
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = driverRequestController;