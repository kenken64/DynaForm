#!/bin/bash
# MongoDB User Setup Script
# This script creates application-specific users with appropriate permissions

echo "Setting up MongoDB users for Doc2FormJSON application..."

# Wait for MongoDB to be ready
until mongo --eval "print(\"MongoDB is ready\")" > /dev/null 2>&1; do
    echo "Waiting for MongoDB to start..."
    sleep 2
done

# Create application user with read/write permissions
mongo doc2formjson --eval '
db.createUser({
    user: "doc2formapp",
    pwd: "apppassword123",
    roles: [
        {
            role: "readWrite",
            db: "doc2formjson"
        }
    ]
});

print("Application user created successfully");
'

# Create read-only user for analytics/reporting
mongo doc2formjson --eval '
db.createUser({
    user: "doc2formreader",
    pwd: "readerpassword123",
    roles: [
        {
            role: "read",
            db: "doc2formjson"
        }
    ]
});

print("Read-only user created successfully");
'

echo "MongoDB user setup completed!"
echo "Application user: doc2formapp (read/write access)"
echo "Read-only user: doc2formreader (read access)"
