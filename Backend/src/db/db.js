const mongoose = require('mongoose');
require('@dotenvx/dotenvx').config()

async function connectDB(){
    await mongoose.connect(process.env.MONGO_URI);

    console.log("connected to db")

}

module.exports = connectDB;