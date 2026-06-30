require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const dbUrl = process.env.ATLASDB_URL.split('?')[0].split('/').slice(0, 3).join('/') + '/?retryWrites=true&w=majority';

async function inspectCluster() {
    try {
        const client = await mongoose.connect(dbUrl);
        console.log("Connected to Cluster");

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        for (let dbInfo of dbs.databases) {
            console.log(`Database: ${dbInfo.name}`);
            const db = mongoose.connection.useDb(dbInfo.name);
            const collections = await db.db.listCollections().toArray();
            for (let col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`  - Collection: ${col.name}, Count: ${count}`);
                if (col.name === 'listings' && count > 0) {
                    const sample = await db.collection(col.name).findOne();
                    console.log(`    Sample Listing Title: ${sample.title}`);
                }
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

inspectCluster();
