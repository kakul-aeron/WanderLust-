const mongoose = require("mongoose");

async function checkAllLocal() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/");
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        for (let dbInfo of dbs.databases) {
            const db = mongoose.connection.useDb(dbInfo.name);
            const collections = await db.db.listCollections().toArray();
            for (let col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`Local DB: ${dbInfo.name}, Col: ${col.name}, Count: ${count}`);
                if (col.name === 'listings' && count > 40) {
                    console.log(`>>> FOUND POSSIBLE MATCH in local ${dbInfo.name}.${col.name}: ${count} docs`);
                }
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.log("Error checking local:", err.message);
    }
}

checkAllLocal();
