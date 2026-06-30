require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const Listing = require("./models/listing.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/Wanderlust";

async function checkDatabase() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to Database for verification...");

        const totalListings = await Listing.countDocuments();
        const distribution = await Listing.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log(`\n📊 Total listings in database: ${totalListings}`);
        console.log("\n📁 Listing Distribution per Category:");
        distribution.forEach(item => {
            console.log(`- ${item._id || "No Category"}: ${item.count} items`);
        });

    } catch (err) {
        console.error("Verification failed:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("\nVerification complete.");
    }
}

checkDatabase();
