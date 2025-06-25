#!/bin/bash

echo "=== DynaForm Image Serving Debug Script ==="
echo "Timestamp: $(date)"
echo

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker command not found. Please ensure Docker is installed and running."
    exit 1
fi

# Check services status
echo "🔍 Checking service status..."
docker compose -f docker-compose.ssl.yml ps

echo
echo "🔍 Checking nginx container status..."
NGINX_CONTAINER=$(docker compose -f docker-compose.ssl.yml ps -q nginx)
if [ -z "$NGINX_CONTAINER" ]; then
    echo "❌ nginx container not found or not running"
    exit 1
fi

echo "✅ nginx container found: $NGINX_CONTAINER"

echo
echo "🔍 Checking nginx configuration..."
docker compose -f docker-compose.ssl.yml exec nginx nginx -t

echo
echo "🔍 Checking volume mounts in nginx container..."
docker compose -f docker-compose.ssl.yml exec nginx ls -la /usr/share/nginx/html/

echo
echo "🔍 Checking generated_pngs directory..."
docker compose -f docker-compose.ssl.yml exec nginx ls -la /usr/share/nginx/html/generated_pngs/ 2>/dev/null || echo "Directory does not exist"

echo
echo "🔍 Looking for any UUID directories..."
docker compose -f docker-compose.ssl.yml exec nginx find /usr/share/nginx/html/generated_pngs -type d -name "*-*-*-*-*" 2>/dev/null | head -5

echo
echo "🔍 Checking recent nginx access logs..."
docker compose -f docker-compose.ssl.yml logs nginx | grep -E "(generated_images|conversion)" | tail -10

echo
echo "🔍 Checking recent nginx error logs..."
docker compose -f docker-compose.ssl.yml logs nginx | grep -i error | tail -5

echo
echo "🔍 Checking PDF converter logs for image generation..."
docker compose -f docker-compose.ssl.yml logs pdf-converter | grep -E "(png|image|generated)" | tail -10

echo
echo "🔍 Testing nginx configuration inside container..."
docker compose -f docker-compose.ssl.yml exec nginx cat /etc/nginx/nginx.conf | grep -A 10 -B 5 "generated_images"

echo
echo "🔍 Checking if volume mount is working..."
docker compose -f docker-compose.ssl.yml exec pdf-converter ls -la /app/generated_pngs/ 2>/dev/null || echo "PDF converter generated_pngs directory not found"

echo
echo "=== Debug complete ==="
