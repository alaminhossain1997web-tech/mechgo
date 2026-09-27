const mongoose = require("mongoose");

const driverRequestSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    technicianId:{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician",
        required: true,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "services",
        required: true
    },
    location:{
        type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

        coordinates: {
        type: [Number],
        required: true,
      },
    },

      description: {
      type: String,
    },
     status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    
},

  {
    timestamps: true,
  }

);
module.exports = mongoose.model("driverRequest", driverRequestSchema)

