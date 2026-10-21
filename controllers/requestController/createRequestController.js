
const mongoose = require("mongoose");

const Technician = require("../../models/tecnicianSchema/tecnicianSchema");
const DriverRequest = require("../../models/requestSchema/driverRequestSchema");

const createRequestController = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const { technicianId, serviceId, location, description } = req.body;

    if (
      !technicianId ||
      !serviceId ||
      !location ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Technician, service, location and description are required",
      });
    }

    if (
      !mongoose.isValidObjectId(technicianId) ||
      !mongoose.isValidObjectId(serviceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid technician or service ID",
      });
    }

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

    const [longitude, latitude] = location.coordinates;

    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number" ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
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

    const technician = await Technician.findOne({
      _id: technicianId,
      isOnline: true,
      isAvailable: true,
      verificationStatus: "approved",
    });

    if (!technician) {
      return res.status(409).json({
        success: false,
        message: "Technician is no longer available",
      });
    }

    const offersService = technician.services.some(
      (id) => id.toString() === serviceId
    );

    if (!offersService) {
      return res.status(400).json({
        success: false,
        message: "Selected service is not offered by this technician",
      });
    }

    const request = await DriverRequest.create({
      userId: req.user._id,
      technicianId,
      serviceId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      description: description.trim(),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Service request sent successfully",
      data: { request },
    });
  } catch (error) {
    console.error("CREATE REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = createRequestController;
