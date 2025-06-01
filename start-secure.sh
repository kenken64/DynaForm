#!/bin/bash

# Start Doc2FormJSON with Secure MongoDB Configuration
# This script uses Docker Secrets for secure password management

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

print_header "🔐 Starting Doc2FormJSON with Secure MongoDB"

# Check if secrets exist
if [ ! -d "./secrets" ] || [ ! -f "./secrets/mongo_root_password.txt" ]; then
    print_error "MongoDB secrets not found!"
    echo ""
    echo "Please run the security setup script first:"
    echo "  ./setup-mongodb-security.sh"
    echo ""
    exit 1
fi

print_success "MongoDB secrets found"

# Build timestamp for cache busting
export BUILD_TIMESTAMP=$(date +%s)
print_success "Build timestamp: $BUILD_TIMESTAMP"

# Start with secure configuration
print_header "🚀 Starting Services with Docker Secrets"

echo "Starting services with secure configuration..."
docker compose -f docker-compose.secure.yml up --build

print_success "All services started successfully with secure MongoDB!"

echo ""
print_header "📋 Connection Information"
echo "🌐 Frontend: http://localhost:4201"
echo "🔌 API: http://localhost:3000"
echo "🗄️  MongoDB: mongodb://localhost:27017"
echo ""
echo "🔐 MongoDB credentials are managed securely via Docker secrets"
echo "📁 Secrets directory: ./secrets/"
echo ""
print_warning "Remember: Never commit the secrets/ directory to version control!"
