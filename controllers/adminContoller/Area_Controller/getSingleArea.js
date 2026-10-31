const mongoose = require("mongoose");
const Area = require("../../../models/Area/areaSchema");

const getSingleArea = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid area ID.",
      });
    }

    const area = await Area.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Area retrieved successfully.",
      data: area,
    });
  } catch (error) {
    console.error("GET AREA ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve area.",
      error: error.message,
    });
  }
};

module.exports = getSingleArea;