require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/Wanderlust";

const bulkListings = [
    // --- TRENDING ---
    {
        title: "The Oberoi Amarvilas",
        description: "Experience royal luxury with every room offering an uninterrupted view of the Taj Mahal.",
        image: { url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop", filename: "trending1" },
        price: 35000, location: "Agra", country: "India", category: "trending"
    },
    {
        title: "Burj Al Arab Jumeirah",
        description: "The world's most luxurious hotel, located on a man-made island in Dubai.",
        image: { url: "https://images.unsplash.com/photo-1549918837-33f394014c62?q=80&w=2070&auto=format&fit=crop", filename: "trending2" },
        price: 120000, location: "Dubai", country: "UAE", category: "trending"
    },
    {
        title: "Marina Bay Sands",
        description: "Famous for its rooftop infinity pool and stunning skyline views of Singapore.",
        image: { url: "https://images.unsplash.com/photo-1562678666-64687fb231df?q=80&w=2070&auto=format&fit=crop", filename: "trending3" },
        price: 45000, location: "Singapore", country: "Singapore", category: "trending"
    },
    {
        title: "Aman Tokyo",
        description: "A sanctuary at the top of the Otemachi Tower, blending urban design with Japanese tradition.",
        image: { url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=2070&auto=format&fit=crop", filename: "trending4" },
        price: 65000, location: "Tokyo", country: "Japan", category: "trending"
    },
    {
        title: "Plaza Athénée",
        description: "The ultimate Parisian residence, famous for its red awnings and Eiffel Tower views.",
        image: { url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2070&auto=format&fit=crop", filename: "trending5" },
        price: 85000, location: "Paris", country: "France", category: "trending"
    },

    // --- ROOMS ---
    {
        title: "Heritage Haveli Room",
        description: "Stay in a beautifully restored room in a 100-year-old haveli in the Pink City.",
        image: { url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop", filename: "rooms1" },
        price: 5000, location: "Jaipur", country: "India", category: "rooms"
    },
    {
        title: "Urban Studio Apartment",
        description: "Modern, minimalist room in the heart of Berlin's creative district.",
        image: { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop", filename: "rooms2" },
        price: 4500, location: "Berlin", country: "Germany", category: "rooms"
    },
    {
        title: "Zen Garden Guestroom",
        description: "A peaceful room featuring traditional tatami mats and a view of a Zen rock garden.",
        image: { url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop", filename: "rooms3" },
        price: 8000, location: "Kyoto", country: "Japan", category: "rooms"
    },
    {
        title: "London Boutique Room",
        description: "Stylish and cozy room in a Victorian townhouse near Kensington Gardens.",
        image: { url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2070&auto=format&fit=crop", filename: "rooms4" },
        price: 12000, location: "London", country: "UK", category: "rooms"
    },
    {
        title: "Manhattan View Suite",
        description: "Large, high-floor room with floor-to-ceiling windows overlooking Central Park.",
        image: { url: "https://images.unsplash.com/photo-1496412705862-e0088f16f791?q=80&w=2070&auto=format&fit=crop", filename: "rooms5" },
        price: 25000, location: "New York", country: "USA", category: "rooms"
    },

    // --- ICONIC CITIES ---
    {
        title: "The Ritz-Carlton",
        description: "Overlooking Central Park, this hotel is an icon of New York luxury.",
        image: { url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=2070&auto=format&fit=crop", filename: "city1" },
        price: 55000, location: "New York", country: "USA", category: "iconic-cities"
    },
    {
        title: "The Savoy",
        description: "London's most famous hotel, situated on the North Bank of the River Thames.",
        image: { url: "https://images.unsplash.com/photo-1541944743827-e04bb645f946?q=80&w=2070&auto=format&fit=crop", filename: "city2" },
        price: 60000, location: "London", country: "UK", category: "iconic-cities"
    },
    {
        title: "Hotel Danieli",
        description: "A legendary Venetian palace just steps from St. Mark's Square.",
        image: { url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=2070&auto=format&fit=crop", filename: "city3" },
        price: 40000, location: "Venice", country: "Italy", category: "iconic-cities"
    },
    {
        title: "Park Hyatt Tokyo",
        description: "Famous from 'Lost in Translation', offering the best views of Shinjuku.",
        image: { url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=2070&auto=format&fit=crop", filename: "city4" },
        price: 70000, location: "Tokyo", country: "Japan", category: "iconic-cities"
    },
    {
        title: "Taj Mahal Palace",
        description: "The crown jewel of Mumbai, standing majestically opposite the Gateway of India.",
        image: { url: "https://images.unsplash.com/photo-1598305072042-3a3fc24f576a?q=80&w=2070&auto=format&fit=crop", filename: "city5" },
        price: 30000, location: "Mumbai", country: "India", category: "iconic-cities"
    },

    // --- FARMS ---
    {
        title: "Lavender Hills Farm",
        description: "Breathe in the scent of lavender at this working farm in Provence.",
        image: { url: "https://images.unsplash.com/photo-1495539406979-bf61750d38ad?q=80&w=2070&auto=format&fit=crop", filename: "farms1" },
        price: 12000, location: "Provence", country: "France", category: "farms"
    },
    {
        title: "Tuscan Vineyard Estate",
        description: "Learn the art of winemaking at this beautiful vineyard in the heart of Chianti.",
        image: { url: "https://images.unsplash.com/photo-1464306208223-e0b44f2a02f3?q=80&w=2070&auto=format&fit=crop", filename: "farms2" },
        price: 15000, location: "Chianti", country: "Italy", category: "farms"
    },
    {
        title: "Cotswolds Dairy Farm",
        description: "A charming stay where you can participate in morning milking and cheese making.",
        image: { url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2070&auto=format&fit=crop", filename: "farms3" },
        price: 9000, location: "Cotswolds", country: "UK", category: "farms"
    },
    {
        title: "Heritage Coffee Plantation",
        description: "Wake up to the aroma of fresh coffee at this estate in Coorg.",
        image: { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop", filename: "farms4" },
        price: 7000, location: "Coorg", country: "India", category: "farms"
    },
    {
        title: "Napa Valley Ranch",
        description: "A luxury farm stay combined with world-class dining in California wine country.",
        image: { url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2070&auto=format&fit=crop", filename: "farms5" },
        price: 22000, location: "Napa Valley", country: "USA", category: "farms"
    },

    // --- ARCTIC ---
    {
        title: "Icehotel Sweden",
        description: "A world-famous hotel built entirely of ice and snow, redesigned every year.",
        image: { url: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=2070&auto=format&fit=crop", filename: "arctic1" },
        price: 30000, location: "Jukkasjärvi", country: "Sweden", category: "arctic"
    },
    {
        title: "Levin Iglut",
        description: "Golden glass igloos offering a front-row seat to the Aurora Borealis.",
        image: { url: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=2070&auto=format&fit=crop", filename: "arctic2" },
        price: 45000, location: "Lapland", country: "Finland", category: "arctic"
    },
    {
        title: "Arctic TreeHouse Hotel",
        description: "Luxury nests on stilts in the heart of the Finnish forest.",
        image: { url: "https://images.unsplash.com/photo-1494244109182-44163ad3ce55?q=80&w=2070&auto=format&fit=crop", filename: "arctic3" },
        price: 38000, location: "Rovaniemi", country: "Finland", category: "arctic"
    },
    {
        title: "Basecamp Spitsbergen",
        description: "A rustic, authentic stay in the northernmost settlement in the world.",
        image: { url: "https://images.unsplash.com/photo-1463194537334-3943ef2492ad?q=80&w=2070&auto=format&fit=crop", filename: "arctic4" },
        price: 25000, location: "Svalbard", country: "Norway", category: "arctic"
    },
    {
        title: "North Pole Camp",
        description: "The ultimate expedition-style luxury tented camp on the moving ice cap.",
        image: { url: "https://images.unsplash.com/photo-1516466723207-f17de7f474cf?q=80&w=2070&auto=format&fit=crop", filename: "arctic5" },
        price: 250000, location: "North Pole", country: "Arctic", category: "arctic"
    },

    // --- MOUNTAINS ---
    {
        title: "The Khyber Himalayan Resort",
        description: "Majestic views of the Affarwat peaks and pine forests of Gulmarg.",
        image: { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop", filename: "mountain1" },
        price: 22000, location: "Gulmarg", country: "India", category: "mountains"
    },
    {
        title: "Grand Hotel Kronenhof",
        description: "A neo-Baroque masterpiece in the heart of the Engadine mountains.",
        image: { url: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?q=80&w=2070&auto=format&fit=crop", filename: "mountain2" },
        price: 50000, location: "Pontresina", country: "Switzerland", category: "mountains"
    },
    {
        title: "Fairmont Banff Springs",
        description: "The 'Castle in the Rockies', a historic landmark in Banff National Park.",
        image: { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop", filename: "mountain3" },
        price: 40000, location: "Banff", country: "Canada", category: "mountains"
    },
    {
        title: "Explora Patagonia",
        description: "Located right in the heart of Torres del Paine, offering unique architecture.",
        image: { url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070&auto=format&fit=crop", filename: "mountain4" },
        price: 80000, location: "Patagonia", country: "Chile", category: "mountains"
    },
    {
        title: "Wildflower Hall, Shimla",
        description: "Experience the colonial charm of the Himalayas at 8,250 feet.",
        image: { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop", filename: "mountain5" },
        price: 35000, location: "Shimla", country: "India", category: "mountains"
    },

    // --- CASTLES ---
    {
        title: "Ashford Castle",
        description: "An 800-year-old castle that was once the home of the Guinness family.",
        image: { url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2070&auto=format&fit=crop", filename: "castle1" },
        price: 65000, location: "Cong", country: "Ireland", category: "castles"
    },
    {
        title: "Schloss Elmau",
        description: "A luxury spa retreat and cultural hideaway in the Bavarian Alps.",
        image: { url: "https://images.unsplash.com/photo-1590059132718-5ee43779e578?q=80&w=2070&auto=format&fit=crop", filename: "castle2" },
        price: 75000, location: "Bavaria", country: "Germany", category: "castles"
    },
    {
        title: "Ballynahinch Castle",
        description: "Set in a private 450-acre estate of woodland and rivers in Connemara.",
        image: { url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070&auto=format&fit=crop", filename: "castle3" },
        price: 35000, location: "Galway", country: "Ireland", category: "castles"
    },
    {
        title: "Amber Fort Heritage",
        description: "Stay in a royal suite nearby the historic Amber Fort of Jaipur.",
        image: { url: "https://images.unsplash.com/photo-1590060933390-e71360183069?q=80&w=2070&auto=format&fit=crop", filename: "castle4" },
        price: 45000, location: "Jaipur", country: "India", category: "castles"
    },
    {
        title: "Château de Chambord",
        description: "Experience the grandeur of the most recognizable châteaux in the world.",
        image: { url: "https://images.unsplash.com/photo-1566438480900-0609be27a4be?q=80&w=2070&auto=format&fit=crop", filename: "castle5" },
        price: 55000, location: "Loire Valley", country: "France", category: "castles"
    },

    // --- AMAZING POOLS ---
    {
        title: "Hanging Gardens of Bali",
        description: "Home to the world's most beautiful tiered infinity pool overlooking the jungle.",
        image: { url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2070&auto=format&fit=crop", filename: "pool1" },
        price: 45000, location: "Ubud", country: "Indonesia", category: "amazing-pools"
    },
    {
        title: "Grace Hotel Santorini",
        description: "Features a dramatic infinity pool with views of the Aegean and Skaros Rock.",
        image: { url: "https://images.unsplash.com/photo-1502675135487-e971002a6adb?q=80&w=2070&auto=format&fit=crop", filename: "pool2" },
        price: 85000, location: "Santorini", country: "Greece", category: "amazing-pools"
    },
    {
        title: "Hotel du Cap-Eden-Roc",
        description: "Famous for its saltwater swimming pool carved into the basalt cliff rocks.",
        image: { url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop", filename: "pool3" },
        price: 120000, location: "Antibes", country: "France", category: "amazing-pools"
    },
    {
        title: "Belmond Hotel Caruso",
        description: "An architectural masterpiece set 1,000 feet above the Amalfi Coast with a heated infinity pool.",
        image: { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2070&auto=format&fit=crop", filename: "pool4" },
        price: 95000, location: "Ravello", country: "Italy", category: "amazing-pools"
    },
    {
        title: "Four Seasons Maldives",
        description: "Landaa Giraavaru features a 50-meter Olympic-sized infinity pool extending into the lagoon.",
        image: { url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=2070&auto=format&fit=crop", filename: "pool5" },
        price: 150000, location: "Baa Atoll", country: "Maldives", category: "amazing-pools"
    },

    // --- CAMPING ---
    {
        title: "Under Canvas Moab",
        description: "Luxury safari-style tents with easy access to Arches National Park.",
        image: { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=2070&auto=format&fit=crop", filename: "camp1" },
        price: 18000, location: "Moab", country: "USA", category: "camping"
    },
    {
        title: "Four Seasons Tented Camp",
        description: "Golden Triangle adventure exploring mountain trails and bamboo jungles.",
        image: { url: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?q=80&w=2070&auto=format&fit=crop", filename: "camp2" },
        price: 120000, location: "Chiang Rai", country: "Thailand", category: "camping"
    },
    {
        title: "Sujan Jawai",
        description: "Luxury leopard camp in the heart of the rugged Aravalli hills of Rajasthan.",
        image: { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2070&auto=format&fit=crop", filename: "camp3" },
        price: 85000, location: "Rajasthan", country: "India", category: "camping"
    },
    {
        title: "Eco Camp Patagonia",
        description: "The world's first geodesic dome hotel, located in Torres del Paine.",
        image: { url: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?q=80&w=2070&auto=format&fit=crop", filename: "camp4" },
        price: 55000, location: "Patagonia", country: "Chile", category: "camping"
    },
    {
        title: "Wild Coast Tented Lodge",
        description: "Adjacent to Yala National Park, where the jungle meets the pristine coastline.",
        image: { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=2070&auto=format&fit=crop", filename: "camp5" },
        price: 75000, location: "Yala", country: "Sri Lanka", category: "camping"
    }
];

async function seedBulkData() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to DB");

        // Find a user to be the owner
        let owner = await User.findOne({ username: "admin" });
        if (!owner) {
            owner = await User.findOne();
        }

        const ownerId = owner ? owner._id : "695e9b19f3ea4f75f98ac281";

        const formattedData = bulkListings.map(listing => ({
            ...listing,
            owner: ownerId,
            totalRooms: 10,
            availableRooms: 10
        }));

        // Optional: Clear existing if you want exactly 5+ per list, 
        // but user asked to "add", so I will just insert. 
        // To ensure "minimum" 5, this script alone provides 5 for each.

        await Listing.insertMany(formattedData);
        console.log("✅ Successfully added bulk listings to the database!");

    } catch (err) {
        console.error("Error seeding data:", err);
    } finally {
        mongoose.connection.close();
    }
}

seedBulkData();
