#!/usr/bin/env node
/**
 * Debug form ID structure
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
const TEST_USER_ID = '6845ddbf0ff2303cf2cff9a0';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = [];
      
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
          resolve({ statusCode: res.statusCode, data: Buffer.concat(body), headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function debugFormId() {
  console.log('🔍 Debug Form ID Structure');
  console.log('==========================');

  try {
    // Get aggregated forms
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/public/submissions/user/${TEST_USER_ID}/forms`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.statusCode === 200 && response.data.success) {
      const forms = response.data.forms || [];
      console.log(`Found ${forms.length} forms`);
      
      if (forms.length > 0) {
        const testForm = forms[0];
        console.log('\nForm details:');
        console.log('- Form ID:', testForm.formId);
        console.log('- Type:', typeof testForm.formId);
        console.log('- Length:', testForm.formId.length);
        console.log('- Is valid hex?', /^[0-9a-fA-F]{24}$/.test(testForm.formId));
        
        // Try to validate it
        const formId = testForm.formId;
        console.log('\nValidation tests:');
        console.log('- typeof === "string":', typeof formId === 'string');
        console.log('- length === 24:', formId.length === 24);
        console.log('- hex pattern test:', /^[0-9a-fA-F]{24}$/.test(formId));
        
        const validationResult = typeof formId !== 'string' || formId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(formId);
        console.log('- Would fail validation?', validationResult);
        
        // Now test the actual API
        console.log('\n🧪 Testing Excel export with this form ID...');
        const exportResponse = await makeRequest({
          hostname: 'localhost',
          port: 3000,
          path: `/api/public/submissions/export?formId=${formId}`,
          method: 'GET',
          headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });
        
        console.log('Export status:', exportResponse.statusCode);
        if (exportResponse.statusCode !== 200) {
          console.log('Error:', exportResponse.data);
        } else {
          console.log('✅ Export successful!');
        }
      }
    } else {
      console.log('Failed to get forms:', response.data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugFormId().catch(console.error);
