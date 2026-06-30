require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);
const Listing = require("./models/listing.js");
const User = require("./models/user.js");

const dbUrl = process.env.ATLASDB_URL;

async function checkDB() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to DB");
        const listingCount = await Listing.countDocuments();
        const userCount = await User.countDocuments();
        const users = await User.find({}, 'username email');
        console.log("Listing Count:", listingCount);
        console.log("User Count:", userCount);
        console.log("Users:", users);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkDB();
