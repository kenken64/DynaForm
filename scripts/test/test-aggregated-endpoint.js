#!/usr/bin/env node
/**
 * Simple test for the aggregated forms endpoint
 */

const http = require('http');

// Test configuration
const baseUrl = 'http://localhost:3000';
const testUserId = '6845ddbf0ff2303cf2cff9a0'; // Real user ID from database

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    }).on('error', reject);
  });
}

async function testAggregatedEndpoint() {
  console.log('🧪 Testing Aggregated Forms Endpoint');
  console.log('=====================================');
  
  const url = `${baseUrl}/api/public/submissions/user/${testUserId}/forms`;
  console.log(`📡 Testing: ${url}`);
  
  try {
    const response = await makeRequest(url);
    
    console.log(`📊 Status: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Endpoint working successfully!');
      console.log(`📋 Found ${response.data.forms.length} forms:`);
      
      response.data.forms.forEach((form, index) => {
        console.log(`   ${index + 1}. ${form.formTitle}`);
        console.log(`      ID: ${form.formId}`);
        console.log(`      Submissions: ${form.submissionCount}`);
        console.log(`      Description: ${form.formDescription}`);
        console.log('');
      });
      
      console.log(`📄 Pagination: Page ${response.data.page} of ${response.data.totalPages}`);
      console.log(`📊 Total forms: ${response.data.totalCount}`);
      
      return response.data.forms;
    } else {
      console.log('❌ Endpoint failed');
      console.log('Response:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Aggregated Forms Test\n');
  
  const forms = await testAggregatedEndpoint();
  
  if (forms && forms.length > 0) {
    console.log('\n🎉 Test completed successfully!');
    console.log(`✅ Found ${forms.length} aggregated forms for user ${testUserId}`);
  } else {
    console.log('\n❌ Test failed or no forms found');
  }
}

main().catch(console.error);
