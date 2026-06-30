require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const dbUrl = process.env.ATLASDB_URL;

async function checkReviews() {
    try {
        await mongoose.connect(dbUrl);
        const db = mongoose.connection.useDb('Wanderlust');
        const sampleReview = await db.collection('reviews').findOne();
        console.log("Sample Review:", sampleReview);

        const distinctListingIds = await db.collection('reviews').distinct('listing');
        console.log("Number of distinct Listing IDs in reviews:", distinctListingIds.length);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkReviews();
