#!/bin/bash

echo "🧪 DynaForm Image Serving Diagnostic Test"
echo "=========================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker command not found. Please ensure Docker is installed and running."
    exit 1
fi

echo "🔍 Step 1: Checking service health..."
docker compose -f docker-compose.ssl.yml ps pdf-converter nginx

echo
echo "🔍 Step 2: Checking volume mounts..."
echo "Host directory contents:"
ls -la ./pdf-png/generated_pngs/ | head -5

echo
echo "Container mount point:"
docker compose -f docker-compose.ssl.yml exec nginx ls -la /usr/share/nginx/html/generated_pngs/ | head -5

echo
echo "🔍 Step 3: Testing nginx configuration..."
docker compose -f docker-compose.ssl.yml exec nginx nginx -t

echo
echo "🔍 Step 4: Checking specific UUID directory..."
UUID_DIR=$(ls ./pdf-png/generated_pngs/ | head -1)
if [ -n "$UUID_DIR" ]; then
    echo "Testing with UUID: $UUID_DIR"
    echo "Host files:"
    ls -la ./pdf-png/generated_pngs/$UUID_DIR/
    echo
    echo "Container files:"
    docker compose -f docker-compose.ssl.yml exec nginx ls -la /usr/share/nginx/html/generated_pngs/$UUID_DIR/
    
    IMAGE_FILE=$(ls ./pdf-png/generated_pngs/$UUID_DIR/ | head -1)
    if [ -n "$IMAGE_FILE" ]; then
        echo
        echo "🔍 Step 5: Testing direct file access in container..."
        echo "Testing file: /usr/share/nginx/html/generated_pngs/$UUID_DIR/$IMAGE_FILE"
        docker compose -f docker-compose.ssl.yml exec nginx test -f "/usr/share/nginx/html/generated_pngs/$UUID_DIR/$IMAGE_FILE" && echo "✅ File exists in container" || echo "❌ File NOT found in container"
        
        echo
        echo "🌐 URL to test in browser:"
        echo "https://dynaform.xyz/conversion/generated_images/$UUID_DIR/$IMAGE_FILE"
        
        echo
        echo "🔍 Step 6: Testing curl from container..."
        docker compose -f docker-compose.ssl.yml exec nginx curl -I "http://localhost/conversion/generated_images/$UUID_DIR/$IMAGE_FILE" 2>/dev/null || echo "❌ Curl test failed"
    fi
fi

echo
echo "🔍 Step 7: Checking recent nginx logs..."
echo "Access logs:"
docker compose -f docker-compose.ssl.yml logs nginx | grep -E "generated_images" | tail -5

echo
echo "Error logs:"
docker compose -f docker-compose.ssl.yml logs nginx | grep -i "error" | tail -3

echo
echo "🔍 Step 8: Checking PDF converter logs..."
docker compose -f docker-compose.ssl.yml logs pdf-converter | grep -E "(png|image|generated)" | tail -5

echo
echo "📋 Diagnostic complete!"
