const serviceSchema = require("../../../models/serviceSchema/serviceSchema");

const createserviceController = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(409).json({
        success: false,
        message: "Service name is required",
      });
    }

    const existingService = await serviceSchema.findOne({ name });
    if (existingService) {
      return res.status(409).json({
        success: false,
        message: "This Service already exists",
      });
    }

    const service = await serviceSchema.create({ name, description, icon });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });

    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
module.exports = createserviceController