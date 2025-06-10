#!/bin/bash

# macOS Docker Compose startup script
# This script removes GPU dependencies that are not supported on macOS

echo "🍎 Starting Doc2FormJSON on macOS (CPU mode)..."
echo "Note: GPU acceleration is not available on macOS, running in CPU mode."

# Set build timestamp for cache busting
export BUILD_TIMESTAMP=$(date +%s)

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start services
echo "Building and starting services..."
docker-compose up --build -d

# Show status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Application URLs:"
echo "  • Frontend (Angular):     http://localhost:4201"
echo "  • API (Node.js):          http://localhost:3000"
echo "  • PDF Converter (Flask):  http://localhost:5001"
echo "  • Ollama (LLM):           http://localhost:11434"

echo ""
echo "📝 To view logs: docker-compose logs -f [service-name]"
echo "📝 To stop all services: docker-compose down"
echo ""
echo "⏳ Services are starting up... This may take a few minutes on first run."
echo "⏳ Ollama will download the qwen2.5vl model on first startup (~4GB)."
