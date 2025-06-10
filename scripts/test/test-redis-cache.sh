#!/bin/bash

# Redis Cache Implementation Test Script
# Tests the caching functionality for OCR form data

echo "🧪 Redis Cache Implementation Test"
echo "================================="

# Check if Redis is running
echo "🔍 Checking Redis connection..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   brew services start redis  # macOS"
    echo "   or"
    echo "   docker run -d --name redis -p 6379:6379 redis:latest"
    exit 1
fi

echo "✅ Redis is running"

# Set test variables
SERVER_URL="http://localhost:3000"
API_ENDPOINT="$SERVER_URL/api/describe-image"
CACHE_STATS_ENDPOINT="$SERVER_URL/api/cache/stats"
CACHE_CLEAR_ENDPOINT="$SERVER_URL/api/cache/clear"
HEALTH_ENDPOINT="$SERVER_URL/api/health"

# Check if server is running
echo ""
echo "🔍 Checking server health..."
if ! curl -s "$HEALTH_ENDPOINT" > /dev/null; then
    echo "❌ Server is not running. Please start the server first:"
    echo "   cd server && npm run dev"
    exit 1
fi

echo "✅ Server is running"

# Clear existing cache
echo ""
echo "🧹 Clearing existing cache..."
CLEAR_RESULT=$(curl -s -X DELETE "$CACHE_CLEAR_ENDPOINT")
echo "Cache clear result: $CLEAR_RESULT"

# Get initial cache stats
echo ""
echo "📊 Initial cache stats:"
curl -s "$CACHE_STATS_ENDPOINT" | jq '.'

# Test image path
TEST_IMAGE="./data/medical_form.pdf"
if [ ! -f "$TEST_IMAGE" ]; then
    echo "❌ Test image not found: $TEST_IMAGE"
    echo "Please ensure the test image exists"
    exit 1
fi

# Form analysis prompt
FORM_PROMPT="Analyze this form and extract all field information as JSON with the following structure: {\"forms\": [{\"title\": \"form_title\", \"fields\": [{\"label\": \"field_label\", \"type\": \"field_type\", \"value\": \"field_value\"}]}]}"

echo ""
echo "🚀 Testing Redis caching with form analysis..."

# First request (should be cache MISS)
echo ""
echo "📝 First request (expected: Cache MISS)..."
START_TIME=$(date +%s%N)
FIRST_RESULT=$(curl -s -X POST "$API_ENDPOINT" \
  -F "imageFile=@$TEST_IMAGE" \
  -F "prompt=$FORM_PROMPT" \
  -F "model=qwen2.5vl:latest")
END_TIME=$(date +%s%N)
FIRST_DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

echo "First request took: ${FIRST_DURATION}ms"
echo "Response preview:"
echo "$FIRST_RESULT" | jq '.description' | head -c 200
echo "..."

# Second request (should be cache HIT)
echo ""
echo "📝 Second request (expected: Cache HIT)..."
START_TIME=$(date +%s%N)
SECOND_RESULT=$(curl -s -X POST "$API_ENDPOINT" \
  -F "imageFile=@$TEST_IMAGE" \
  -F "prompt=$FORM_PROMPT" \
  -F "model=qwen2.5vl:latest")
END_TIME=$(date +%s%N)
SECOND_DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

echo "Second request took: ${SECOND_DURATION}ms"
echo "Response preview:"
echo "$SECOND_RESULT" | jq '.description' | head -c 200
echo "..."

# Performance comparison
echo ""
echo "⚡ Performance Comparison:"
echo "First request (no cache): ${FIRST_DURATION}ms"
echo "Second request (cached): ${SECOND_DURATION}ms"

if [ "$SECOND_DURATION" -lt "$FIRST_DURATION" ]; then
    IMPROVEMENT=$(( (FIRST_DURATION - SECOND_DURATION) * 100 / FIRST_DURATION ))
    echo "✅ Cache improved performance by ${IMPROVEMENT}%"
else
    echo "⚠️ Cache did not improve performance (possible issue)"
fi

# Get final cache stats
echo ""
echo "📊 Final cache stats:"
curl -s "$CACHE_STATS_ENDPOINT" | jq '.'

# Test with non-form request (should not be cached)
echo ""
echo "🖼️ Testing non-form request (should not be cached)..."
NON_FORM_PROMPT="Describe this image in detail"
curl -s -X POST "$API_ENDPOINT" \
  -F "imageFile=@$TEST_IMAGE" \
  -F "prompt=$NON_FORM_PROMPT" \
  -F "model=qwen2.5vl:latest" > /dev/null

echo "Non-form request completed"

# Final cache stats
echo ""
echo "📊 Cache stats after non-form request:"
curl -s "$CACHE_STATS_ENDPOINT" | jq '.'

echo ""
echo "🎉 Redis Cache Test Complete!"
echo ""
echo "Expected Results:"
echo "1. ✅ First form request should be slower (cache MISS)"
echo "2. ✅ Second form request should be faster (cache HIT)" 
echo "3. ✅ Cache stats should show 1 OCR cache key"
echo "4. ✅ Non-form requests should not affect cache count"
echo ""
echo "If you see performance improvements and cache hits, the implementation is working! 🚀"
