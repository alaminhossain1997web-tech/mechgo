const tecnicianSchema = require("../../models/tecnicianSchema/tecnicianSchema");
const reverseGeocode = require("../../helpers/reverseGeocode");

const tecnicianController = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      shopname,
      phone,
      services,
      location,
    } = req.body;

    // =========================
    // Validation
    // =========================

    const errors = {};

    if (!shopname || !shopname.trim()) {
      errors.shopname = "Shop name is required";
    }

    if (!phone || !phone.trim()) {
      errors.phone = "Phone number is required";
    }

    if (
      !services ||
      !Array.isArray(services) ||
      services.length === 0
    ) {
      errors.services = "Please select at least one service";
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
    // Check Existing Profile
    // =========================

    const existingProfile = await tecnicianSchema.findOne({
      userId,
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Technician profile already exists",
        technicianProfile: true,
        technician: existingProfile,
      });
    }

    // =========================
    // Validate Location
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

    // GeoJSON format:
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

    // =========================
    // Coordinate Range
    // =========================

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
    // Create Technician Profile
    // =========================

    const technician = await tecnicianSchema.create({
      userId,
      shopname: shopname.trim(),
      phone: phone.trim(),
      services,

      location: {
        type: "Point",
        coordinates: [
          longitude,
          latitude,
        ],
      },

      address: locationData.address,
    });

    // =========================
    // Populate Services
    // =========================

    const result = await tecnicianSchema
      .findById(technician._id)
      .populate("services");

    // =========================
    // Response
    // =========================

    return res.status(201).json({
      success: true,
      message: "Technician profile created successfully",

      technicianProfile: true,

      technician: result,

      location: {
        address: locationData.address,
        place: locationData.place,
        district: locationData.district,
        country: locationData.country,
        coordinates: [
          longitude,
          latitude,
        ],
      },
    });

  } catch (error) {
    console.log("Technician Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = tecnicianController;