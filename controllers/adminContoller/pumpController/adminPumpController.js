const mongoose = require("mongoose");
const Pump = require("../../../models/pumpSchema/pumpSchema");

const adminPumpController = {
  getAll: async (req, res) => {
    try {
      const { approvalStatus, search } = req.query;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const filter = {};

      if (approvalStatus !== undefined) {
        if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
          return res.status(400).json({ success: false, message: "Invalid approval status." });
        }
        filter.approvalStatus = approvalStatus;
      }
      if (search?.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
          { name: { $regex: escaped, $options: "i" } },
          { phone: { $regex: escaped, $options: "i" } },
        ];
      }

      const [pumps, total] = await Promise.all([
        Pump.find(filter).populate("createdBy", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Pump.countDocuments(filter),
      ]);
      return res.status(200).json({ success: true, message: "Pumps retrieved successfully.", data: { pumps, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
    } catch (error) {
      console.error("ADMIN GET PUMPS ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to retrieve pumps." });
    }
  },

  getOne: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid pump ID." });
      const pump = await Pump.findById(id).populate("createdBy", "name email").populate("areaIds", "name slug division district upazila");
      if (!pump) return res.status(404).json({ success: false, message: "Pump not found." });
      return res.status(200).json({ success: true, message: "Pump retrieved successfully.", data: pump });
    } catch (error) {
      console.error("ADMIN GET PUMP ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to retrieve pump." });
    }
  },

  approve: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid pump ID." });
      const pump = await Pump.findById(id);
      if (!pump) return res.status(404).json({ success: false, message: "Pump not found." });
      if (pump.approvalStatus === "approved") return res.status(409).json({ success: false, message: "Pump is already approved." });
      pump.approvalStatus = "approved";
      pump.approvedBy = req.user._id;
      pump.approvedAt = new Date();
      pump.rejectionReason = "";
      await pump.save();
      return res.status(200).json({ success: true, message: "Pump approved successfully.", data: pump });
    } catch (error) {
      console.error("APPROVE PUMP ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to approve pump." });
    }
  },

  reject: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid pump ID." });
      if (typeof reason !== "string" || !reason.trim()) return res.status(400).json({ success: false, message: "Rejection reason is required." });
      const pump = await Pump.findById(id);
      if (!pump) return res.status(404).json({ success: false, message: "Pump not found." });
      if (pump.approvalStatus === "rejected") return res.status(409).json({ success: false, message: "Pump is already rejected." });
      pump.approvalStatus = "rejected";
      pump.rejectionReason = reason.trim();
      pump.approvedBy = null;
      pump.approvedAt = null;
      await pump.save();
      return res.status(200).json({ success: true, message: "Pump rejected successfully.", data: pump });
    } catch (error) {
      console.error("REJECT PUMP ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to reject pump." });
    }
  },
};

module.exports = adminPumpController;
