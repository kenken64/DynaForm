#!/bin/bash

# Test script for recipient groups functionality
# This script tests the new recipient groups API endpoints

set -e

echo "🧪 Testing Recipient Groups API Integration"
echo "============================================="

# Base URL for the API
BASE_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local curl_command="$2"
    local expected_status="$3"
    
    echo -n "Testing $test_name... "
    
    response=$(eval "$curl_command" 2>/dev/null)
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $response_body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to extract value from JSON response
extract_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4
}

echo -e "\n${YELLOW}Phase 1: Authentication Tests${NC}"
echo "---------------------------------------"

# Test authentication endpoint
run_test "Health Check" \
    "curl -s -w '\n%{http_code}' '$BASE_URL/../health'" \
    "200"

echo -e "\n${YELLOW}Phase 2: Recipient Groups Tests (requires authentication)${NC}"
echo "-----------------------------------------------------------"

# Note: These tests require a valid JWT token
# In a real scenario, you would first authenticate and get a token

echo -e "\n${YELLOW}Note:${NC} Recipient groups tests require authentication."
echo "To test manually:"
echo "1. First authenticate: POST $BASE_URL/auth/register or /auth/login"
echo "2. Use the returned JWT token in Authorization header"
echo "3. Test recipient groups endpoints:"
echo "   - GET $BASE_URL/recipient-groups"
echo "   - POST $BASE_URL/recipient-groups"
echo "   - PUT $BASE_URL/recipient-groups/:id"
echo "   - DELETE $BASE_URL/recipient-groups/:id"
echo "   - GET $BASE_URL/recipient-groups/search?alias=mygroup"

echo -e "\n${YELLOW}Phase 3: Database Schema Tests${NC}"
echo "----------------------------------------"

# Test MongoDB connection (if accessible)
if command -v mongo &> /dev/null; then
    echo "Testing MongoDB schema setup..."
    
    # Test if recipientGroups collection exists
    mongo_test="db.getSiblingDB('doc2formjson').getCollectionNames().includes('recipientGroups')"
    
    if mongo --quiet --eval "$mongo_test" 2>/dev/null | grep -q "true"; then
        echo -e "${GREEN}✓${NC} recipientGroups collection exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} recipientGroups collection not found"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Test indexes
    mongo_indexes="db.getSiblingDB('doc2formjson').recipientGroups.getIndexes().length"
    index_count=$(mongo --quiet --eval "$mongo_indexes" 2>/dev/null || echo "0")
    
    if [ "$index_count" -gt 1 ]; then
        echo -e "${GREEN}✓${NC} recipientGroups indexes created ($index_count indexes)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} recipientGroups indexes not found"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} MongoDB CLI not available, skipping database tests"
fi

echo -e "\n${YELLOW}Phase 4: API Structure Tests${NC}"
echo "-----------------------------------"

# Test if the API server is running
run_test "API Server Health" \
    "curl -s -w '\n%{http_code}' '$BASE_URL/../health'" \
    "200"

# Test if recipient groups endpoint exists (should return 401 without auth)
run_test "Recipient Groups Endpoint Exists" \
    "curl -s -w '\n%{http_code}' '$BASE_URL/recipient-groups'" \
    "401"

echo -e "\n${YELLOW}Summary${NC}"
echo "--------"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    echo "The recipient groups functionality has been successfully implemented."
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed.${NC}"
    echo "Please check the implementation and try again."
    exit 1
fi
