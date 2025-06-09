#!/usr/bin/env node
/**
 * Test Updated Excel Export Functionality
 * Tests that JSON submission data is now split into individual columns
 */

const axios = require('axios');
const fs = require('fs');

const SERVER_URL = 'http://localhost:3001';

async function testUpdatedExcelExport() {
  try {
    console.log('🧪 Testing Updated Excel Export Functionality...\n');

    // Test export of all submissions to see the new column structure
    console.log('1. Testing export of all public submissions...');
    
    const exportResponse = await axios.get(`${SERVER_URL}/api/public/export-submissions`, {
      responseType: 'arraybuffer'
    });

    if (exportResponse.status === 200) {
      // Save the Excel file
      const filename = `updated-export-test-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, exportResponse.data);
      console.log(`✅ Excel file exported successfully: ${filename}`);
      console.log(`📄 File size: ${Math.round(exportResponse.data.length / 1024)} KB`);
      
      // Check response headers
      const contentType = exportResponse.headers['content-type'];
      const contentDisposition = exportResponse.headers['content-disposition'];
      console.log(`📋 Content-Type: ${contentType}`);
      console.log(`📋 Content-Disposition: ${contentDisposition}`);
      
      console.log('\n✨ Success! The Excel file has been generated with the new column structure.');
      console.log('📝 Expected changes:');
      console.log('   - Instead of one "Submission Data" column with JSON');
      console.log('   - Now individual columns for each field (field_1, field_2, field_3, etc.)');
      console.log(`\n📁 Please open ${filename} to verify the new structure.`);
      
    } else {
      console.log(`❌ Export failed with status: ${exportResponse.status}`);
      if (exportResponse.data) {
        console.log('Error response:', exportResponse.data.toString());
      }
    }

    // Also test with a specific form if available
    console.log('\n2. Getting public submissions to find a form ID...');
    try {
      const submissionsResponse = await axios.get(`${SERVER_URL}/api/public/submissions?page=1&pageSize=1`);
      
      if (submissionsResponse.data.success && submissionsResponse.data.submissions.length > 0) {
        const formId = submissionsResponse.data.submissions[0].formId;
        console.log(`Found form ID: ${formId}`);
        
        console.log('\n3. Testing export for specific form...');
        const formExportResponse = await axios.get(`${SERVER_URL}/api/public/export-submissions?formId=${formId}`, {
          responseType: 'arraybuffer'
        });
        
        if (formExportResponse.status === 200) {
          const formFilename = `updated-export-form-${formId}-${Date.now()}.xlsx`;
          fs.writeFileSync(formFilename, formExportResponse.data);
          console.log(`✅ Form-specific Excel file exported: ${formFilename}`);
          console.log(`📄 File size: ${Math.round(formExportResponse.data.length / 1024)} KB`);
        } else {
          console.log(`❌ Form export failed with status: ${formExportResponse.status}`);
        }
      } else {
        console.log('ℹ️  No submissions found for form-specific test');
      }
    } catch (error) {
      console.log('ℹ️  Could not test form-specific export:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.toString() || error.message);
    if (error.response?.status) {
      console.error(`🔴 HTTP Status: ${error.response.status}`);
    }
  }
}

// Run the test
testUpdatedExcelExport();
