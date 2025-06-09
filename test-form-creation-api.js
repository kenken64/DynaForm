const axios = require('axios');

// Test the actual form creation API endpoint to verify fingerprint generation
async function testFormCreationWithFingerprints() {
  console.log('🧪 Testing Form Creation API with PDF Metadata Fingerprint Generation');
  console.log('='.repeat(70));

  const serverUrl = 'http://localhost:3000';
  
  // Sample form data that would be sent by "Create New Form" button
  const formData = {
    formData: [
      {
        name: "firstName",
        type: "text",
        value: "",
        required: true
      },
      {
        name: "lastName",
        type: "text", 
        value: "",
        required: true
      },
      {
        name: "email",
        type: "email",
        value: "",
        required: true
      },
      {
        name: "phone",
        type: "tel",
        value: "",
        required: false
      }
    ],
    fieldConfigurations: {
      firstName: { mandatory: true, validation: false },
      lastName: { mandatory: true, validation: false },
      email: { mandatory: true, validation: true },
      phone: { mandatory: false, validation: false }
    },
    originalJson: {
      title: "Customer Contact Form",
      description: "A form to collect customer contact information",
      fields: [
        { name: "firstName", type: "text", label: "First Name" },
        { name: "lastName", type: "text", label: "Last Name" },
        { name: "email", type: "email", label: "Email Address" },
        { name: "phone", type: "tel", label: "Phone Number" }
      ]
    },
    metadata: {
      formName: "Customer Contact Form",
      version: "1.0.0",
      createdBy: "test-user",
      description: "Form created via Create New Form button - testing fingerprint generation"
    }
    // Note: No pdfMetadata provided - this should trigger our fingerprint generation
  };

  try {
    console.log('📤 Sending form creation request...');
    console.log('🔍 Form data (abbreviated):', {
      formDataCount: formData.formData.length,
      fieldConfigurationsKeys: Object.keys(formData.fieldConfigurations),
      originalJsonTitle: formData.originalJson.title,
      metadataFormName: formData.metadata.formName,
      pdfMetadataProvided: false
    });

    const response = await axios.post(`${serverUrl}/api/forms`, formData, {
      headers: {
        'Content-Type': 'application/json',
        // Add any required authentication headers here if needed
      },
      timeout: 10000
    });

    console.log('\n✅ Form creation successful!');
    console.log('📊 Response status:', response.status);
    
    const result = response.data;
    console.log('📋 Response data keys:', Object.keys(result));
    
    if (result.success) {
      console.log('✅ API returned success: true');
      
      if (result.form) {
        const form = result.form;
        console.log('\n📝 Form details:');
        console.log('  - Form ID:', form._id || form.id);
        console.log('  - Form Name:', form.metadata?.formName);
        console.log('  - Created At:', form.createdAt);
        
        // Check if PDF metadata was generated
        if (form.pdfMetadata) {
          console.log('\n🎯 PDF Metadata generated successfully!');
          console.log('  - MD5 Hash:', form.pdfMetadata.md5_hash);
          console.log('  - SHA1 Hash:', form.pdfMetadata.sha1_hash);
          console.log('  - SHA256 Hash:', form.pdfMetadata.sha256_hash);
          console.log('  - Short ID:', form.pdfMetadata.short_id);
          console.log('  - JSON Fingerprint:', form.pdfMetadata.json_fingerprint);
          console.log('  - Form Created Via:', form.pdfMetadata.form_created_via);
          console.log('  - Source:', form.pdfMetadata.source);
        } else {
          console.log('\n❌ PDF Metadata was NOT generated');
        }
        
        // Check if PDF fingerprint was set
        if (form.pdfFingerprint) {
          console.log('\n🔐 PDF Fingerprint set successfully!');
          console.log('  - Fingerprint:', form.pdfFingerprint);
          
          // Verify it matches the JSON fingerprint from metadata
          if (form.pdfMetadata && form.pdfMetadata.json_fingerprint === form.pdfFingerprint) {
            console.log('✅ Fingerprint consistency check PASSED');
          } else {
            console.log('❌ Fingerprint consistency check FAILED');
          }
        } else {
          console.log('\n❌ PDF Fingerprint was NOT set');
        }
        
      } else {
        console.log('❌ No form object in response');
      }
    } else {
      console.log('❌ API returned success: false');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.log('\n💥 Error during form creation:');
    if (error.response) {
      console.log('  - Status:', error.response.status);
      console.log('  - Status Text:', error.response.statusText);
      console.log('  - Data:', error.response.data);
    } else if (error.request) {
      console.log('  - No response received');
      console.log('  - Error:', error.message);
    } else {
      console.log('  - Error:', error.message);
    }
  }

  console.log('\n📋 Test Summary:');
  console.log('='.repeat(70));
  console.log('This test verifies that forms created without PDF upload');
  console.log('now automatically generate PDF metadata and fingerprints,');
  console.log('matching the behavior of forms created via PDF upload.');
}

// Run the test
if (require.main === module) {
  testFormCreationWithFingerprints();
}

module.exports = { testFormCreationWithFingerprints };
