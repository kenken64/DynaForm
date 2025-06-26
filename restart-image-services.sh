#!/bin/bash

echo "🔄 Restarting DynaForm services to fix image serving..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker command not found. Please ensure Docker is installed and running."
    exit 1
fi

# Stop and restart the affected services
echo "🛑 Stopping pdf-converter and nginx services..."
docker compose -f docker-compose.ssl.yml stop pdf-converter nginx

echo "🧹 Removing containers to ensure clean restart..."
docker compose -f docker-compose.ssl.yml rm -f pdf-converter nginx

echo "🚀 Starting services with updated volume mounts..."
docker compose -f docker-compose.ssl.yml up -d pdf-converter nginx

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "🔍 Checking service status..."
docker compose -f docker-compose.ssl.yml ps pdf-converter nginx

echo "✅ Services restarted. Testing image serving..."

# Test a known image path
UUID_DIR=$(ls ./pdf-png/generated_pngs/ | head -1)
if [ -n "$UUID_DIR" ]; then
    IMAGE_FILE=$(ls ./pdf-png/generated_pngs/$UUID_DIR/ | head -1)
    if [ -n "$IMAGE_FILE" ]; then
        echo "📋 Testing image: /conversion/generated_images/$UUID_DIR/$IMAGE_FILE"
        echo "🌐 Try accessing: https://formbt.com/conversion/generated_images/$UUID_DIR/$IMAGE_FILE"
    fi
fi

echo "🏁 Restart complete!"
