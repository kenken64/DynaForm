#!/usr/bin/env node
/**
 * Debug Checkbox Values in Submission Data
 * Connects to MongoDB to examine how checkbox values are stored
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson?authSource=admin';
const DATABASE_NAME = 'doc2formjson';

async function debugCheckboxValues() {
  let client;
  
  try {
    console.log('🔍 Connecting to MongoDB to examine checkbox values...\n');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const submissionsCollection = db.collection('public_form_submissions');
    
    // Get a few sample submissions to examine their structure
    console.log('📋 Fetching sample submissions...');
    const submissions = await submissionsCollection.find({}).limit(5).toArray();
    
    console.log(`Found ${submissions.length} submissions\n`);
    
    submissions.forEach((submission, index) => {
      console.log(`--- Submission ${index + 1} ---`);
      console.log(`ID: ${submission._id}`);
      console.log(`Form ID: ${submission.formId}`);
      console.log(`Submission Data:`, JSON.stringify(submission.submissionData, null, 2));
      
      // Analyze each field in submission data
      if (submission.submissionData && typeof submission.submissionData === 'object') {
        Object.entries(submission.submissionData).forEach(([key, value]) => {
          console.log(`\nField: ${key}`);
          console.log(`Value type: ${typeof value}`);
          console.log(`Value:`, value);
          
          // Check if it looks like a checkbox
          if (typeof value === 'object' && value !== null) {
            if (value.type === 'single_checkbox' || value.type === 'checkbox_group') {
              console.log(`🔲 CHECKBOX DETECTED: ${value.type}`);
              if (value.type === 'single_checkbox') {
                console.log(`   Checked: ${value.checked}`);
              } else if (value.type === 'checkbox_group') {
                console.log(`   Selected: ${JSON.stringify(value.selected)}`);
                console.log(`   All options: ${JSON.stringify(value.all_options)}`);
              }
            } else {
              console.log(`❓ Unknown object structure:`, Object.keys(value));
            }
          }
        });
      }
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

debugCheckboxValues();
