#!/bin/bash

# Test script for DynaForm SSL deployment
set -e

echo "🧪 Testing DynaForm SSL deployment..."

# Define service endpoints
AI_AGENT_URL="http://localhost:8001"
VERIFIABLE_CONTRACT_URL="http://localhost:3002"
API_URL="http://localhost:3000"
PDF_CONVERTER_URL="http://localhost:5001"

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local service_name=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $service_name ($url)... "
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    elif command -v wget >/dev/null 2>&1; then
        response=$(wget -q -O /dev/null -S "$url" 2>&1 | grep "HTTP/" | tail -1 | awk '{print $2}' || echo "000")
    else
        echo "❌ Neither curl nor wget available"
        return 1
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ FAILED ($response)"
        return 1
    fi
}

# Test all services
echo "📊 Testing service health endpoints..."

test_endpoint "$AI_AGENT_URL/health" "AI Agent"
test_endpoint "$VERIFIABLE_CONTRACT_URL/api/health" "Verifiable Contract"
test_endpoint "$API_URL/health" "Main API"
test_endpoint "$PDF_CONVERTER_URL/" "PDF Converter"

echo ""
echo "🐳 Docker container status:"
docker compose -f docker-compose.ssl.yml ps

echo ""
echo "📋 Service URLs:"
echo "  • AI Agent Health: $AI_AGENT_URL/health"
echo "  • Verifiable Contract Health: $VERIFIABLE_CONTRACT_URL/api/health"
echo "  • Main API Health: $API_URL/health"
echo "  • PDF Converter: $PDF_CONVERTER_URL/"

echo ""
echo "🔍 To view logs:"
echo "  docker compose -f docker-compose.ssl.yml logs -f [service-name]"

echo ""
echo "✅ Test completed!"
