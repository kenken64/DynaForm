#!/bin/bash

# NDI Public Controller Test Script
# Tests the NDI proof request and status endpoints

echo "🧪 Testing NDI Public Controller Endpoints..."

BASE_URL="https://formbt.com"
# For local testing, uncomment the following line:
# BASE_URL="http://localhost:3000"

echo "📍 Base URL: $BASE_URL"

# Test 1: Create a proof request
echo ""
echo "🔍 Test 1: POST /api/ndi/proof-request (create proof request)"
PROOF_RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/ndi/proof-request")

echo "$PROOF_RESPONSE"

# Extract thread ID from response (if successful)
THREAD_ID=$(echo "$PROOF_RESPONSE" | grep -o '"threadId":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "---"

if [ -n "$THREAD_ID" ]; then
  echo ""
  echo "🔍 Test 2: GET /api/ndi/proof-status/$THREAD_ID (check proof status)"
  curl -s -w "\nHTTP Status: %{http_code}\n" \
    -H "Content-Type: application/json" \
    "$BASE_URL/api/ndi/proof-status/$THREAD_ID"
else
  echo ""
  echo "⚠️  Test 2: Skipped - No thread ID available from previous request"
fi

echo ""
echo "---"

# Test 3: Test with invalid thread ID
echo ""
echo "🔍 Test 3: GET /api/ndi/proof-status/invalid-id (test error handling)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/ndi/proof-status/invalid-thread-id"

echo ""
echo "---"

# Test 4: Test missing thread ID parameter
echo ""
echo "🔍 Test 4: GET /api/ndi/proof-status/ (test missing parameter)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/ndi/proof-status/"

echo ""
echo "✅ NDI Public Controller tests completed!"

echo ""
echo "📋 Environment Variables Required:"
echo "- NDI_CLIENT_ID: Your NDI client ID"
echo "- NDI_CLIENT_SECRET: Your NDI client secret" 
echo "- WEBHOOK_ID: Your webhook ID"
echo "- WEBHOOK_TOKEN: Your webhook token"
echo ""
echo "💡 Make sure these are set in your .env.ssl file and docker-compose.ssl.yml"
