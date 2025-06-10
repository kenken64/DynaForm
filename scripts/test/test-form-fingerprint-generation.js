#!/usr/bin/env node

/**
 * Test PDF Metadata JSON Fingerprint Generation for Forms Created Without PDF Upload
 * 
 * This test verifies that forms created through the "Create New Form" button
 * (which don't have PDF upload) properly generate PDF metadata and fingerprints.
 */

const axios = require('axios');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-123';

// Mock form data that would be created through the Form Editor
const mockFormData = {
  formData: [
    {
      name: 'firstName',
      type: 'text',
      value: '',
      required: true
    },
    {
      name: 'lastName', 
      type: 'text',
      value: '',
      required: true
    },
    {
      name: 'email',
      type: 'email',
      value: '',
      required: true
    },
    {
      name: 'message',
      type: 'textarea',
      value: '',
      required: false
    }
  ],
  fieldConfigurations: {
    firstName: { mandatory: true, validation: false },
    lastName: { mandatory: true, validation: false },
    email: { mandatory: true, validation: true },
    message: { mandatory: false, validation: false }
  },
  originalJson: {
    title: 'Contact Form',
    fields: [
      { name: 'firstName', type: 'text' },
      { name: 'lastName', type: 'text' },
      { name: 'email', type: 'email' },
      { name: 'message', type: 'textarea' }
    ]
  },
  metadata: {
    formName: 'Contact Form',
    version: '1.0.0'
  }
  // Note: No pdfMetadata or pdfFingerprint - this simulates form creation without PDF upload
};

async function testFormFingerprintGeneration() {
  console.log('🧪 Testing PDF Metadata JSON Fingerprint Generation');
  console.log('📝 Simulating form creation through "Create New Form" button (no PDF upload)');
  console.log('=' * 80);

  try {
    // Mock a JWT token (in real scenario, this would come from authentication)
    const mockToken = 'Bearer test-jwt-token-here';
    
    console.log('📤 Sending form save request without PDF metadata...');
    console.log('Form data:', JSON.stringify(mockFormData, null, 2));
    
    // Make request to save form (this should trigger fingerprint generation)
    const response = await axios.post(`${SERVER_URL}/api/forms`, mockFormData, {
      headers: {
        'Authorization': mockToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Form save response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.formId) {
      const formId = response.data.data.formId;
      console.log(`\n🔍 Fetching saved form to verify fingerprint generation...`);
      
      // Fetch the saved form to verify it has PDF metadata and fingerprint
      const formResponse = await axios.get(`${SERVER_URL}/api/forms/${formId}`, {
        headers: {
          'Authorization': mockToken
        }
      });
      
      const savedForm = formResponse.data.data;
      console.log('\n📋 Saved form structure:');
      console.log(JSON.stringify(savedForm, null, 2));
      
      // Verify fingerprint generation
      if (savedForm.pdfMetadata && savedForm.pdfFingerprint) {
        console.log('\n🎉 SUCCESS: PDF metadata and fingerprint generated successfully!');
        console.log('📊 Generated PDF Metadata:');
        console.log(`   - Title: ${savedForm.pdfMetadata.title}`);
        console.log(`   - Creator: ${savedForm.pdfMetadata.creator}`);
        console.log(`   - Producer: ${savedForm.pdfMetadata.producer}`);
        console.log(`   - Page Count: ${savedForm.pdfMetadata.page_count}`);
        console.log(`   - Creation Date: ${savedForm.pdfMetadata.creation_date}`);
        
        console.log('\n🔒 Generated Hashes:');
        if (savedForm.pdfMetadata.hashes) {
          console.log(`   - MD5: ${savedForm.pdfMetadata.hashes.md5}`);
          console.log(`   - SHA1: ${savedForm.pdfMetadata.hashes.sha1}`);
          console.log(`   - SHA256: ${savedForm.pdfMetadata.hashes.sha256}`);
          console.log(`   - Short ID: ${savedForm.pdfMetadata.hashes.short_id}`);
          console.log(`   - JSON Fingerprint: ${savedForm.pdfMetadata.hashes.json_fingerprint}`);
        }
        
        console.log(`\n🆔 PDF Fingerprint: ${savedForm.pdfFingerprint}`);
        
        // Verify the fingerprint matches the short_id
        if (savedForm.pdfFingerprint === savedForm.pdfMetadata.hashes.short_id) {
          console.log('✅ Fingerprint consistency check: PASSED');
        } else {
          console.log('❌ Fingerprint consistency check: FAILED');
          console.log(`Expected: ${savedForm.pdfMetadata.hashes.short_id}, Got: ${savedForm.pdfFingerprint}`);
        }
        
      } else {
        console.log('\n❌ FAILURE: PDF metadata or fingerprint not generated');
        console.log('Expected both pdfMetadata and pdfFingerprint to be present');
      }
      
    } else {
      console.log('\n❌ FAILURE: Form save unsuccessful');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    console.error('\n💥 ERROR during test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Network error - is the server running on', SERVER_URL, '?');
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testFingerprintSearch() {
  console.log('\n🔍 Testing fingerprint-based form search...');
  
  try {
    // This test assumes a form with fingerprint already exists
    const testFingerprint = 'a1b2c3d4'; // Example fingerprint
    const mockToken = 'Bearer test-jwt-token-here';
    
    const response = await axios.get(`${SERVER_URL}/api/forms/fingerprint/${testFingerprint}`, {
      headers: {
        'Authorization': mockToken
      }
    });
    
    console.log('Search result:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('Note: Fingerprint search test failed (this is expected if no forms exist yet)');
    console.log('Error:', error.response?.data || error.message);
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting PDF Fingerprint Generation Tests');
  console.log('📋 Testing the fix for forms created without PDF upload');
  console.log('=' * 80);
  
  await testFormFingerprintGeneration();
  await testFingerprintSearch();
  
  console.log('\n' + '=' * 80);
  console.log('📝 Test Summary:');
  console.log('• Forms created via "Create New Form" should now generate PDF metadata');
  console.log('• This includes JSON fingerprints for content-based identification');
  console.log('• Fingerprints enable duplicate detection and form relationships');
  console.log('• The implementation matches the existing PDF upload workflow');
  console.log('=' * 80);
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testFormFingerprintGeneration, testFingerprintSearch };
