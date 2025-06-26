#!/bin/bash

# SSE NDI Integration Test Script
# Tests the Server-Sent Events functionality for NDI verification

echo "🧪 Testing SSE NDI Integration..."

BASE_URL="https://formbt.com"
# For local testing, uncomment the following line:
# BASE_URL="http://localhost:3000"

echo "📍 Base URL: $BASE_URL"

# Test 1: Create a proof request first
echo ""
echo "🔍 Test 1: POST /api/ndi/proof-request (create proof request)"
PROOF_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" "$BASE_URL/api/ndi/proof-request")
echo "$PROOF_RESPONSE"

THREAD_ID=$(echo "$PROOF_RESPONSE" | grep -o '"threadId":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "---"

# Test 2: Test SSE connection
echo ""
echo "🔍 Test 2: GET /api/ndi-webhook/events (SSE connection)"
echo "Starting SSE connection (will run for 10 seconds)..."

# Start SSE connection in background and capture output
timeout 10s curl -N -s "$BASE_URL/api/ndi-webhook/events?threadId=$THREAD_ID" &
SSE_PID=$!

# Wait a moment for connection to establish
sleep 2

echo ""
echo "---"

# Test 3: Send a test webhook to trigger SSE event
echo ""
echo "🔍 Test 3: POST /api/ndi-webhook (trigger SSE event)"
echo "Sending test webhook payload..."

WEBHOOK_RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "present-proof/presentation-result",
    "data": {
      "verified": true,
      "credentials": ["test-credential"],
      "threadId": "'$THREAD_ID'",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    },
    "message": "Test NDI verification completed"
  }' \
  "$BASE_URL/api/ndi-webhook")

echo "$WEBHOOK_RESPONSE"

# Wait for SSE process to complete
wait $SSE_PID 2>/dev/null

echo ""
echo "---"

# Test 4: Test SSE heartbeat functionality
echo ""
echo "🔍 Test 4: SSE heartbeat test (5 seconds)"
echo "Testing SSE heartbeat and connection stability..."

timeout 5s curl -N -s "$BASE_URL/api/ndi-webhook/events" | head -20

echo ""
echo "---"

echo ""
echo "🎯 SSE NDI Workflow Summary:"
echo "1. Frontend creates SSE connection to /api/ndi-webhook/events"
echo "2. SSE connection sends 'connected' event with confirmation"
echo "3. Heartbeat events sent every 30 seconds to keep connection alive"
echo "4. When webhook receives NDI verification, broadcasts 'ndi-verification' event"
echo "5. Frontend receives event and automatically redirects to dashboard"

echo ""
echo "📡 SSE Events:"
echo "- connected: SSE connection established"
echo "- heartbeat: Keep-alive signal (every 30s)"
echo "- ndi-verification: NDI verification completed (triggers redirect)"

echo ""
echo "⚡ Benefits of SSE over Polling:"
echo "- Real-time notifications (no 5-second delay)"
echo "- Reduced server load (no constant HTTP requests)"
echo "- Persistent connection with automatic reconnection"
echo "- Immediate response to webhook events"

echo ""
echo "✅ SSE NDI integration test completed!"

if [ -n "$THREAD_ID" ]; then
  echo ""
  echo "🔗 Test URLs:"
  echo "- SSE Connection: $BASE_URL/api/ndi-webhook/events?threadId=$THREAD_ID"
  echo "- Webhook Endpoint: $BASE_URL/api/ndi-webhook"
  echo "- Frontend Page: $BASE_URL/bhutan-ndi?returnUrl=/dashboard"
else
  echo ""
  echo "⚠️  No thread ID available - make sure NDI environment variables are configured"
fi
