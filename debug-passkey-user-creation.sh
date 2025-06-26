#!/bin/bash

echo "🔍 Investigating Passkey Authentication User Creation Issue"
echo "========================================================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker command not found. Please ensure Docker is installed and running."
    exit 1
fi

echo "📋 Checking MongoDB collections for recent user records..."

# Check users collection for recent records
echo "🔍 Recent users in database:"
docker compose -f docker-compose.ssl.yml exec mongodb mongosh --eval "
    use doc2formjson;
    db.users.find({}, {
        username: 1, 
        email: 1, 
        fullName: 1, 
        createdAt: 1,
        passkeys: { \$size: 1 }
    }).sort({createdAt: -1}).limit(5).forEach(function(doc) {
        print('User: ' + doc.username + ' | Email: ' + doc.email + ' | Created: ' + doc.createdAt + ' | Passkeys: ' + (doc.passkeys ? doc.passkeys.length : 0));
    });
"

echo ""
echo "🔍 Checking passkey challenges collection:"
docker compose -f docker-compose.ssl.yml exec mongodb mongosh --eval "
    use doc2formjson;
    db.passkey_challenges.find({}).sort({createdAt: -1}).limit(3).forEach(function(doc) {
        print('Challenge: ' + doc.type + ' | Created: ' + doc.createdAt + ' | Expires: ' + doc.expiresAt);
    });
"

echo ""
echo "🔍 Checking API logs for authentication attempts:"
docker compose -f docker-compose.ssl.yml logs doc2formjson-api | grep -E "(passkey|authentication|register|User|insertOne)" | tail -10

echo ""
echo "🔍 Checking recent MongoDB operations:"
docker compose -f docker-compose.ssl.yml logs mongodb | grep -E "(insert|create|user)" | tail -5

echo ""
echo "📋 Analysis Complete!"
echo "If users are being created during failed passkey authentication,"
echo "check the API logs above for any error handling that might trigger user creation."
