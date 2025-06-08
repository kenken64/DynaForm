#!/usr/bin/env node

/**
 * Create Test JWT Token for Stress Testing
 * This script creates a valid JWT token for stress testing purposes
 */

const jwt = require('jsonwebtoken');

// Use the same JWT secret as the server (from .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-minimum-256-bits';

// Create a test user payload
const testUserPayload = {
  userId: '507f1f77bcf86cd799439011', // Valid ObjectId format
  username: 'stress-test-user',
  email: 'stress-test@dynaform.com',
  role: 'user'
};

// Generate token that expires in 24 hours
const token = jwt.sign(testUserPayload, JWT_SECRET, { expiresIn: '24h' });

console.log('Generated Test JWT Token:');
console.log(token);
console.log('');
console.log('Token payload:');
console.log(JSON.stringify(testUserPayload, null, 2));
console.log('');
console.log('Usage in stress tests:');
console.log(`DEMO_TOKEN: '${token}'`);
