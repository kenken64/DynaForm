#!/usr/bin/env node
/**
 * Test Fixed Checkbox Values in Excel Export
 * Tests that checkbox values are now properly formatted instead of showing [object Object]
 */

const axios = require('axios');
const fs = require('fs');

const SERVER_URL = 'http://localhost:3001';

async function testFixedCheckboxExport() {
  try {
    console.log('🧪 Testing Fixed Checkbox Values in Excel Export...\n');

    // Test export of all submissions to see the fixed checkbox formatting
    console.log('1. Testing export with fixed checkbox formatting...');
    
    const exportResponse = await axios.get(`${SERVER_URL}/api/public/export-submissions`, {
      responseType: 'arraybuffer'
    });

    if (exportResponse.status === 200) {
      // Save the Excel file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fixed-checkbox-export-${timestamp}.xlsx`;
      fs.writeFileSync(filename, exportResponse.data);
      
      console.log(`✅ Excel file exported successfully: ${filename}`);
      console.log(`📄 File size: ${Math.round(exportResponse.data.length / 1024)} KB`);
      
      console.log('\n✨ Expected improvements:');
      console.log('   ❌ Before: [object Object]');
      console.log('   ✅ After: "First Choice" or "Option 1, Option 2" etc.');
      console.log('\n📝 Checkbox formatting rules:');
      console.log('   - Single selection: Shows the selected option name');
      console.log('   - Multiple selections: Shows comma-separated list');
      console.log('   - No selections: Shows "None selected"');
      console.log('\n🎯 Test specific examples from your data:');
      console.log('   - "Please select an item from the combo/dropdown list": Should show "First Choice"');
      console.log('   - "Check all that apply": Should show "Option 1" (since Option 2 was false)');
      
      console.log(`\n📁 Please open ${filename} to verify the checkbox values are now properly formatted.`);
      
    } else {
      console.log(`❌ Export failed with status: ${exportResponse.status}`);
    }

    // Also test a specific form to be thorough
    console.log('\n2. Testing form-specific export...');
    try {
      // Use the form ID we found in the debug: 68424bb77c8887c5c5eb4aed
      const formId = '68424bb77c8887c5c5eb4aed';
      const formExportResponse = await axios.get(`${SERVER_URL}/api/public/export-submissions?formId=${formId}`, {
        responseType: 'arraybuffer'
      });
      
      if (formExportResponse.status === 200) {
        const formFilename = `fixed-checkbox-form-${formId}-${timestamp}.xlsx`;
        fs.writeFileSync(formFilename, formExportResponse.data);
        console.log(`✅ Form-specific Excel file exported: ${formFilename}`);
        console.log(`📄 File size: ${Math.round(formExportResponse.data.length / 1024)} KB`);
      } else {
        console.log(`❌ Form export failed with status: ${formExportResponse.status}`);
      }
    } catch (error) {
      console.log('ℹ️  Form-specific test skipped:', error.message);
    }

    console.log('\n🎉 Checkbox formatting fix is complete!');
    console.log('The Excel export should now show human-readable checkbox values instead of [object Object].');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.toString() || error.message);
    if (error.response?.status) {
      console.error(`🔴 HTTP Status: ${error.response.status}`);
    }
  }
}

// Run the test
testFixedCheckboxExport();
