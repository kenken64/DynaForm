#!/bin/bash

echo "🔧 Quick Image Serving Fix"
echo "========================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker command not found. Please ensure Docker is installed and running."
    exit 1
fi

echo "🔧 Step 1: Ensuring host directory has correct permissions..."
chmod 777 ./pdf-png/generated_pngs/
echo "✅ Set generated_pngs directory to 777 permissions"

echo "🔧 Step 2: Recreating PDF converter and nginx services..."
docker compose -f docker-compose.ssl.yml stop pdf-converter nginx
docker compose -f docker-compose.ssl.yml rm -f pdf-converter nginx
docker compose -f docker-compose.ssl.yml up -d pdf-converter nginx

echo "⏳ Waiting for nginx to start..."
sleep 5

echo "🔧 Step 3: Reloading nginx configuration..."
docker compose -f docker-compose.ssl.yml exec nginx nginx -s reload

echo "🔧 Step 4: Testing configuration..."
docker compose -f docker-compose.ssl.yml exec nginx nginx -t

echo "✅ Quick fix complete!"

# Test with an existing image
UUID_DIR=$(ls ./pdf-png/generated_pngs/ | head -1)
if [ -n "$UUID_DIR" ]; then
    IMAGE_FILE=$(ls ./pdf-png/generated_pngs/$UUID_DIR/ | head -1)
    if [ -n "$IMAGE_FILE" ]; then
        echo
        echo "🧪 Test this URL:"
        echo "https://dynaform.xyz/conversion/generated_images/$UUID_DIR/$IMAGE_FILE"
    fi
fi
