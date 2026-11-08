const mongoose = require("mongoose");
const Pump = require("../../models/pumpSchema/pumpSchema");

const publicFields = "name slug description phone address division district locationName areaIds location fuels fuelsUpdatedAt facilities isOpen isActive approvalStatus avgRating reviewCount";

const getByArea = async (req, res) => {
  try {
    const { area, fuel, sort: sortBy = "name" } = req.query;
    if (!area || !mongoose.Types.ObjectId.isValid(area)) {
      return res.status(400).json({ success: false, message: "A valid area ID is required." });
    }
    const sortOptions = {
      name: { name: 1 },
      rating: { avgRating: -1, name: 1 },
      fuel_updated: { fuelsUpdatedAt: -1, name: 1 },
    };
    if (!Object.prototype.hasOwnProperty.call(sortOptions, sortBy)) {
      return res.status(400).json({ success: false, message: "Invalid pump sort option." });
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const filter = { areaIds: area, approvalStatus: "approved", isActive: true };
    if (fuel?.trim()) filter.fuels = { $elemMatch: { type: fuel.trim(), available: true } };

    const [pumps, total] = await Promise.all([
      Pump.find(filter).select(publicFields).sort(sortOptions[sortBy]).skip((page - 1) * limit).limit(limit),
      Pump.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, message: "Pumps retrieved successfully.", data: { pumps, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (error) {
    console.error("GET PUMPS BY AREA ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve pumps." });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid pump ID." });
    const pump = await Pump.findOne({ _id: id, approvalStatus: "approved", isActive: true }).select(publicFields);
    if (!pump) return res.status(404).json({ success: false, message: "Pump not found." });
    return res.status(200).json({ success: true, message: "Pump retrieved successfully.", data: pump });
  } catch (error) {
    console.error("GET PUBLIC PUMP ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve pump." });
  }
};

module.exports = { getByArea, getOne };
