const mongoose = require("mongoose");
const userSchema = require("../../models/authSchema/userSchema");

const registrationController = async (req, res) => {
  try {
    const errors = {};
    const { name, email, password, role } = req.body;
    if (!name  || name.trim() === "") {
      errors.name = "name is required";
    }
    if (!email  || email.trim() === "") {
      errors.email = "email is required";
    }
    if (!password  || password.trim() === "") {
      errors.password = "password is required";
    }
    if (!role) {
      errors.role = "role is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: errors,
      });
    }

    const existingUser = await userSchema.findOne({email})
    if(existingUser){
        res.status(409).json({
            status: "fail",
            message: "This user already exists"
        })
    }

    const user = await userSchema.create({name,email,password,role:role})
    await res.status(200).json({
        success : true,
        message: "registration successfull",
        user
    })

  } catch (error) {
    console.log(error);
    
    return res.status(500).json({
            status: "fail",
            message: "Internal server error",
            error
        })
  }
};
module.exports = registrationController;
