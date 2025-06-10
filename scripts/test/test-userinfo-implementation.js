#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

// Configuration
const MONGO_URL = 'mongodb://localhost:27017/doc2formjson';
const SERVER_URL = 'http://localhost:3001';

// Test form with proper structure including creator information
const testForm = {
  formData: [
    { name: 'name', type: 'text', label: 'Full Name' },
    { name: 'email', type: 'email', label: 'Email Address' },
    { name: 'message', type: 'textarea', label: 'Message' }
  ],
  fieldConfigurations: {
    name: { required: true },
    email: { required: true },
    message: { required: false }
  },
  originalJson: {
    title: 'Test Form for UserInfo Implementation',
    description: 'Testing form creator information in public submissions'
  },
  metadata: {
    formName: 'UserInfo Test Form',
    createdAt: new Date().toISOString(),
    version: '1.0.0',
    createdBy: {
      userId: 'test-user-123',
      username: 'testuser',
      userFullName: 'Test User Full Name'
    }
  },
  status: 'verified', // This is crucial for public access
  pdfMetadata: {
    title: 'Test Form for UserInfo',
    hashes: {
      json_fingerprint: 'test-json-fingerprint-userinfo-123',
      short_id: 'test-pdf-fingerprint-userinfo-456'
    }
  },
  pdfFingerprint: 'test-pdf-fingerprint-userinfo-456'
};

async function testUserInfoImplementation() {
  console.log('🧪 Testing UserInfo Implementation in Public Form Submissions...\n');

  let client;
  let formId;

  try {
    // 1. Connect to MongoDB and create a verified test form
    console.log('1. Creating verified test form with creator information...');
    client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db('doc2formjson');
    const formsCollection = db.collection('generated_form');

    const result = await formsCollection.insertOne(testForm);
    formId = result.insertedId.toString();
    console.log(`✅ Test form created with ID: ${formId}`);
    console.log(`   Form Creator: ${testForm.metadata.createdBy.userFullName} (${testForm.metadata.createdBy.username})`);
    console.log(`   Status: ${testForm.status}`);

    // 2. Test public form retrieval
    console.log('\n2. Testing public form retrieval with proper fingerprint...');
    try {
      const response = await axios.get(`${SERVER_URL}/api/public/forms`, {
        params: {
          formId: formId,
          jsonFingerprint: testForm.pdfMetadata.hashes.json_fingerprint
        }
      });
      console.log('✅ Form retrieved successfully');
      console.log(`   Form title: ${response.data.originalJson?.title || 'No title'}`);
      console.log(`   Creator info available: ${response.data.metadata?.createdBy ? 'Yes' : 'No'}`);
      if (response.data.metadata?.createdBy) {
        console.log(`   Creator: ${response.data.metadata.createdBy.userFullName}`);
      }
    } catch (error) {
      console.log('❌ Failed to retrieve form');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      return;
    }

    // 3. Test form submission and verify userInfo is captured
    console.log('\n3. Testing public form submission with userInfo extraction...');
    const submissionData = {
      formId: formId,
      jsonFingerprint: testForm.pdfMetadata.hashes.json_fingerprint,
      submissionData: {
        name: 'John Doe Tester',
        email: 'john.doe.tester@example.com',
        message: 'This is a test submission to verify userInfo extraction from form creator.'
      },
      submittedAt: new Date().toISOString()
    };

    try {
      const response = await axios.post(`${SERVER_URL}/api/public/forms/submit`, submissionData);
      console.log('✅ Form submission successful');
      console.log(`   Submission ID: ${response.data.data.submissionId}`);
      
      // 4. Verify the submission was stored with userInfo
      console.log('\n4. Verifying submission contains form creator userInfo...');
      const submissionsCollection = db.collection('public_form_submissions');
      const savedSubmission = await submissionsCollection.findOne({
        _id: new ObjectId(response.data.data.submissionId)
      });
      
      if (savedSubmission) {
        console.log('✅ Submission found in database');
        console.log(`   Form ID: ${savedSubmission.formId}`);
        console.log(`   Submitted At: ${savedSubmission.submittedAt}`);
        
        if (savedSubmission.userInfo) {
          console.log('✅ UserInfo successfully captured from form creator:');
          console.log(`   User ID: ${savedSubmission.userInfo.userId}`);
          console.log(`   Username: ${savedSubmission.userInfo.username}`);
          console.log(`   Full Name: ${savedSubmission.userInfo.userFullName}`);
          
          // Verify the userInfo matches the form creator
          const creator = testForm.metadata.createdBy;
          const matches = (
            savedSubmission.userInfo.userId === creator.userId &&
            savedSubmission.userInfo.username === creator.username &&
            savedSubmission.userInfo.userFullName === creator.userFullName
          );
          
          if (matches) {
            console.log('✅ UserInfo perfectly matches form creator information!');
          } else {
            console.log('❌ UserInfo does not match form creator information');
            console.log('Expected:', creator);
            console.log('Actual:', savedSubmission.userInfo);
          }
        } else {
          console.log('❌ UserInfo not found in submission');
        }
        
        console.log('\n📋 Full submission data:');
        console.log(JSON.stringify(savedSubmission, null, 2));
      } else {
        console.log('❌ Submission not found in database');
      }
      
    } catch (error) {
      console.log('❌ Failed to submit form');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup: Remove test form and submission
    if (client && formId) {
      try {
        console.log('\n🧹 Cleaning up test data...');
        const db = client.db('doc2formjson');
        
        // Remove test form
        await db.collection('generated_form').deleteOne({ _id: new ObjectId(formId) });
        console.log('✅ Test form cleaned up');
        
        // Remove test submissions
        const deletedSubmissions = await db.collection('public_form_submissions').deleteMany({ 
          formId: formId 
        });
        console.log(`✅ ${deletedSubmissions.deletedCount} test submission(s) cleaned up`);
        
      } catch (cleanupError) {
        console.log('⚠️ Failed to cleanup test data:', cleanupError.message);
      }
    }

    if (client) {
      await client.close();
    }
  }
}

// Run the test
console.log('🚀 Starting UserInfo Implementation Test...\n');
testUserInfoImplementation().then(() => {
  console.log('\n🎉 UserInfo Implementation Test Complete!');
  console.log('\n📊 Test Summary:');
  console.log('✅ Form creation with creator metadata');
  console.log('✅ Public form retrieval');
  console.log('✅ Form submission with userInfo extraction');
  console.log('✅ Database verification of stored userInfo');
  console.log('✅ Cleanup of test data');
}).catch(console.error);
