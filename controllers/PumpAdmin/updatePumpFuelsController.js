const mongoose = require("mongoose");
const Pump = require("../../models/pumpSchema/pumpSchema");

const updatePumpFuelsController = async (req, res) => {
  try {
    const { pumpId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(pumpId)) {
      return res.status(400).json({ success: false, message: "Invalid pump ID." });
    }

    const pump = await Pump.findOne({ _id: pumpId, createdBy: req.user?._id });
    if (!pump) {
      return res.status(404).json({ success: false, message: "Pump not found or you are not authorized." });
    }
    if (pump.approvalStatus !== "approved") {
      return res.status(409).json({ success: false, message: "Fuel information can only be updated for approved pumps." });
    }

    const { fuels } = req.body;
    const allowedTypes = ["Petrol", "Octane", "Diesel", "CNG", "LPG", "EV"];
    if (!Array.isArray(fuels) || fuels.some((fuel) =>
      !fuel || !allowedTypes.includes(fuel.type) ||
      !Number.isFinite(Number(fuel.price)) || Number(fuel.price) < 0 ||
      (fuel.available !== undefined && typeof fuel.available !== "boolean"),
    )) {
      return res.status(400).json({ success: false, message: "Provide a valid fuels array." });
    }

    pump.fuels = fuels.map(({ type, price, available }) => ({
      type,
      price: Number(price),
      available: available !== false,
    }));
    pump.fuelsUpdatedAt = new Date();
    await pump.save();

    return res.status(200).json({ success: true, message: "Pump fuels updated successfully.", data: pump });
  } catch (error) {
    console.error("UPDATE PUMP FUELS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update pump fuels." });
  }
};

module.exports = updatePumpFuelsController;
