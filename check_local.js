const mongoose = require("mongoose");

async function checkLocal() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
        console.log("Connected to Local MongoDB");
        const count = await mongoose.connection.db.collection('listings').countDocuments();
        console.log(`Local 'wanderlust' listings count: ${count}`);
        await mongoose.disconnect();
    } catch (err) {
        console.log("Local MongoDB not reachable or error:", err.message);
    }
}

checkLocal();
