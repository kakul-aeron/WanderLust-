require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const dbUrl = process.env.ATLASDB_URL;

async function exhaustiveInspect() {
    try {
        await mongoose.connect(dbUrl);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        console.log("Databases found:", dbs.databases.map(db => db.name));

        for (let dbInfo of dbs.databases) {
            const db = mongoose.connection.useDb(dbInfo.name);
            const collections = await db.db.listCollections().toArray();
            console.log(`\nDB: ${dbInfo.name}`);
            for (let col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`  - ${col.name}: ${count} documents`);
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

exhaustiveInspect();
