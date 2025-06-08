#!/usr/bin/env node

/**
 * Create Test User for Stress Testing
 * This script creates a test user in the database for stress testing purposes
 */

const { MongoClient, ObjectId } = require('mongodb');

// MongoDB configuration (same as server)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson?authSource=admin';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'doc2formjson';

async function createTestUser() {
  console.log('🔗 Connecting to MongoDB...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB_NAME);
    const usersCollection = db.collection('users');
    
    // Test user data (matching the JWT token payload)
    const testUser = {
      _id: new ObjectId('507f1f77bcf86cd799439011'),
      username: 'stress-test-user',
      email: 'stress-test@dynaform.com',
      fullName: 'Stress Test User',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
      passkeys: [], // No passkeys for this test user
      refreshTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ _id: testUser._id });
    
    if (existingUser) {
      console.log('ℹ️  Test user already exists');
      console.log('User ID:', testUser._id.toString());
      console.log('Username:', testUser.username);
      console.log('Email:', testUser.email);
    } else {
      // Insert the test user
      const result = await usersCollection.insertOne(testUser);
      console.log('✅ Test user created successfully');
      console.log('User ID:', result.insertedId.toString());
      console.log('Username:', testUser.username);
      console.log('Email:', testUser.email);
    }
    
    console.log('');
    console.log('🎯 Test user is ready for stress testing!');
    console.log('Use the following JWT token in stress tests:');
    console.log('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJ1c2VybmFtZSI6InN0cmVzcy10ZXN0LXVzZXIiLCJlbWFpbCI6InN0cmVzcy10ZXN0QGR5bmFmb3JtLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5Mjg4NTAyLCJleHAiOjE3NDkzNzQ5MDJ9.GKvYNGRufVMj2e5x0-4wIEqJnw6M5EJpW3cVZHIxp2w');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createTestUser().catch(console.error);
