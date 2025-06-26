#!/bin/bash

echo "🧪 Testing Passkey Authentication Error Handling"
echo "==============================================="

echo "This script will help you test that failed passkey authentication"
echo "does NOT trigger user registration in the backend."
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker command not found. Please ensure Docker is installed and running."
    exit 1
fi

echo "📋 Step 1: Count current users in database"
INITIAL_USER_COUNT=$(docker compose -f docker-compose.ssl.yml exec mongodb mongosh --quiet --eval "
    use doc2formjson;
    db.users.countDocuments();
" 2>/dev/null | tail -1)

echo "Initial user count: $INITIAL_USER_COUNT"
echo ""

echo "📋 Step 2: Monitor authentication attempts in real-time"
echo "Open another terminal and run: ./monitor-passkey-auth.sh"
echo ""
echo "📋 Step 3: Manual Test Instructions"
echo ""
echo "1. Open your browser and go to https://formbt.com/login"
echo "2. Click 'Sign in with Passkey'"
echo "3. Try authentication with a passkey that DOESN'T exist in the system"
echo "4. OR cancel the passkey prompt"
echo "5. OR use an invalid passkey"
echo ""
echo "Expected behavior:"
echo "✅ Authentication should fail gracefully"
echo "✅ Error message should be shown"
echo "❌ NO new user should be created in database"
echo "❌ NO registration should be triggered"
echo ""

read -p "Press Enter after you've completed the test to check results..."

echo ""
echo "📋 Step 4: Check if any new users were created"
FINAL_USER_COUNT=$(docker compose -f docker-compose.ssl.yml exec mongodb mongosh --quiet --eval "
    use doc2formjson;
    db.users.countDocuments();
" 2>/dev/null | tail -1)

echo "Final user count: $FINAL_USER_COUNT"
echo ""

if [ "$INITIAL_USER_COUNT" -eq "$FINAL_USER_COUNT" ]; then
    echo "✅ SUCCESS: No new users were created during failed authentication"
    echo "   Frontend error handling is working correctly!"
else
    echo "❌ PROBLEM: New users were created during failed authentication"
    echo "   User count increased from $INITIAL_USER_COUNT to $FINAL_USER_COUNT"
    echo ""
    echo "📋 Recent users created:"
    docker compose -f docker-compose.ssl.yml exec mongodb mongosh --eval "
        use doc2formjson;
        db.users.find({}, {
            username: 1, 
            email: 1, 
            createdAt: 1
        }).sort({createdAt: -1}).limit(3).forEach(function(doc) {
            print('User: ' + doc.username + ' | Email: ' + doc.email + ' | Created: ' + doc.createdAt);
        });
    "
fi

echo ""
echo "📋 Step 5: Check API logs for any registration calls"
echo "Looking for recent registration attempts..."
docker compose -f docker-compose.ssl.yml logs doc2formjson-api | grep -E "(register|insertOne|User registration)" | tail -5

echo ""
echo "🏁 Test complete!"
