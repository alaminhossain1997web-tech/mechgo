const serviceSchema = require("../../../models/serviceSchema/serviceSchema");

const getAllServiceController = async (req, res) => {
  try {
    const services = await serviceSchema.find();

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      services,
    });
  } catch (error) {
    console.log("Get All Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = getAllServiceController;