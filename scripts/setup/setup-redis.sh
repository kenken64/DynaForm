#!/bin/bash

# Redis Setup Script for doc2formjson Project
# Installs and configures Redis for caching OCR form data

echo "🚀 Redis Setup for doc2formjson Project"
echo "======================================"

# Detect operating system
OS=$(uname -s)
echo "Detected OS: $OS"

# Function to install Redis on macOS
install_redis_macos() {
    echo "📦 Installing Redis on macOS..."
    
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    # Install Redis
    brew install redis
    
    # Start Redis service
    brew services start redis
    
    echo "✅ Redis installed and started via Homebrew"
}

# Function to install Redis via Docker
install_redis_docker() {
    echo "🐳 Setting up Redis via Docker..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Stop any existing Redis container
    docker stop redis 2>/dev/null || true
    docker rm redis 2>/dev/null || true
    
    # Run Redis container
    docker run -d \
        --name redis \
        --restart unless-stopped \
        -p 6379:6379 \
        redis:latest
    
    echo "✅ Redis container started"
}

# Function to test Redis connection
test_redis_connection() {
    echo ""
    echo "🧪 Testing Redis connection..."
    
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is running and accessible"
        
        # Get Redis version
        REDIS_VERSION=$(redis-cli --version)
        echo "Redis version: $REDIS_VERSION"
        
        # Test basic operations
        redis-cli set test_key "Hello Redis!" > /dev/null
        TEST_VALUE=$(redis-cli get test_key)
        redis-cli del test_key > /dev/null
        
        if [ "$TEST_VALUE" = "Hello Redis!" ]; then
            echo "✅ Redis read/write operations working"
        else
            echo "⚠️ Redis read/write test failed"
        fi
    else
        echo "❌ Redis connection failed"
        return 1
    fi
}

# Function to setup environment configuration
setup_environment() {
    echo ""
    echo "⚙️ Setting up environment configuration..."
    
    ENV_FILE="./server/.env"
    ENV_EXAMPLE="./server/.env.example"
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            echo "📝 Creating .env file from .env.example..."
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            echo "✅ .env file created"
        else
            echo "⚠️ No .env.example found, creating basic .env file..."
            cat > "$ENV_FILE" << EOF
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Add other environment variables as needed
PORT=3000
NODE_ENV=development
EOF
            echo "✅ Basic .env file created"
        fi
    else
        echo "✅ .env file already exists"
        
        # Check if Redis configuration exists
        if ! grep -q "REDIS_HOST" "$ENV_FILE"; then
            echo "📝 Adding Redis configuration to .env file..."
            cat >> "$ENV_FILE" << EOF

# Redis Configuration (added by setup script)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
EOF
            echo "✅ Redis configuration added to .env file"
        else
            echo "✅ Redis configuration already exists in .env file"
        fi
    fi
}

# Function to install dependencies
install_dependencies() {
    echo ""
    echo "📦 Installing Redis dependencies..."
    
    if [ -f "./server/package.json" ]; then
        cd ./server
        
        # Check if ioredis is already installed
        if npm list ioredis > /dev/null 2>&1; then
            echo "✅ ioredis already installed"
        else
            echo "📦 Installing ioredis..."
            npm install ioredis
            echo "✅ ioredis installed"
        fi
        
        cd ..
    else
        echo "⚠️ server/package.json not found, skipping dependency installation"
    fi
}

# Function to show setup summary
show_summary() {
    echo ""
    echo "🎉 Redis Setup Complete!"
    echo "======================="
    echo ""
    echo "✅ Redis is installed and running"
    echo "✅ Environment configured"
    echo "✅ Dependencies installed"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Start your server: cd server && npm run dev"
    echo "2. Test the caching: ./test-redis-cache.sh"
    echo "3. Monitor cache stats: curl http://localhost:3000/api/cache/stats"
    echo ""
    echo "📖 Documentation: REDIS_CACHE_IMPLEMENTATION_COMPLETE.md"
    echo ""
    echo "🛠️ Redis Management Commands:"
    echo "   View logs: redis-cli monitor"
    echo "   Check stats: redis-cli info stats"
    echo "   Clear all data: redis-cli flushall"
    
    if command -v docker &> /dev/null && docker ps | grep -q redis; then
        echo "   Stop Docker Redis: docker stop redis"
        echo "   Start Docker Redis: docker start redis"
    fi
    
    if [[ "$OS" == "Darwin" ]] && command -v brew &> /dev/null; then
        echo "   Stop macOS Redis: brew services stop redis"
        echo "   Start macOS Redis: brew services start redis"
    fi
}

# Main installation process
main() {
    echo ""
    echo "Choose Redis installation method:"
    echo "1) macOS (Homebrew) - Recommended for development"
    echo "2) Docker - Cross-platform, isolated"
    echo "3) Skip installation (Redis already installed)"
    echo ""
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            if [[ "$OS" == "Darwin" ]]; then
                install_redis_macos
            else
                echo "❌ macOS installation selected but not running on macOS"
                echo "Please choose Docker installation instead"
                exit 1
            fi
            ;;
        2)
            install_redis_docker
            ;;
        3)
            echo "⏭️ Skipping Redis installation"
            ;;
        *)
            echo "❌ Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    # Test connection
    test_redis_connection
    
    if [ $? -eq 0 ]; then
        # Setup environment and dependencies
        setup_environment
        install_dependencies
        show_summary
    else
        echo ""
        echo "❌ Redis setup failed. Please check the installation and try again."
        exit 1
    fi
}

# Run main function
main
