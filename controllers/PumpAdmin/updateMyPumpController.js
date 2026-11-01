const mongoose = require("mongoose");
const Pump = require("../../models/pumpSchema/pumpSchema");
const Area = require("../../models/Area/areaSchema");
const generateSlug = require("../../helpers/generateSlug");

const updateMyPumpController = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    const { pumpId } = req.params;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    //Validate Pump ID
    if (!mongoose.Types.ObjectId.isValid(pumpId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pump ID.",
      });
    }

    //Find pump belonging to logged-in owner
    const pump = await Pump.findOne({
      _id: pumpId,
      createdBy: ownerId,
    });

    if (!pump) {
      return res.status(404).json({
        success: false,
        message: "Pump not found or you are not authorized.",
      });
    }

    //Allowed values
    const allowedFuelTypes = ["Petrol", "Octane", "Diesel", "CNG", "LPG", "EV"];

    const allowedFacilities = [
      "Restroom",
      "Prayer Room",
      "Restaurant",
      "Car Wash",
      "Air Pump",
      "ATM",
      "Convenience Store",
      "EV Charging",
    ];

    const {
      name,
      description,
      phone,
      email,
      address,
      lat,
      lng,
      fuelTypes,
      facilities,
    } = req.body;

    // Detect whether admin approval is required
    const approvalRequiredFields = [
      "name",
      "address",
      "lat",
      "lng",
      "fuelTypes",
    ];

    const requiresApproval = approvalRequiredFields.some((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field),
    );

    //Update Pump Name and Slug
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Pump name is required.",
        });
      }

      const slug = generateSlug(name.trim());

      if (!slug) {
        return res.status(400).json({
          success: false,
          message: "Invalid pump name.",
        });
      }

      const existingPump = await Pump.findOne({
        slug,
        _id: { $ne: pumpId },
      }).select("_id");

      if (existingPump) {
        return res.status(409).json({
          success: false,
          message: "A pump with this name already exists.",
        });
      }

      pump.name = name.trim();
      pump.slug = slug;
    }

    //Update Description (No approval required)
    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string.",
        });
      }

      pump.description = description.trim();
    }

    //Update Phone (No approval required)
    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number.",
        });
      }

      pump.phone = phone.trim();
    }

    //Update Email (No approval required)
    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "Email must be a string.",
        });
      }

      pump.email = email.trim().toLowerCase();
    }

    // Update Address (Approval required)
    if (address !== undefined) {
      if (typeof address !== "string" || !address.trim()) {
        return res.status(400).json({
          success: false,
          message: "Address is required.",
        });
      }

      pump.address = address.trim();
    }

    //Update Fuel Types (Approval required)
    if (fuelTypes !== undefined) {
      if (
        !Array.isArray(fuelTypes) ||
        fuelTypes.some((item) => !allowedFuelTypes.includes(item))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid fuel types provided.",
        });
      }

      pump.fuelTypes = [...new Set(fuelTypes)];
    }

    //Update Facilities (No approval required)
    if (facilities !== undefined) {
      if (
        !Array.isArray(facilities) ||
        facilities.some((item) => !allowedFacilities.includes(item))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid facilities provided.",
        });
      }

      pump.facilities = [...new Set(facilities)];
    }

    //Validate latitude and longitude together
    const hasLat = lat !== undefined;
    const hasLng = lng !== undefined;

    if (hasLat !== hasLng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude must be provided together.",
      });
    }

    // Update Location and Detect Areas
    if (hasLat && hasLng) {
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

      const matchedAreas = await Area.find({
        isActive: true,
        boundary: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          },
        },
      }).select("_id name division district");

      if (!matchedAreas.length) {
        return res.status(400).json({
          success: false,
          message: "No active service area found for this location.",
        });
      }

      const primaryArea = matchedAreas[0];

      // Ensure detected areas have consistent location data
      if (
        !primaryArea.division ||
        !primaryArea.district ||
        matchedAreas.some(
          (area) =>
            area.division !== primaryArea.division ||
            area.district !== primaryArea.district,
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Detected areas have inconsistent location information.",
        });
      }

      pump.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };

      pump.areaIds = matchedAreas.map((area) => area._id);
      pump.division = primaryArea.division;
      pump.district = primaryArea.district;
    }

    //Apply admin approval only when necessary
    if (requiresApproval) {
      pump.verificationStatus = "pending";
      pump.isOpen = false;
    }

    //Save updated pump
    await pump.save();

    return res.status(200).json({
      success: true,
      message: requiresApproval
        ? "Pump updated successfully. Waiting for admin approval."
        : "Pump information updated successfully.",

      approvalRequired: requiresApproval,

      data: pump,
    });
  } catch (error) {
    console.error("UPDATE PUMP ERROR:", error);

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

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update pump. Please try again.",
    });
  }
};

module.exports = updateMyPumpController;
