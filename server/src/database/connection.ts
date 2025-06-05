import { MongoClient, Db } from 'mongodb';
import { config } from '../config';

let client: MongoClient;
let db: Db;

export async function connectToMongoDB(): Promise<{ client: MongoClient; db: Db }> {
  try {
    client = new MongoClient(config.MONGODB_URI);
    await client.connect();
    db = client.db(config.MONGODB_DB_NAME);
    
    console.log(`Connected to MongoDB at ${config.MONGODB_URI}, database: ${config.MONGODB_DB_NAME}`);
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToMongoDB first.');
  }
  return db;
}

export function getClient(): MongoClient {
  if (!client) {
    throw new Error('MongoDB client not initialized. Call connectToMongoDB first.');
  }
  return client;
}

export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}