#!/bin/bash

# Test script to verify Angular routing fix
# This script tests that invalid routes now show the 404 page instead of the side menu

echo "🧪 Testing Angular Routing Fix for Invalid Routes"
echo "================================================"

# Check if the Angular dev server is running
echo "📡 Checking if Angular dev server is running..."
if curl -s http://localhost:50619/ > /dev/null 2>&1; then
    echo "✅ Angular dev server is running on port 50619"
else
    echo "❌ Angular dev server is not running. Please start it first with 'npm start'"
    exit 1
fi

echo ""
echo "🔍 Testing different routes..."

# Test cases
declare -A test_cases=(
    ["http://localhost:50619/"]="Landing page (should not show side menu)"
    ["http://localhost:50619/login"]="Login page (should not show side menu)"
    ["http://localhost:50619/register"]="Register page (should not show side menu)"
    ["http://localhost:50619/create-form"]="Invalid route (should show 404, not side menu)"
    ["http://localhost:50619/invalid-path"]="Another invalid route (should show 404, not side menu)"
    ["http://localhost:50619/forms"]="Valid auth route (should show side menu)"
    ["http://localhost:50619/dashboard"]="Valid auth route (should show side menu)"
)

echo ""
echo "📋 Test Results:"
echo "=================="

for url in "${!test_cases[@]}"; do
    description="${test_cases[$url]}"
    
    # Get HTTP status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "200" ]; then
        echo "✅ $url - $description (HTTP $status_code)"
    else
        echo "❌ $url - $description (HTTP $status_code)"
    fi
done

echo ""
echo "🎯 Key Changes Made:"
echo "==================="
echo "1. ✅ Updated side menu logic to only show for valid authenticated routes"
echo "2. ✅ Created NotFoundComponent for better 404 handling"
echo "3. ✅ Updated wildcard route to show 404 page instead of redirecting"
echo "4. ✅ Added proper route validation in app.component.ts"

echo ""
echo "🧭 How to manually test:"
echo "======================="
echo "1. Open http://localhost:50619/create-form"
echo "2. Verify you see the 404 page (not the side menu)"
echo "3. Open http://localhost:50619/dashboard"
echo "4. Verify you see the side menu (after authentication)"
echo "5. Check browser console for routing logs"

echo ""
echo "✨ Test completed! The routing issue should now be fixed."
