#!/usr/bin/env node
/**
 * Test Phase 2: Aggregated Forms Implementation
 * Tests the new aggregated forms endpoint that shows one record per form
 * with submission counts and Excel export functionality
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
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

async function testAggregatedFormsEndpoint() {
  console.log('🧪 Testing Phase 2: Aggregated Forms Implementation');
  console.log('=' * 70);
  
  const testUserId = 'kenneth';
  
  try {
    // Test 1: Get aggregated forms for user
    console.log('\n📋 Test 1: Get aggregated forms for user');
    console.log('-'.repeat(50));
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/public/submissions/user/${testUserId}/forms?page=1&pageSize=10`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Aggregated forms endpoint working!');
      
      const forms = response.data.forms || [];
      console.log(`📊 Found ${forms.length} unique forms`);
      
      if (forms.length > 0) {
        console.log('\n📝 Form Details:');
        forms.forEach((form, index) => {
          console.log(`   ${index + 1}. Form ID: ${form.formId}`);
          console.log(`      Title: ${form.formTitle}`);
          console.log(`      Description: ${form.formDescription}`);
          console.log(`      Submissions: ${form.submissionCount}`);
          console.log(`      Latest: ${form.latestSubmission}`);
          console.log('');
        });
        
        // Test 2: Verify data consistency
        console.log('\n🔍 Test 2: Verify data consistency');
        console.log('-'.repeat(50));
        
        // Get individual submissions for comparison
        const individualOptions = {
          hostname: 'localhost',
          port: 5000,
          path: `/api/public/submissions/user/${testUserId}?page=1&pageSize=100`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        const individualResponse = await makeRequest(individualOptions);
        
        if (individualResponse.statusCode === 200 && individualResponse.data.success) {
          const submissions = individualResponse.data.submissions || [];
          
          // Group submissions by formId to verify aggregation
          const groupedSubmissions = {};
          submissions.forEach(sub => {
            const formId = sub.formId;
            if (!groupedSubmissions[formId]) {
              groupedSubmissions[formId] = [];
            }
            groupedSubmissions[formId].push(sub);
          });
          
          console.log(`📊 Individual submissions: ${submissions.length}`);
          console.log(`📊 Unique forms in submissions: ${Object.keys(groupedSubmissions).length}`);
          console.log(`📊 Aggregated forms returned: ${forms.length}`);
          
          // Verify each aggregated form matches the grouped data
          let allMatched = true;
          forms.forEach(form => {
            const submissionsForForm = groupedSubmissions[form.formId] || [];
            if (submissionsForForm.length !== form.submissionCount) {
              console.log(`❌ Mismatch for form ${form.formId}: expected ${submissionsForForm.length}, got ${form.submissionCount}`);
              allMatched = false;
            } else {
              console.log(`✅ Form ${form.formId}: ${form.submissionCount} submissions match`);
            }
          });
          
          if (allMatched) {
            console.log('✅ All aggregation counts are accurate!');
          } else {
            console.log('❌ Some aggregation counts are incorrect');
          }
        }
      } else {
        console.log('ℹ️  No forms found for this user');
      }
    } else {
      console.log('❌ Aggregated forms endpoint failed');
      console.log('Response:', response.data);
    }
    
    // Test 3: Test search functionality
    console.log('\n🔍 Test 3: Test search functionality');
    console.log('-'.repeat(50));
    
    const searchOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/public/submissions/user/${testUserId}/forms?page=1&pageSize=10&search=form`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const searchResponse = await makeRequest(searchOptions);
    console.log(`Search Status: ${searchResponse.statusCode}`);
    
    if (searchResponse.statusCode === 200 && searchResponse.data.success) {
      const searchForms = searchResponse.data.forms || [];
      console.log(`✅ Search found ${searchForms.length} forms`);
    } else {
      console.log('❌ Search failed');
    }
    
    // Test 4: Test pagination
    console.log('\n📄 Test 4: Test pagination');
    console.log('-'.repeat(50));
    
    const paginationOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/public/submissions/user/${testUserId}/forms?page=1&pageSize=1`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const paginationResponse = await makeRequest(paginationOptions);
    console.log(`Pagination Status: ${paginationResponse.statusCode}`);
    
    if (paginationResponse.statusCode === 200 && paginationResponse.data.success) {
      console.log(`✅ Pagination working - Page 1 of ${paginationResponse.data.totalPages}`);
      console.log(`   Total forms: ${paginationResponse.data.totalCount}`);
      console.log(`   Forms on page: ${paginationResponse.data.forms.length}`);
    } else {
      console.log('❌ Pagination failed');
    }
    
    console.log('\n🎉 Phase 2 Testing Complete!');
    console.log('=' * 70);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const healthOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
      timeout: 3000
    };
    
    await makeRequest(healthOptions);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Phase 2 Aggregated Forms Test');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running on localhost:5000');
    console.log('💡 Please start the server first with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running');
  await testAggregatedFormsEndpoint();
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
