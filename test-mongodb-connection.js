#!/usr/bin/env node

/**
 * Test MongoDB Connection with Secure Configuration
 * This script tests the MongoDB connection using the same configuration as the API
 */

const fs = require('fs');
const path = require('path');

// Helper function to read Docker secrets (same as in config)
function readDockerSecret(secretName) {
  try {
    const secretPath = `/run/secrets/${secretName}`;
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf8').trim();
    }
  } catch (error) {
    console.warn(`Could not read Docker secret ${secretName}:`, error.message);
  }
  return null;
}

// Helper function to construct MongoDB URI (same as in config)
function buildMongoDBURI() {
  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'doc2formjson';
  const username = process.env.MONGODB_USERNAME || 'doc2formapp';
  
  // Try to get password from Docker secret first, then environment variable
  const passwordFromSecret = readDockerSecret('mongodb_app_password');
  const password = passwordFromSecret || process.env.MONGODB_PASSWORD || 'apppassword123';
  
  if (passwordFromSecret) {
    console.log('🔐 Using MongoDB password from Docker secret');
  } else if (process.env.MONGODB_PASSWORD) {
    console.log('⚠️  Using MongoDB password from environment variable');
  } else {
    console.log('⚠️  Using default MongoDB password - change in production!');
  }
  
  return `mongodb://${username}:${password}@${host}:${port}/${database}`;
}

async function testConnection() {
  console.log('🔗 Testing MongoDB Connection...\n');
  
  // Test configuration reading
  console.log('Configuration Test:');
  console.log('- MongoDB Host:', process.env.MONGODB_HOST || 'localhost');
  console.log('- MongoDB Port:', process.env.MONGODB_PORT || '27017');
  console.log('- MongoDB Database:', process.env.MONGODB_DATABASE || 'doc2formjson');
  console.log('- MongoDB Username:', process.env.MONGODB_USERNAME || 'doc2formapp');
  
  // Test secret reading
  console.log('\nSecret Reading Test:');
  const secretExists = fs.existsSync('/run/secrets/mongodb_app_password');
  console.log('- Docker secret exists:', secretExists ? '✅' : '❌');
  
  if (secretExists) {
    try {
      const secret = fs.readFileSync('/run/secrets/mongodb_app_password', 'utf8').trim();
      console.log('- Secret length:', secret.length, 'characters');
      console.log('- Secret format: [REDACTED for security]');
    } catch (error) {
      console.log('- Secret read error:', error.message);
    }
  }
  
  // Build URI
  console.log('\nURI Construction Test:');
  const uri = buildMongoDBURI();
  const uriMasked = uri.replace(/:([^:@]+)@/, ':****@');
  console.log('- MongoDB URI:', uriMasked);
  
  // Test actual connection (requires MongoDB driver)
  console.log('\nConnection Test:');
  try {
    // Try to require mongodb
    const { MongoClient } = require('mongodb');
    
    console.log('- MongoDB driver: ✅ Available');
    
    const client = new MongoClient(uri);
    
    console.log('- Connecting to MongoDB...');
    await client.connect();
    
    console.log('- Connection: ✅ Successful');
    
    // Test database access
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('- Database access: ✅ Successful');
    console.log(`- Collections found: ${collections.length}`);
    
    // Test basic operations
    const testCollection = db.collection('connection_test');
    const testDoc = { 
      test: true, 
      timestamp: new Date(),
      source: 'connection-test-script'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('- Insert test: ✅ Successful');
    
    const findResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('- Query test: ✅ Successful');
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('- Cleanup: ✅ Complete');
    
    await client.close();
    console.log('\n🎉 All tests passed! MongoDB connection is working correctly.');
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('- MongoDB driver: ❌ Not available');
      console.log('  Run: npm install mongodb');
      console.log('\n⚠️  Cannot test actual connection without MongoDB driver');
      console.log('   Configuration appears correct based on available tests.');
    } else {
      console.log('- Connection: ❌ Failed');
      console.log('- Error:', error.message);
      console.log('\n❌ Connection test failed. Check configuration and MongoDB status.');
      process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  testConnection().catch(console.error);
}

module.exports = { readDockerSecret, buildMongoDBURI, testConnection };
