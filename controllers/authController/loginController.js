const bcrypt = require("bcrypt");
const { generateAccessToken } = require("../../helpers/utils");
const userSchema = require("../../models/authSchema/userSchema");

const loginController = async (req, res) => {
  try {
    const errors = {};
    const { email, password } = req.body;
    if (!email || email.trim() === "") {
      errors.email = "email is required";
    }
    if (!password || password.trim() === "") {
      errors.password = "password is required";
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: errors,
      });
    }


    const user = await userSchema.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

//compaire hash password
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

       // 3. Generate JWT
    const token = generateAccessToken(user);
    res.cookie("accessToken", token);

    return res.status(200).json({
      success: true,
      message: "Login successful"
    });

  } catch (error) {
    console.log(error);
    
    return res.status(500).json({
            status: "fail",
            message: "Internal server error",
            error
        })

  }
};

module.exports = loginController
