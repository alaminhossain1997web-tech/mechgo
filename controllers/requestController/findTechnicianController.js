
const Technician = require("../../models/tecnicianSchema/tecnicianSchema");
const reverseGeocode = require("../../helpers/reverseGeocode");

const findTechnicianController = async (req, res) => {
  try {
    // 1. Authentication
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const userId = req.user._id;

    // 2. Get and validate coordinates
    const { longitude, latitude } = req.query;

    if (
      longitude === undefined ||
      latitude === undefined ||
      longitude === "" ||
      latitude === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required",
      });
    }

    const longitudeNumber = Number(longitude);
    const latitudeNumber = Number(latitude);

    if (
      !Number.isFinite(longitudeNumber) ||
      !Number.isFinite(latitudeNumber) ||
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

    // GeoJSON coordinates must be [longitude, latitude]
    const userCoordinates = [
      longitudeNumber,
      latitudeNumber,
    ];

    // 3. Reverse geocoding
    let locationData = {
      address: "",
      place: "",
      district: "",
      country: "",
    };

    try {
      const result = await reverseGeocode(
        longitudeNumber,
        latitudeNumber
      );

      if (result && typeof result === "object") {
        locationData = {
          address: result.address || "",
          place: result.place || "",
          district: result.district || "",
          country: result.country || "",
        };
      }
    } catch (error) {
      // Reverse geocoding failure should not stop technician search
      console.error("Reverse geocoding failed:", error.message);
    }

    // 4. Find nearby available technicians
    const technicians = await Technician.aggregate([
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

      // Join service documents
      {
        $lookup: {
          from: "services",
          localField: "services",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },

      // Optional: ensure predictable nearest-first order
      {
        $sort: {
          distance: 1,
        },
      },
    ]);

    // 5. Shared rider location information
    const driverLocation = {
      address: locationData.address,
      place: locationData.place,
      district: locationData.district,
      country: locationData.country,
      coordinates: userCoordinates,
    };

    // 6. No technicians found
    if (technicians.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No technician found nearby",
        data: {
          technicians: [],
          total: 0,
          driverLocation,
        },
      });
    }

    // 7. Format technician data
    const formattedTechnicians = technicians.map(
      (technician) => {
        const distanceInKm = technician.distance / 1000;

        return {
          // Use this ID as technicianId when creating a request
          id: technician._id,

          shopname: technician.shopname || "",
          phone: technician.phone || "",
          address: technician.address || "",

          // Include service IDs so the rider can select a service
          services: (technician.serviceDetails || []).map(
            (service) => ({
              id: service._id,
              name: service.name || "",
            })
          ),

          location: technician.location,

          distance: Number(distanceInKm.toFixed(2)),
          distanceText: `${distanceInKm.toFixed(2)} km`,

          isOnline: technician.isOnline,
          isAvailable: technician.isAvailable,
          verificationStatus: technician.verificationStatus,
        };
      }
    );

    // 8. Success response
    return res.status(200).json({
      success: true,
      message: "Nearby technicians found successfully",
      data: {
        technicians: formattedTechnicians,
        total: formattedTechnicians.length,
        driverLocation,
      },
    });
  } catch (error) {
    console.error("FIND TECHNICIAN CONTROLLER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = findTechnicianController;
