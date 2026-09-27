 const mongoose =require("mongoose");

 const serviceSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trime:true
    },
    description:{
        type:String,
        trime:true,
        default : ""
    },
    icon:{
        type:String,
        default:"",
        trime:true
    },
    isActive:{
        type:Boolean,
        default:true
    }

 })

 module.exports = mongoose.model("services",serviceSchema)