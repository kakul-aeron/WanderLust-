require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);
const User = require("./models/user.js");

const dbUrl = process.env.ATLASDB_URL;

async function registerUser() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to DB");

        const existingUser = await User.findOne({ username: "AnshAeron" });
        if (existingUser) {
            console.log("User already exists");
            await mongoose.disconnect();
            return;
        }

        const newUser = new User({
            email: "ansh@example.com",
            username: "AnshAeron",
            phone: "1234567890"
        });

        // Passport Local Mongoose register method
        await User.register(newUser, "ansh");
        console.log("User AnshAeron registered successfully with password 'ansh'");

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

registerUser();
