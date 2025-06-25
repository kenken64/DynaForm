// MongoDB Initialization Script for Doc2FormJSON Application
// This script runs when the MongoDB container starts for the first time
// NO AUTHENTICATION VERSION

// Switch to the doc2formjson database
db = db.getSiblingDB('doc2formjson');

print('Initializing doc2formjson database without authentication...');

// Create collections with proper indexing for form data
db.createCollection('forms');
db.createCollection('form_submissions');
db.createCollection('users');
db.createCollection('form_templates');
db.createCollection('recipient_groups');
db.createCollection('recipients');

print('Created collections: forms, form_submissions, users, form_templates, recipient_groups, recipients');

// Create indexes for better performance
print('Creating indexes for form_submissions collection...');

// Index for form searches
db.form_submissions.createIndex({ "formId": 1 });
db.form_submissions.createIndex({ "formTitle": "text" });
db.form_submissions.createIndex({ "userInfo.submittedBy": 1 });
db.form_submissions.createIndex({ "submissionMetadata.submittedAt": -1 });

print('Creating indexes for forms collection...');
db.forms.createIndex({ "_id": 1 });
db.forms.createIndex({ "title": "text" });
db.forms.createIndex({ "createdBy": 1 });
db.forms.createIndex({ "createdAt": -1 });

print('Creating indexes for users collection...');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });

print('Creating indexes for recipient_groups collection...');
db.recipient_groups.createIndex({ "name": 1 });
db.recipient_groups.createIndex({ "createdBy": 1 });

print('Creating indexes for recipients collection...');
db.recipients.createIndex({ "email": 1 });
db.recipients.createIndex({ "name": 1 });

print('Database initialization completed successfully - No authentication enabled');
