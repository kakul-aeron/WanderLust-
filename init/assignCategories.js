require("dotenv").config();
const mongoose = require('mongoose');
const dns = require("dns");

// Fix for MongoDB Atlas connection issue
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const Listing = require('../models/listing');

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/Wanderlust";

const categories = ['trending', 'rooms', 'iconic-cities', 'farms', 'arctic', 'mountains', 'castles', 'amazing-pools', 'camping'];

async function assignRandomCategories() {
    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to MongoDB');

        const listings = await Listing.find({});
        console.log(`Found ${listings.length} listings to update`);

        for (let i = 0; i < listings.length; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];

            await Listing.findByIdAndUpdate(listings[i]._id, {
                category: randomCategory
            });

            console.log(`Updated listing "${listings[i].title}" with category: ${randomCategory}`);
        }

        console.log('✅ All listings have been assigned random categories!');

        const distribution = await Listing.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log('\n📊 Category Distribution:');
        distribution.forEach(item => {
            console.log(`${item._id}: ${item.count} listings`);
        });

    } catch (error) {
        console.error('Error assigning categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

assignRandomCategories(); 