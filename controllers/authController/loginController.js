const bcrypt = require("bcrypt");

const { generateAccessToken } = require("../../helpers/utils");

const userSchema = require("../../models/authSchema/userSchema");

const tecnicianSchema = require("../../models/tecnicianSchema/tecnicianSchema");

const loginController = async (req, res) => {
  try {
    const errors = {};

    const { email, password } = req.body;

    // =========================
    // Validation
    // =========================

    if (!email || email.trim() === "") {
      errors.email = "Email is required";
    }

    if (!password || password.trim() === "") {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: errors,
      });
    }

    // =========================
    // Find User
    // =========================

    const user = await userSchema.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // =========================
    // Compare Password
    // =========================

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // =========================
    // Technician Profile Check
    // =========================

    let technicianProfile = false;

    if (user.role === "Technician") {
      const existingTechnician = await tecnicianSchema.findOne({
        userId: user._id,
      });

      technicianProfile = !!existingTechnician;
    }

    // =========================
    // Generate JWT
    // =========================

    const token = generateAccessToken(user);

    // =========================
    // Set Cookie
    // =========================

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // =========================
    // Response
    // =========================

    return res.status(200).json({
      success: true,
      message: "Login successful",

      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },

        accessToken: token,

        technicianProfile,
      },
    });

  } catch (error) {
    console.log("Login Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = loginController;