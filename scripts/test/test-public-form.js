#!/usr/bin/env node

const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');

const SERVER_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:51552';
const MONGO_URL = 'mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson?authSource=admin';

// Test data
const testForm = {
  title: 'Public Test Form',
  description: 'Test form for public access',
  jsonFingerprint: 'test-json-fingerprint-123',
  pdfFingerprint: 'test-pdf-fingerprint-456',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'Full Name'
      },
      email: {
        type: 'string',
        title: 'Email Address',
        format: 'email'
      },
      message: {
        type: 'string',
        title: 'Message'
      }
    },
    required: ['name', 'email']
  },
  uiSchema: {
    message: {
      'ui:widget': 'textarea'
    }
  },
  pdfMetadata: {
    filename: 'test-form.pdf',
    pages: 1,
    fileSize: 12345
  }
};

async function testPublicFormImplementation() {
  console.log('🧪 Testing Public Form Implementation...\n');

  let client;
  let formId;

  try {
    // 1. Connect to MongoDB and create a test form
    console.log('1. Creating test form in database...');
    client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db('doc2formjson');
    const formsCollection = db.collection('generated_form');

    const result = await formsCollection.insertOne(testForm);
    formId = result.insertedId.toString();
    console.log(`✅ Test form created with ID: ${formId}\n`);

    // 2. Test public form retrieval by ID and JSON fingerprint
    console.log('2. Testing public form retrieval by ID and JSON fingerprint...');
    try {
      const response = await axios.get(`${SERVER_URL}/api/public/forms`, {
        params: {
          formId: formId,
          jsonFingerprint: testForm.jsonFingerprint
        }
      });
      console.log('✅ Form retrieved successfully');
      console.log(`   Form title: ${response.data.title || 'No title available'}`);
    } catch (error) {
      console.log('❌ Failed to retrieve form by ID and JSON fingerprint');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // 3. Test public form retrieval by PDF fingerprint
    console.log('\n3. Testing public form retrieval by PDF fingerprint...');
    try {
      const response = await axios.get(`${SERVER_URL}/api/public/forms/fingerprint/${testForm.pdfFingerprint}`);
      console.log('✅ Form retrieved successfully by PDF fingerprint');
      console.log(`   Forms count: ${response.data.length || 'Unknown'}`);
    } catch (error) {
      console.log('❌ Failed to retrieve form by PDF fingerprint');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // 4. Test form submission
    console.log('\n4. Testing public form submission...');
    const submissionData = {
      formId: formId,
      jsonFingerprint: testForm.jsonFingerprint,
      submissionData: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'This is a test submission from the public form.'
      }
    };

    try {
      const response = await axios.post(`${SERVER_URL}/api/public/forms/submit`, submissionData);
      console.log('✅ Form submission successful');
      console.log(`   Submission ID: ${response.data.data.submissionId}`);
    } catch (error) {
      console.log('❌ Failed to submit form');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // 5. Test invalid requests
    console.log('\n5. Testing error handling...');
    
    // Test with invalid form ID
    try {
      await axios.get(`${SERVER_URL}/api/public/forms`, {
        params: {
          formId: 'invalid-id',
          jsonFingerprint: testForm.jsonFingerprint
        }
      });
      console.log('❌ Should have failed with invalid form ID');
    } catch (error) {
      console.log('✅ Correctly rejected invalid form ID');
    }

    // Test with non-existent fingerprint
    try {
      await axios.get(`${SERVER_URL}/api/public/forms/fingerprint/non-existent-fingerprint`);
      console.log('❌ Should have failed with non-existent fingerprint');
    } catch (error) {
      console.log('✅ Correctly rejected non-existent fingerprint');
    }

    console.log('\n6. Public form URL for manual testing:');
    console.log(`   ${FRONTEND_URL}/public/form/${formId}/${testForm.jsonFingerprint}`);
    console.log(`   ${FRONTEND_URL}/public/form/${formId}/${testForm.pdfFingerprint}`);

    console.log('\n🎉 Public Form Implementation Test Complete!');
    console.log('\nTo test the frontend:');
    console.log(`1. Open: ${FRONTEND_URL}/public/form/${formId}/${testForm.jsonFingerprint}`);
    console.log('2. Fill out the form and submit');
    console.log('3. Check that no authentication is required');
    console.log('4. Verify the form is displayed in full-screen layout');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup: Remove test form
    if (client && formId) {
      try {
        const db = client.db('doc2formjson');
        const formsCollection = db.collection('generated_form');
        await formsCollection.deleteOne({ _id: new ObjectId(formId) });
        console.log('\n🧹 Test form cleaned up');
      } catch (cleanupError) {
        console.log('⚠️ Failed to cleanup test form:', cleanupError.message);
      }
    }

    if (client) {
      await client.close();
    }
  }
}

// Run the test
testPublicFormImplementation().catch(console.error);
