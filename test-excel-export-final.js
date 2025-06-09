const axios = require('axios');
const fs = require('fs');

// Test Excel export functionality
async function testExcelExport() {
  try {
    console.log('🧪 Testing Excel Export Functionality...\n');

    // First, get aggregated forms to find a form with submissions
    // Using the actual user ID from the database: 683d4086689a80717b008cfa
    console.log('1. Getting aggregated forms...');
    const aggregatedResponse = await axios.get('http://localhost:3001/api/public/submissions/user/683d4086689a80717b008cfa/forms');
    
    if (aggregatedResponse.data.success && aggregatedResponse.data.forms && aggregatedResponse.data.forms.length === 0) {
      console.log('❌ No forms found for this user');
      return;
    }

    console.log(`✅ Found ${aggregatedResponse.data.forms ? aggregatedResponse.data.forms.length : 0} forms`);
    if (aggregatedResponse.data.forms) {
      aggregatedResponse.data.forms.forEach((form, index) => {
        console.log(`   ${index + 1}. Form: ${form.formTitle} (ID: ${form.formId}) - ${form.submissionCount} submissions`);
      });
    }

    // Find a form with submissions
    const formWithSubmissions = aggregatedResponse.data.find(form => form.submissionCount > 0);
    
    if (!formWithSubmissions) {
      console.log('❌ No forms with submissions found');
      return;
    }

    console.log(`\n2. Testing Excel export for form: ${formWithSubmissions.formTitle} (${formWithSubmissions.submissionCount} submissions)`);

    // Test Excel export for this specific form
    const exportResponse = await axios.get(`http://localhost:3001/api/public/submissions/export?formId=${formWithSubmissions.formId}`, {
      responseType: 'arraybuffer'
    });

    if (exportResponse.status === 200) {
      // Save the Excel file
      const filename = `test-export-${formWithSubmissions.formId}.xlsx`;
      fs.writeFileSync(filename, exportResponse.data);
      console.log(`✅ Excel file exported successfully: ${filename}`);
      console.log(`📄 File size: ${Math.round(exportResponse.data.length / 1024)} KB`);
      
      // Check response headers
      const contentType = exportResponse.headers['content-type'];
      const contentDisposition = exportResponse.headers['content-disposition'];
      console.log(`📋 Content-Type: ${contentType}`);
      console.log(`📋 Content-Disposition: ${contentDisposition}`);
    } else {
      console.log(`❌ Export failed with status: ${exportResponse.status}`);
    }

    // Also test export without formId (all submissions)
    console.log('\n3. Testing Excel export for all submissions...');
    const allExportResponse = await axios.get('http://localhost:3001/api/public/submissions/export', {
      responseType: 'arraybuffer'
    });

    if (allExportResponse.status === 200) {
      const filename = 'test-export-all.xlsx';
      fs.writeFileSync(filename, allExportResponse.data);
      console.log(`✅ All submissions Excel file exported successfully: ${filename}`);
      console.log(`📄 File size: ${Math.round(allExportResponse.data.length / 1024)} KB`);
    } else {
      console.log(`❌ All export failed with status: ${allExportResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`🔴 HTTP Status: ${error.response.status}`);
    }
  }
}

testExcelExport();
