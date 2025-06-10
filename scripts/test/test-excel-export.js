#!/usr/bin/env node
/**
 * Test Excel Export Functionality
 * Tests the new Excel export endpoint for public form submissions
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';
const TEST_USER_ID = '6845ddbf0ff2303cf2cff9a0'; // Use the same user ID as before

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = [];
      
      // Handle binary data for Excel files
      res.on('data', (chunk) => {
        body.push(chunk);
      });
      
      res.on('end', () => {
        if (res.headers['content-type']?.includes('application/json')) {
          try {
            const response = JSON.parse(Buffer.concat(body).toString());
            resolve({ statusCode: res.statusCode, data: response, headers: res.headers });
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          // Return binary data as buffer for Excel files
          resolve({ 
            statusCode: res.statusCode, 
            data: Buffer.concat(body), 
            headers: res.headers 
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testExcelExport() {
  console.log('🧪 Testing Excel Export Functionality\n');

  try {
    // First, get the aggregated forms to find a form ID to test with
    console.log('1. Getting aggregated forms for test user...');
    const formsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/public/submissions/user/${TEST_USER_ID}/forms`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (formsResponse.statusCode !== 200) {
      throw new Error(`Failed to get forms: ${formsResponse.statusCode}`);
    }

    const forms = formsResponse.data.forms || [];
    console.log(`✓ Found ${forms.length} forms for user`);

    if (forms.length === 0) {
      console.log('⚠️  No forms found for test user. Cannot test Excel export.');
      return;
    }

    const testFormId = forms[0].formId;
    const submissionCount = forms[0].submissionCount;
    console.log(`Using form ID: ${testFormId} (${submissionCount} submissions)`);

    // Test 2: Export Excel for specific form
    console.log('\n2. Testing Excel export for specific form...');
    const exportResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/public/submissions/export?formId=${testFormId}`,
      method: 'GET',
      headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    });

    if (exportResponse.statusCode === 200) {
      console.log('✓ Excel export request successful');
      console.log(`✓ Content-Type: ${exportResponse.headers['content-type']}`);
      console.log(`✓ Content-Disposition: ${exportResponse.headers['content-disposition']}`);
      console.log(`✓ File size: ${exportResponse.data.length} bytes`);

      // Save the file to verify it's a valid Excel file
      const filename = `test_export_${testFormId}_${Date.now()}.xlsx`;
      const filepath = path.join(__dirname, filename);
      fs.writeFileSync(filepath, exportResponse.data);
      console.log(`✓ Excel file saved as: ${filename}`);
      
      // Check if file is valid Excel by checking the first few bytes
      const buffer = exportResponse.data;
      const header = buffer.toString('hex', 0, 4);
      if (header === '504b0304') { // ZIP file signature (Excel files are ZIP archives)
        console.log('✓ File appears to be a valid Excel file (ZIP signature detected)');
      } else {
        console.log('⚠️  File may not be a valid Excel file');
      }
    } else {
      console.log(`✗ Excel export failed with status: ${exportResponse.statusCode}`);
      if (exportResponse.data && typeof exportResponse.data === 'object') {
        console.log('Error response:', exportResponse.data);
      }
    }

    // Test 3: Export all submissions (no formId)
    console.log('\n3. Testing Excel export for all submissions...');
    const allExportResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/public/submissions/export',
      method: 'GET',
      headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    });

    if (allExportResponse.statusCode === 200) {
      console.log('✓ All submissions export request successful');
      console.log(`✓ File size: ${allExportResponse.data.length} bytes`);
      
      const filename = `test_export_all_${Date.now()}.xlsx`;
      const filepath = path.join(__dirname, filename);
      fs.writeFileSync(filepath, allExportResponse.data);
      console.log(`✓ Excel file saved as: ${filename}`);
    } else {
      console.log(`✗ All submissions export failed with status: ${allExportResponse.statusCode}`);
    }

    // Test 4: Test with invalid formId
    console.log('\n4. Testing error handling with invalid formId...');
    const invalidResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/public/submissions/export?formId=invalid',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (invalidResponse.statusCode === 400) {
      console.log('✓ Invalid formId correctly rejected with 400 status');
      console.log(`✓ Error message: ${invalidResponse.data.message}`);
    } else {
      console.log(`✗ Expected 400 status for invalid formId, got: ${invalidResponse.statusCode}`);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

async function checkServer() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/public/submissions',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.statusCode === 200) {
      console.log('✓ Server is running and responding\n');
      return true;
    } else {
      console.log(`✗ Server responded with status: ${response.statusCode}\n`);
      return false;
    }
  } catch (error) {
    console.log('✗ Server is not responding. Please start the server first.\n');
    console.log('Run: cd server && npm run dev\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Excel Export Functionality Test\n');
  console.log('This test will verify that the Excel export endpoint works correctly.\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await testExcelExport();
  
  console.log('\n✨ Excel export test completed!');
  console.log('\nNext steps:');
  console.log('1. Check the generated Excel files to verify they contain the expected data');
  console.log('2. Test the frontend by running the Angular application');
  console.log('3. Click the download button in the Public tab to test the full flow');
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  process.exit(0);
});

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
