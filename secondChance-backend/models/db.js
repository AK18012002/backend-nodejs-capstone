// db.js
require("dotenv").config();
const { MongoClient } = require("mongodb");

// MongoDB connection URL
const url = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB;

let dbInstance = null;

async function connectToDatabase() {
    // If already connected, return existing instance
    if (dbInstance) {
        return dbInstance;
    }

    // Create MongoDB client
    const client = new MongoClient(url);

    // ✅ Task 1: Connect to MongoDB
    await client.connect();

    // ✅ Task 2: Connect to database and store in dbInstance
    dbInstance = client.db(dbName);

    // ✅ Task 3: Return database instance
    return dbInstance;
}

module.exports = connectToDatabase;
