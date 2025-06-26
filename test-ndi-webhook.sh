#!/bin/bash

# NDI Webhook Test Script
# Tests the webhook endpoint after deployment

echo "🧪 Testing NDI Webhook Endpoints..."

BASE_URL="https://formbt.com"
# For local testing, uncomment the following line:
# BASE_URL="http://localhost:3000"

echo "📍 Base URL: $BASE_URL"

# Test 1: Check if GET endpoint is available (should return null proof initially)
echo ""
echo "🔍 Test 1: GET /api/ndi-webhook (check initial state)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/ndi-webhook"

echo ""
echo "---"

# Test 2: Send a test webhook
echo ""
echo "📤 Test 2: POST /api/ndi-webhook (send test webhook)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "present-proof/presentation-result",
    "data": {
      "verified": true,
      "credentials": ["test-credential"],
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }' \
  "$BASE_URL/api/ndi-webhook"

echo ""
echo "---"

# Test 3: Check if the webhook was stored
echo ""
echo "🔍 Test 3: GET /api/ndi-webhook (verify data was stored)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/ndi-webhook"

echo ""
echo "---"

# Test 4: Send a non-proof webhook (should not be stored)
echo ""
echo "📤 Test 4: POST /api/ndi-webhook (send non-proof webhook)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "other-type",
    "data": {
      "message": "This should not be stored"
    }
  }' \
  "$BASE_URL/api/ndi-webhook"

echo ""
echo "---"

# Test 5: Verify the proof data is still the same (not overwritten)
echo ""
echo "🔍 Test 5: GET /api/ndi-webhook (verify proof data unchanged)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/ndi-webhook"

echo ""
echo "✅ NDI Webhook tests completed!"
