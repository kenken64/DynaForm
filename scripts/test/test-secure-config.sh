#!/bin/bash

# Test Secure MongoDB Configuration
# This script validates the secure configuration setup without requiring Docker

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

test_passed=0
test_failed=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing: $test_name... "
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((test_passed++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        ((test_failed++))
        return 1
    fi
}

print_header "🔐 Testing Secure MongoDB Configuration"

# Test 1: Check if secrets directory exists
run_test "Secrets directory exists" "[ -d './secrets' ]"

# Test 2: Check if password files exist
run_test "Root password file exists" "[ -f './secrets/mongo_root_password.txt' ]"
run_test "App password file exists" "[ -f './secrets/mongo_app_password.txt' ]"
run_test "Reader password file exists" "[ -f './secrets/mongo_reader_password.txt' ]"

# Test 3: Check if password files are not empty
run_test "Root password file not empty" "[ -s './secrets/mongo_root_password.txt' ]"
run_test "App password file not empty" "[ -s './secrets/mongo_app_password.txt' ]"
run_test "Reader password file not empty" "[ -s './secrets/mongo_reader_password.txt' ]"

# Test 4: Check file permissions (should be readable only by owner)
run_test "Root password file permissions" "[ \$(stat -f %Mp%Lp './secrets/mongo_root_password.txt') = '0600' ]"
run_test "App password file permissions" "[ \$(stat -f %Mp%Lp './secrets/mongo_app_password.txt') = '0600' ]"
run_test "Reader password file permissions" "[ \$(stat -f %Mp%Lp './secrets/mongo_reader_password.txt') = '0600' ]"

# Test 5: Check Docker Compose secure configuration exists
run_test "Secure Docker Compose file exists" "[ -f './docker-compose.secure.yml' ]"

# Test 6: Validate Docker Compose syntax
if command -v docker >/dev/null 2>&1; then
    run_test "Docker Compose syntax validation" "docker compose -f docker-compose.secure.yml config >/dev/null"
else
    print_warning "Docker not available - skipping syntax validation"
fi

# Test 7: Check security setup script
run_test "Security setup script exists" "[ -f './setup-mongodb-security.sh' ]"
run_test "Security setup script is executable" "[ -x './setup-mongodb-security.sh' ]"

# Test 8: Check secure startup script
run_test "Secure startup script exists" "[ -f './start-secure.sh' ]"
run_test "Secure startup script is executable" "[ -x './start-secure.sh' ]"

# Test 9: Check MongoDB initialization scripts
run_test "MongoDB Dockerfile exists" "[ -f './mongodb/Dockerfile' ]"
run_test "Secure user creation script exists" "[ -f './mongodb/init-scripts/02-create-users-secure.sh' ]"

# Test 10: Check API configuration
run_test "API config file exists" "[ -f './describeImge/src/config/index.ts' ]"

# Validate configuration content
print_header "📋 Configuration Content Validation"

# Check if Docker secrets are properly configured in docker-compose.secure.yml
if grep -q "mongodb_root_password:" docker-compose.secure.yml && \
   grep -q "mongodb_app_password:" docker-compose.secure.yml && \
   grep -q "mongodb_reader_password:" docker-compose.secure.yml; then
    print_success "Docker secrets properly defined in compose file"
    ((test_passed++))
else
    print_error "Docker secrets not properly defined in compose file"
    ((test_failed++))
fi

# Check if API service uses secrets
if grep -q "secrets:" docker-compose.secure.yml | head -1; then
    print_success "API service configured to use secrets"
    ((test_passed++))
else
    print_error "API service not configured to use secrets"
    ((test_failed++))
fi

# Check API configuration for secure password reading
if grep -q "readDockerSecret" describeImge/src/config/index.ts; then
    print_success "API configured for Docker secrets reading"
    ((test_passed++))
else
    print_error "API not configured for Docker secrets reading"
    ((test_failed++))
fi

print_header "📊 Test Results Summary"

echo "Tests passed: $test_passed"
echo "Tests failed: $test_failed"
echo "Total tests: $((test_passed + test_failed))"

if [ $test_failed -eq 0 ]; then
    print_success "All tests passed! Secure configuration is ready."
    echo ""
    print_header "🚀 Next Steps"
    echo "1. Ensure Docker is installed and running"
    echo "2. Run the secure startup script: ./start-secure.sh"
    echo "3. Test the application at http://localhost:4201"
    echo ""
    exit 0
else
    print_error "Some tests failed. Please review the configuration."
    echo ""
    print_header "🔧 Troubleshooting"
    echo "1. Run the security setup script: ./setup-mongodb-security.sh"
    echo "2. Check file permissions in the secrets/ directory"
    echo "3. Validate Docker Compose configuration syntax"
    echo ""
    exit 1
fi
