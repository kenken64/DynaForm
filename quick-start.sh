#!/bin/bash

# DynaForm Quick Start Script
# This is a convenience script that redirects to the organized scripts directory

echo "🚀 DynaForm Quick Start"
echo "======================="
echo ""
echo "All scripts have been moved to the 'scripts/' directory for better organization."
echo ""
echo "Available commands:"
echo ""
echo "📦 DOCKER SCRIPTS (scripts/docker/):"
echo "  ./scripts/docker/start-dev.sh           - Development mode"
echo "  ./scripts/docker/start-complete.sh      - Complete stack"
echo "  ./scripts/docker/start-secure.sh        - Secure mode"
echo "  ./scripts/docker/start-detached.sh      - Background mode"
echo ""
echo "⚙️  SETUP SCRIPTS (scripts/setup/):"
echo "  ./scripts/setup/setup-mongodb-security.sh    - Setup MongoDB"
echo "  ./scripts/setup/setup-ollama-models.sh       - Setup AI models"
echo "  ./scripts/setup/setup-redis.sh               - Setup Redis"
echo ""
echo "🧪 TEST SCRIPTS (scripts/test/):"
echo "  ./scripts/test/test-mongodb-integration.sh    - Test MongoDB"
echo "  ./scripts/test/test-redis-cache.sh            - Test Redis"
echo "  ./scripts/test/test-*.js                      - Various tests"
echo ""
echo "📚 For full documentation, see: scripts/README.md"
echo ""

# If arguments provided, try to guess what the user wants
if [ $# -gt 0 ]; then
    case "$1" in
        "dev"|"development")
            echo "🔄 Starting development mode..."
            ./scripts/docker/start-dev.sh
            ;;
        "complete"|"full")
            echo "🔄 Starting complete stack..."
            ./scripts/docker/start-complete.sh
            ;;
        "secure")
            echo "🔄 Starting secure mode..."
            ./scripts/docker/start-secure.sh
            ;;
        "setup")
            echo "📖 Setup documentation:"
            echo "  1. Run: ./scripts/setup/setup-mongodb-security.sh"
            echo "  2. Run: ./scripts/setup/setup-ollama-models.sh"
            echo "  3. Run: ./scripts/setup/setup-redis.sh"
            ;;
        "help"|"--help"|"-h")
            echo "Usage: $0 [dev|complete|secure|setup|help]"
            ;;
        *)
            echo "❌ Unknown command: $1"
            echo "💡 Try: $0 help"
            ;;
    esac
else
    echo "💡 Quick start: $0 dev"
    echo "💡 Full help:   $0 help"
fi
