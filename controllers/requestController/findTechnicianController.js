const Technician = require("../../models/tecnicianSchema/tecnicianSchema");

const reverseGeocode = require("../../helpers/reverseGeocode");

const findTechnicianController = async (req, res) => {
  try {
    // =====================================================
    // USER
    // =====================================================

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const userId = req.user._id;

    console.log("=================================");
    console.log("FIND TECHNICIAN");
    console.log("User ID:", userId);
    console.log("=================================");

    // =====================================================
    // QUERY
    // =====================================================

    const { longitude, latitude } = req.query;

    console.log("Received query:", {
      longitude,
      latitude,
    });

    // =====================================================
    // VALIDATION
    // =====================================================

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required",
      });
    }

    const longitudeNumber = Number(longitude);
    const latitudeNumber = Number(latitude);

    if (
      !Number.isFinite(longitudeNumber) ||
      !Number.isFinite(latitudeNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude must be valid numbers",
      });
    }

    if (
      longitudeNumber < -180 ||
      longitudeNumber > 180 ||
      latitudeNumber < -90 ||
      latitudeNumber > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude or latitude",
      });
    }

    // =====================================================
    // USER LOCATION
    // =====================================================

    const userCoordinates = [
      longitudeNumber,
      latitudeNumber,
    ];

    console.log("User coordinates:", userCoordinates);

    // =====================================================
    // REVERSE GEOCODING
    // =====================================================

    let locationData = {
      address: "",
      place: "",
      district: "",
      country: "",
    };

    try {
      locationData = await reverseGeocode(
        longitudeNumber,
        latitudeNumber
      );

      console.log(
        "Reverse geocoding successful:",
        locationData
      );
    } catch (reverseError) {
      console.error(
        "Reverse geocoding failed:",
        reverseError.message
      );

      // Reverse geocoding fail করলেও
      // technician search বন্ধ হবে না
    }

    // =====================================================
    // FIND ALL NEARBY TECHNICIANS
    // =====================================================

    console.log("Searching nearby technicians...");

    const technicians = await Technician.aggregate([
      // =====================================================
      // GEO SEARCH
      // =====================================================

      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: userCoordinates,
          },

          distanceField: "distance",

          spherical: true,

          maxDistance: 5000,

          query: {
            isOnline: true,
            isAvailable: true,
            verificationStatus: "approved",
          },
        },
      },

      // =====================================================
      // GET SERVICE DETAILS
      // =====================================================

      {
        $lookup: {
          from: "services",
          localField: "services",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
    ]);

    console.log(
      "Technicians found:",
      technicians.length
    );

    // =====================================================
    // NO TECHNICIAN
    // =====================================================

    if (technicians.length === 0) {
      return res.status(200).json({
        success: true,

        message: "No technician found nearby",

        data: {
          technicians: [],

          total: 0,

          driverLocation: {
            address: locationData?.address || "",
            place: locationData?.place || "",
            district: locationData?.district || "",
            country: locationData?.country || "",

            coordinates: userCoordinates,
          },
        },
      });
    }

    // =====================================================
    // FORMAT TECHNICIANS
    // =====================================================

    const formattedTechnicians = technicians.map(
      (technician) => {
        const distanceInKm =
          technician.distance / 1000;

        return {
          id: technician._id,

          shopname: technician.shopname || "",

          phone: technician.phone || "",

          address: technician.address || "",

          // =================================================
          // SERVICE NAMES
          // =================================================

          services:
            technician.serviceDetails?.map(
              (service) => service.name
            ) || [],

          location: technician.location,

          distance: Number(
            distanceInKm.toFixed(2)
          ),

          distanceText: `${distanceInKm.toFixed(
            2
          )} km`,

          isOnline: technician.isOnline,

          isAvailable: technician.isAvailable,

          verificationStatus:
            technician.verificationStatus,
        };
      }
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message: "Nearby technicians found successfully",

      data: {
        technicians: formattedTechnicians,

        total: formattedTechnicians.length,

        driverLocation: {
          address: locationData?.address || "",
          place: locationData?.place || "",
          district: locationData?.district || "",
          country: locationData?.country || "",

          coordinates: userCoordinates,
        },
      },
    });
  } catch (error) {
    // =====================================================
    // ERROR
    // =====================================================

   
    console.error(
      "FIND TECHNICIAN CONTROLLER ERROR"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    

    return res.status(500).json({
      success: false,

      message: "Internal server error",

      error: error.message,
    });
  }
};

module.exports = findTechnicianController;