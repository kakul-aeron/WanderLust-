const { MongoClient } = require('mongodb');
require('dotenv').config();
require('dns').setServers(['8.8.8.8']);

async function listAll() {
    const client = new MongoClient(process.env.ATLASDB_URL);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log("Databases:", dbs.databases.map(d => d.name));
        for (let dbMeta of dbs.databases) {
            const db = client.db(dbMeta.name);
            const collections = await db.listCollections().toArray();
            for (let col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`DB: ${dbMeta.name}, Col: ${col.name}, Count: ${count}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

listAll();
