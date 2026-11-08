const mongoose = require("mongoose");
const Pump = require("../../models/pumpSchema/pumpSchema");
const generateSlug = require("../../helpers/generateSlug");
const findPumpAreas = require("../../helpers/findPumpAreas");
const getPumpLocationName = require("../../helpers/getPumpLocationName");

const createPumpController = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    const {
      name,
      description = "",
      phone,
      email = "",
      address,
      lat,
      lng,
      fuels = [],
      facilities = [],
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof address !== "string" ||
      !address.trim() ||
      lat === undefined ||
      lat === null ||
      lat === "" ||
      lng === undefined ||
      lng === null ||
      lng === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, address, latitude and longitude are required.",
      });
    }

    //Validate latitude and longitude
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude.",
      });
    }

    // Validate fuels
    if (
      !Array.isArray(fuels) ||
      fuels.some((item) =>
        !item ||
        !["Petrol", "Octane", "Diesel", "CNG", "LPG", "EV"].includes(item.type) ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0 ||
        (item.available !== undefined && typeof item.available !== "boolean"),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Fuels must be an array of valid fuel objects.",
      });
    }

    // Validate facilities
    if (
      !Array.isArray(facilities) ||
      facilities.some((item) => typeof item !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Facilities must be an array of strings.",
      });
    }

    // Validate optional text fields
    if (typeof description !== "string" || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Description and email must be strings.",
      });
    }

    // Generate slug
    const slug = generateSlug(name.trim());

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Invalid pump name. Unable to generate slug.",
      });
    }

    // Check duplicate slug
    const existingPump = await Pump.findOne({ slug }).select("_id");

    if (existingPump) {
      return res.status(409).json({
        success: false,
        message: "A pump with this name already exists.",
      });
    }

    //  Detect matching service areas using GPS
    const matchedAreas = await findPumpAreas(longitude, latitude);

    if (!matchedAreas.length) {
      return res.status(400).json({
        success: false,
        message: "Service not available in this location",
      });
    }

    // Select primary area
    const primaryArea = matchedAreas[0];

    if (!primaryArea.division || !primaryArea.district) {
      return res.status(400).json({
        success: false,
        message:
          "The detected service area has incomplete division or district information.",
      });
    }

    // Automatically generate area IDs
    const areaIds = matchedAreas.map((area) => area._id);
    const locationName = await getPumpLocationName(
      longitude,
      latitude,
      primaryArea.name,
    );

    const pump = await Pump.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),

      // Automatically detected from Area
      division: primaryArea.division,
      district: primaryArea.district,
      locationName,
      areaIds,

      // GeoJSON location
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },

      fuels: fuels.map((fuel) => ({
        type: fuel.type,
        price: Number(fuel.price),
        available: fuel.available !== false,
      })),
      facilities,

      // Backend-controlled fields
      approvalStatus: "pending",
      isOpen: false,
      isActive: true,

      // Authenticated Pump Owner
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Pump created successfully. Waiting for admin approval.",

      data: {
        ...pump.toObject(),

        detectedAreas: matchedAreas.map((area) => ({
          _id: area._id,
          name: area.name,
        })),
      },
    });
  } catch (error) {
    console.error("CREATE PUMP ERROR:", error);

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A pump with this name already exists.",
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Pump validation failed.",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    // Invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create pump. Please try again.",
    });
  }
};

module.exports = createPumpController;
