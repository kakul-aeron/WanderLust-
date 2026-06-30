require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");

// Fix for MongoDB Atlas connection issue
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const initData = require("./data.js");
const Listing = require('../models/listing.js');

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/Wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  }).catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({ ...obj, owner: "695e9b19f3ea4f75f98ac281" }));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

initDB();

