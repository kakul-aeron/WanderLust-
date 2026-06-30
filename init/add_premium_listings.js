require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/Wanderlust";

const premiumListings = [
    {
        title: "Eiffel View Luxury Suite",
        description: "Experience the magic of Paris from your own private balcony with an unobstructed view of the Eiffel Tower. This suite offers the finest Parisian elegance.",
        image: {
            url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop",
            filename: "paris_hotel"
        },
        price: 4500,
        location: "Paris",
        country: "France",
        category: "iconic-cities"
    },
    {
        title: "Tuscan Sun Farmhouse",
        description: "A beautifully restored 18th-century farmhouse nestled in the heart of Tuscany. Enjoy organic wine and olive oil from our own vineyards.",
        image: {
            url: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=2070&auto=format&fit=crop",
            filename: "tuscany_farm"
        },
        price: 1800,
        location: "Tuscany",
        country: "Italy",
        category: "farms"
    },
    {
        title: "Arctic Aurora Glass Igloo",
        description: "Sleep under the Northern Lights in a premium glass igloo. A once-in-a-lifetime experience in the snowy wilderness of Lapland.",
        image: {
            url: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=2070&auto=format&fit=crop",
            filename: "arctic_igloo"
        },
        price: 3200,
        location: "Lapland",
        country: "Finland",
        category: "arctic"
    },
    {
        title: "Swiss Summit Chalet",
        description: "A luxury ski-in/ski-out chalet with panoramic views of the Matterhorn. Features a private sauna and outdoor hot tub.",
        image: {
            url: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?q=80&w=2070&auto=format&fit=crop",
            filename: "swiss_chalet"
        },
        price: 5500,
        location: "Zermatt",
        country: "Switzerland",
        category: "mountains"
    },
    {
        title: "Medieval Castle Hohenzollern",
        description: "Live like a king in a real medieval castle. Grand banquet halls, secret passages, and breathtaking views of the German countryside.",
        image: {
            url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2070&auto=format&fit=crop",
            filename: "german_castle"
        },
        price: 6000,
        location: "Baden-Württemberg",
        country: "Germany",
        category: "castles"
    },
    {
        title: "Santorini Infinity Villa",
        description: "Perched on the cliffs of Oia, this villa features one of the most famous infinity pools in the world overlooking the caldera.",
        image: {
            url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2070&auto=format&fit=crop",
            filename: "santorini_pool"
        },
        price: 3800,
        location: "Oia, Santorini",
        country: "Greece",
        category: "amazing-pools"
    },
    {
        title: "Kyoto Zen Retreat",
        description: "Find peace in this traditional Ryokan in the heart of Kyoto. Featuring a private rock garden and tea ceremony room.",
        image: {
            url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
            filename: "kyoto_ryokan"
        },
        price: 2500,
        location: "Kyoto",
        country: "Japan",
        category: "iconic-cities"
    },
    {
        title: "Organic Farm Stay Kerala",
        description: "Immerse yourself in nature at this organic spice farm. Experience traditional Kerala hospitality and farm-to-table dining.",
        image: {
            url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2070&auto=format&fit=crop",
            filename: "kerala_farm"
        },
        price: 1200,
        location: "Wayanad, Kerala",
        country: "India",
        category: "farms"
    },
    {
        title: "Sahara Luxury Desert Camp",
        description: "Glamping at its finest under the star-studded desert sky. Camel treks and traditional Berber music included.",
        image: {
            url: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?q=80&w=2070&auto=format&fit=crop",
            filename: "desert_camp"
        },
        price: 2000,
        location: "Merzouga",
        country: "Morocco",
        category: "camping"
    }
];

async function seedPremiumData() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to DB");

        // Find a user to be the owner
        let owner = await User.findOne({ username: "admin" });
        if (!owner) {
            owner = await User.findOne();
        }

        const ownerId = owner ? owner._id : "695e9b19f3ea4f75f98ac281"; // Fallback to provided ID

        const formattedData = premiumListings.map(listing => ({
            ...listing,
            owner: ownerId
        }));

        await Listing.insertMany(formattedData);
        console.log("✅ Successfully added premium listings to the database!");

    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.connection.close();
    }
}

seedPremiumData();
