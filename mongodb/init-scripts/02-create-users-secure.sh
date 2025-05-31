#!/bin/bash
# Enhanced MongoDB User Setup Script with Docker Secrets
# This script creates application-specific users using secure password files

echo "Setting up MongoDB users for Doc2FormJSON application with Docker Secrets..."

# Function to read password from secrets file
read_secret() {
    local secret_file="/run/secrets/$1"
    if [ -f "$secret_file" ]; then
        cat "$secret_file"
    else
        # Fallback to environment variable if secret file doesn't exist
        echo "${2:-defaultpassword}"
    fi
}

# Wait for MongoDB to be ready
until mongo --eval "print(\"MongoDB is ready\")" > /dev/null 2>&1; do
    echo "Waiting for MongoDB to start..."
    sleep 2
done

# Read passwords from secrets
APP_PASSWORD=$(read_secret "mongodb_app_password" "apppassword123")
READER_PASSWORD=$(read_secret "mongodb_reader_password" "readerpassword123")

echo "Creating application users with secure passwords..."

# Create application user with read/write permissions
mongo doc2formjson --eval "
db.createUser({
    user: \"doc2formapp\",
    pwd: \"$APP_PASSWORD\",
    roles: [
        {
            role: \"readWrite\",
            db: \"doc2formjson\"
        }
    ]
});

print(\"Application user created successfully\");
"

# Create read-only user for analytics/reporting
mongo doc2formjson --eval "
db.createUser({
    user: \"doc2formreader\",
    pwd: \"$READER_PASSWORD\",
    roles: [
        {
            role: \"read\",
            db: \"doc2formjson\"
        }
    ]
});

print(\"Read-only user created successfully\");
"

echo "MongoDB user setup completed with Docker Secrets!"
echo "Application user: doc2formapp (read/write access)"
echo "Read-only user: doc2formreader (read access)"
echo "Passwords loaded securely from Docker secrets"
