require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const dbUrl = process.env.ATLASDB_URL.split('?')[0].split('/').slice(0, 3).join('/') + '/?retryWrites=true&w=majority';

async function deepInspect() {
    try {
        await mongoose.connect(dbUrl);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        for (let dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            const db = mongoose.connection.useDb(dbName);
            const collections = await db.db.listCollections().toArray();
            for (let col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`DB: ${dbName}, Col: ${col.name}, Count: ${count}`);
                if (count > 40 && count < 80) {
                    console.log(`>>> FOUND POSSIBLE MATCH in ${dbName}.${col.name}: ${count} docs`);
                }
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

deepInspect();
