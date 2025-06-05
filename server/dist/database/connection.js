"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToMongoDB = connectToMongoDB;
exports.getDatabase = getDatabase;
exports.getClient = getClient;
exports.closeConnection = closeConnection;
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
let client;
let db;
async function connectToMongoDB() {
    try {
        client = new mongodb_1.MongoClient(config_1.config.MONGODB_URI);
        await client.connect();
        db = client.db(config_1.config.MONGODB_DB_NAME);
        console.log(`Connected to MongoDB at ${config_1.config.MONGODB_URI}, database: ${config_1.config.MONGODB_DB_NAME}`);
        return { client, db };
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call connectToMongoDB first.');
    }
    return db;
}
function getClient() {
    if (!client) {
        throw new Error('MongoDB client not initialized. Call connectToMongoDB first.');
    }
    return client;
}
async function closeConnection() {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed.');
    }
}
//# sourceMappingURL=connection.js.map