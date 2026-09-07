const { default: mongoose } = require("mongoose");

const db_url = process.env.DB_URL;

const dbConnect= ()=>{
    mongoose.connect(db_url).then(()=>{
        console.log("database connected");
        
    }).catch(()=>{
        console.log("database connection failed");
        
    })
    
}

module.exports = dbConnect