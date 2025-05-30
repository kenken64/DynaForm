"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.client = void 0;
exports.connectToMongoDB = connectToMongoDB;
exports.getDatabase = getDatabase;
exports.closeConnection = closeConnection;
const mongodb_1 = require("mongodb");
const config_1 = __importDefault(require("../config"));
let client;
let db;
async function connectToMongoDB() {
    try {
        exports.client = client = new mongodb_1.MongoClient(config_1.default.MONGODB_URI);
        await client.connect();
        exports.db = db = client.db(config_1.default.MONGODB_DB_NAME);
        console.log(`Connected to MongoDB at ${config_1.default.MONGODB_URI}, database: ${config_1.default.MONGODB_DB_NAME}`);
        return db;
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call connectToMongoDB first.');
    }
    return db;
}
async function closeConnection() {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed.');
    }
}
//# sourceMappingURL=connection.js.map