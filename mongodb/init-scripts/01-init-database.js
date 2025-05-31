// MongoDB Initialization Script for Doc2FormJSON Application
// This script runs when the MongoDB container starts for the first time

// Switch to the doc2formjson database
db = db.getSiblingDB('doc2formjson');

// Create collections with proper indexing for form data
db.createCollection('forms');
db.createCollection('form_submissions');
db.createCollection('users');
db.createCollection('form_templates');

// Create indexes for better performance
print('Creating indexes for form_submissions collection...');

// Index for form searches
db.form_submissions.createIndex({ "formId": 1 });
db.form_submissions.createIndex({ "formTitle": "text" });
db.form_submissions.createIndex({ "userInfo.submittedBy": 1 });
db.form_submissions.createIndex({ "submissionMetadata.submittedAt": -1 });

// Compound index for search functionality
db.form_submissions.createIndex({ 
    "formTitle": "text", 
    "userInfo.submittedBy": "text",
    "userInfo.username": "text"
});

// Index for form data content search
db.form_submissions.createIndex({ "formData": "text" });

print('Creating indexes for forms collection...');
db.forms.createIndex({ "title": "text" });
db.forms.createIndex({ "createdAt": -1 });
db.forms.createIndex({ "userId": 1 });

print('Creating indexes for users collection...');
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

print('Creating indexes for form_templates collection...');
db.form_templates.createIndex({ "name": "text" });
db.form_templates.createIndex({ "category": 1 });
db.form_templates.createIndex({ "createdAt": -1 });

// Insert sample data for testing
print('Inserting sample data...');

// Sample user
db.users.insertOne({
    _id: ObjectId(),
    username: "testuser",
    email: "test@example.com",
    createdAt: new Date(),
    role: "user"
});

// Sample form template
db.form_templates.insertOne({
    _id: ObjectId(),
    name: "Sample Form Template",
    category: "general",
    description: "A sample form template for testing",
    fields: [
        {
            type: "text",
            label: "Full Name",
            name: "fullName",
            required: true
        },
        {
            type: "email",
            label: "Email Address",
            name: "email",
            required: true
        },
        {
            type: "textarea",
            label: "Comments",
            name: "comments",
            required: false
        }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
});

print('MongoDB initialization completed successfully!');
print('Database: doc2formjson');
print('Collections created: forms, form_submissions, users, form_templates');
print('Indexes created for optimized search and retrieval');
print('Sample data inserted for testing');
