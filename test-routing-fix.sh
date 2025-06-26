#!/bin/bash

# Test Angular Routing Fix
# This script tests the /form-viewer/:id route fix

echo "🧪 Testing Angular Routing Fix for /form-viewer/:id"
echo "=================================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not available. Please install Docker to test the deployment."
    exit 1
fi

# Function to test route response
test_route() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo "🔍 Testing: $description"
    echo "   URL: $url"
    
    # Test with curl and capture response
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo "   ✅ SUCCESS: Got expected status $response"
    else
        echo "   ❌ FAILED: Expected $expected_status, got $response"
    fi
    echo ""
}

# Function to check if services are running
check_services() {
    echo "🔍 Checking Docker services status..."
    
    if docker compose -f docker-compose.ssl.yml ps | grep -q "Up"; then
        echo "✅ Docker services are running"
        return 0
    else
        echo "❌ Docker services are not running"
        echo "💡 Please run: docker compose -f docker-compose.ssl.yml up -d"
        return 1
    fi
}

# Function to rebuild and restart services
rebuild_services() {
    echo "🔄 Rebuilding and restarting services..."
    
    # Stop services
    echo "🛑 Stopping services..."
    docker compose -f docker-compose.ssl.yml down
    
    # Build and start services
    echo "🚀 Building and starting services..."
    docker compose -f docker-compose.ssl.yml up --build -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Check if services are healthy
    echo "🔍 Checking service health..."
    docker compose -f docker-compose.ssl.yml ps
}

# Main test execution
echo "📋 Test Plan:"
echo "1. Check if services are running"
echo "2. Test routing endpoints"
echo "3. Verify SPA fallback behavior"
echo ""

# Check services
if ! check_services; then
    echo "🔧 Services not running. Do you want to rebuild and start them? (y/n)"
    read -r response
    if [[ "$response" = "y" || "$response" = "Y" ]]; then
        rebuild_services
    else
        echo "❌ Cannot test without running services. Exiting."
        exit 1
    fi
fi

# Test basic connectivity
echo "🌐 Testing basic connectivity..."
BASE_URL="https://dynaform.xyz"
test_route "$BASE_URL" "200" "Main landing page"

# Test API endpoints
echo "🔌 Testing API endpoints..."
test_route "$BASE_URL/api/health" "200" "API health check"

# Test Angular routes (these should return 200 for Angular app)
echo "🅰️ Testing Angular routes..."
test_route "$BASE_URL/dashboard" "200" "Dashboard route"
test_route "$BASE_URL/forms" "200" "Forms list route"
test_route "$BASE_URL/form-editor" "200" "Form editor route"

# Test the specific route we fixed
echo "🎯 Testing the fixed /form-viewer/:id route..."
test_route "$BASE_URL/form-viewer/test123" "200" "Form viewer route (should load Angular app)"

# Test SPA fallback for non-existent routes
echo "🔄 Testing SPA fallback..."
test_route "$BASE_URL/non-existent-route" "200" "Non-existent route (should fallback to Angular)"

# Test static files
echo "📁 Testing static file serving..."
test_route "$BASE_URL/favicon.ico" "200" "Favicon (static file)"

echo "🏁 Test Summary:"
echo "=================="
echo "✅ If all tests show SUCCESS, the routing fix is working correctly"
echo "❌ If any tests show FAILED, there may still be configuration issues"
echo ""
echo "📝 Manual tests to perform in browser:"
echo "1. Navigate to https://dynaform.xyz/form-viewer/test123"
echo "2. Refresh the page (should not show 404)"
echo "3. Check that authentication redirects work properly"
echo "4. Test form editor 'Preview' button functionality"
echo ""
echo "🔧 If issues persist:"
echo "1. Check docker logs: docker compose -f docker-compose.ssl.yml logs nginx"
echo "2. Check Angular build: docker compose -f docker-compose.ssl.yml logs frontend"
echo "3. Verify SSL certificates: openssl s_client -connect dynaform.xyz:443"
