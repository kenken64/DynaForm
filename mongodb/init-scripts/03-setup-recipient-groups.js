// MongoDB initialization script for recipient groups collection
// This script should be run to set up the recipientGroups collection with proper indexes

db = db.getSiblingDB('doc2formjson');

// Create recipientGroups collection if it doesn't exist
db.createCollection('recipientGroups');

// Create indexes for better performance
print('Creating indexes for recipientGroups collection...');

// Index for user-specific queries (most common query pattern)
db.recipientGroups.createIndex({ "createdBy": 1, "createdAt": -1 });

// Index for alias name searches (case-insensitive search support)
db.recipientGroups.createIndex({ "aliasName": "text", "description": "text" });

// Index for unique alias names per user
db.recipientGroups.createIndex({ "aliasName": 1, "createdBy": 1 }, { unique: true });

// Index for recipient ID lookups
db.recipientGroups.createIndex({ "recipientIds": 1 });

// Index for date-based queries
db.recipientGroups.createIndex({ "updatedAt": -1 });

print('Indexes created successfully for recipientGroups collection');

// Verify indexes
print('Current indexes on recipientGroups collection:');
db.recipientGroups.getIndexes().forEach(function(index) {
    print('  - ' + JSON.stringify(index.key) + ' (name: ' + index.name + ')');
});

print('recipientGroups collection setup complete!');
