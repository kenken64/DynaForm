#!/bin/bash

echo "🔧 Fixing PDF Converter Permissions Issue"
echo "========================================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker command not found. Please ensure Docker is installed and running."
    exit 1
fi

echo "🔧 Step 1: Setting host directory permissions..."
chmod 777 ./pdf-png/generated_pngs/
echo "✅ Host directory permissions set to 777"

echo "🔧 Step 2: Stopping PDF converter service..."
docker compose -f docker-compose.ssl.yml stop pdf-converter

echo "🔧 Step 3: Removing old PDF converter container..."
docker compose -f docker-compose.ssl.yml rm -f pdf-converter

echo "🔧 Step 4: Rebuilding PDF converter with updated Dockerfile..."
docker compose -f docker-compose.ssl.yml build --no-cache pdf-converter

echo "🔧 Step 5: Starting PDF converter with new permissions handling..."
docker compose -f docker-compose.ssl.yml up -d pdf-converter

echo "⏳ Waiting for PDF converter to start..."
sleep 10

echo "🔧 Step 6: Checking PDF converter status..."
docker compose -f docker-compose.ssl.yml ps pdf-converter

echo "🔧 Step 7: Checking PDF converter logs..."
docker compose -f docker-compose.ssl.yml logs pdf-converter | tail -10

echo "✅ PDF converter permissions fix complete!"

echo ""
echo "🧪 Now try uploading a PDF to test image generation."
echo "The permission error should be resolved."
