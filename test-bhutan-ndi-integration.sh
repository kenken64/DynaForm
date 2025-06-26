#!/bin/bash

# Bhutan NDI Integration Test Script
# Tests the complete NDI login workflow

echo "🧪 Testing Bhutan NDI Integration..."

BASE_URL="https://formbt.com"
# For local testing, uncomment the following line:
# BASE_URL="http://localhost:3000"

echo "📍 Base URL: $BASE_URL"

echo ""
echo "🔍 Testing NDI Workflow Components:"
echo "1. Login component with NDI button"
echo "2. NDI endpoint for proof request creation"
echo "3. Bhutan NDI component with QR code display"
echo "4. Webhook endpoint for receiving verification results"

# Test 1: Check if NDI endpoint is available
echo ""
echo "🔍 Test 1: POST /api/ndi/proof-request (create proof request)"
PROOF_RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/ndi/proof-request")

echo "$PROOF_RESPONSE"

# Extract URL and thread ID from response (if successful)
PROOF_URL=$(echo "$PROOF_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
THREAD_ID=$(echo "$PROOF_RESPONSE" | grep -o '"threadId":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "---"

if [ -n "$PROOF_URL" ]; then
  echo ""
  echo "✅ Proof request URL generated: $PROOF_URL"
  
  echo ""
  echo "🔍 Test 2: QR Code Generation"
  QR_CODE_URL="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=$(echo "$PROOF_URL" | sed 's/:/\\:/g' | sed 's/\//\\//g')&format=png&ecc=M"
  echo "QR Code URL: $QR_CODE_URL"
  
  # Test QR code generation
  QR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$QR_CODE_URL")
  if [ "$QR_STATUS" = "200" ]; then
    echo "✅ QR Code generation successful"
  else
    echo "❌ QR Code generation failed (Status: $QR_STATUS)"
  fi
else
  echo "❌ No proof URL available from previous request"
fi

echo ""
echo "---"

if [ -n "$THREAD_ID" ]; then
  echo ""
  echo "🔍 Test 3: GET /api/ndi/proof-status/$THREAD_ID (check proof status)"
  curl -s -w "\nHTTP Status: %{http_code}\n" \
    -H "Content-Type: application/json" \
    "$BASE_URL/api/ndi/proof-status/$THREAD_ID"
else
  echo ""
  echo "⚠️  Test 3: Skipped - No thread ID available"
fi

echo ""
echo "---"

# Test 4: Check webhook endpoint
echo ""
echo "🔍 Test 4: GET /api/ndi-webhook (check webhook status)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/ndi-webhook"

echo ""
echo "---"

echo ""
echo "🎯 Complete Bhutan NDI Workflow:"
echo "1. User clicks 'Sign in with Bhutan NDI' on login page"
echo "2. Frontend navigates to /bhutan-ndi route"
echo "3. Bhutan NDI component calls POST /api/ndi/proof-request"
echo "4. Server creates NDI proof request and returns URL + thread ID"
echo "5. Component generates QR code from the proof URL"
echo "6. User scans QR code with Bhutan NDI mobile app"
echo "7. NDI sends verification result to /api/ndi-webhook"
echo "8. Component polls /api/ndi-webhook for results"
echo "9. On successful verification, user is redirected to dashboard"

echo ""
echo "📋 Environment Variables Required:"
echo "- NDI_CLIENT_ID: $NDI_CLIENT_ID"
echo "- NDI_CLIENT_SECRET: [CONFIGURED]"
echo "- WEBHOOK_ID: $WEBHOOK_ID" 
echo "- WEBHOOK_TOKEN: [CONFIGURED]"

echo ""
echo "✅ Bhutan NDI integration test completed!"

echo ""
echo "🌐 Frontend Routes:"
echo "- /login - Login page with NDI button"
echo "- /bhutan-ndi - NDI verification page with QR code"
echo "- /dashboard - Post-verification destination"

echo ""
echo "🔗 API Endpoints:"
echo "- POST /api/ndi/proof-request - Create verification request"
echo "- GET /api/ndi/proof-status/:id - Check verification status"
echo "- POST /api/ndi-webhook - Receive NDI notifications"
echo "- GET /api/ndi-webhook - Poll for verification results"
