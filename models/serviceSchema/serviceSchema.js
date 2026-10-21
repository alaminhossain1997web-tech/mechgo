 const mongoose =require("mongoose");

 const serviceSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    description:{
        type:String,
        trim:true,
        default : ""
    },
    icon:{
        type:String,
        default:"",
        trim:true
    },
    isActive:{
        type:Boolean,
        default:true
    }

 })

 module.exports = mongoose.model("services",serviceSchema)
