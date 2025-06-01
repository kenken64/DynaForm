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

# Setup Ollama models
echo ""
echo -e "\\033[32mSetting up Ollama models...\\033[0m"

# Wait for Ollama to be ready
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "\\033[33mChecking Ollama (attempt $RETRY_COUNT/$MAX_RETRIES)...\\033[0m"

    if curl -s -f http://localhost:11434/api/tags >/dev/null 2>&1; then
        OLLAMA_READY=true
        break
    fi
    sleep 2
done

if [ "$OLLAMA_READY" = true ]; then
    echo -e "\\033[32mOllama service is ready!\\033[0m"

    # Check and pull model if needed
    MODELS_RESPONSE=$(curl -s http://localhost:11434/api/tags)
    if echo "$MODELS_RESPONSE" | grep -q "qwen2.5vl:latest"; then
        echo -e "\\033[32mqwen2.5vl:latest model is already available!\\033[0m"
    else
        echo -e "\\033[33mPulling qwen2.5vl:latest model (this may take a few minutes)...\\033[0m"
        docker compose exec -T ollama-gpu ollama pull qwen2.5vl:latest

        if [ $? -eq 0 ]; then
            echo -e "\\033[32mModel pulled successfully!\\033[0m"
        else
            echo -e "\\033[31mModel pull failed. You may need to pull it manually.\\033[0m"
        fi
    fi

    # Load model into memory
    echo -e "\\033[33mLoading model into memory...\\033[0m"
    TEST_REQUEST='{"model":"qwen2.5vl:latest","prompt":"Hello","stream":false}'

    if curl -s -X POST -H "Content-Type: application/json" -d "$TEST_REQUEST" http://localhost:11434/api/generate >/dev/null 2>&1; then
        echo -e "\\033[32mModel is loaded and ready!\\033[0m"
    else
        echo -e "\\033[33mModel not responding. Check logs: docker compose logs ollama-gpu\\033[0m"
    fi
else
    echo -e "\\033[31mOllama service not ready after $MAX_RETRIES attempts\\033[0m"
    echo -e "\\033[36mCheck logs: docker compose logs ollama-gpu\\033[0m"
fi

echo ""
print_header "📋 Connection Information"
echo "🌐 Frontend: http://localhost:4201"
echo "🔌 API: http://localhost:3000"
echo "🗄️  MongoDB: mongodb://localhost:27018"
echo ""
echo "🔐 MongoDB credentials are managed securely via Docker secrets"
echo "📁 Secrets directory: ./secrets/"
echo ""
print_warning "Remember: Never commit the secrets/ directory to version control!"
