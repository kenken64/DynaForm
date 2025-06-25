#!/bin/bash

# Debug Generated Images 404 Issue
# This script helps diagnose why generated images are returning 404

echo "🔍 Debugging Generated Images 404 Issue"
echo "========================================"
echo

# Image URL from your error
IMAGE_UUID="7ee36852-b3a7-4293-85d4-2728d527eb48"
IMAGE_FILE="StudentForm_page_1.png"
IMAGE_URL="/conversion/generated_images/$IMAGE_UUID/$IMAGE_FILE"

echo "📋 Image Details:"
echo "   UUID: $IMAGE_UUID"
echo "   File: $IMAGE_FILE"
echo "   URL: $IMAGE_URL"
echo "   Full URL: https://dynaform.xyz$IMAGE_URL"
echo

# Check if Docker is available
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker found"
    
    echo
    echo "🐳 Container Status:"
    docker compose -f docker-compose.ssl.yml ps | grep -E "(nginx|pdf-converter)"
    
    echo
    echo "📁 Checking file system paths..."
    
    # Check nginx container
    echo "1. Nginx container - checking mounted directory:"
    docker compose -f docker-compose.ssl.yml exec dynaform-nginx \
        ls -la /usr/share/nginx/html/ | grep generated_pngs || echo "   ❌ generated_pngs directory not found"
    
    if docker compose -f docker-compose.ssl.yml exec dynaform-nginx \
        test -d /usr/share/nginx/html/generated_pngs; then
        echo "   ✅ generated_pngs directory exists"
        
        echo "2. Checking for specific image UUID directory:"
        docker compose -f docker-compose.ssl.yml exec dynaform-nginx \
            ls -la /usr/share/nginx/html/generated_pngs/ | grep $IMAGE_UUID || echo "   ❌ UUID directory $IMAGE_UUID not found"
        
        if docker compose -f docker-compose.ssl.yml exec dynaform-nginx \
            test -d /usr/share/nginx/html/generated_pngs/$IMAGE_UUID; then
            echo "   ✅ UUID directory exists"
            
            echo "3. Checking for specific image file:"
            docker compose -f docker-compose.ssl.yml exec dynaform-nginx \
                ls -la /usr/share/nginx/html/generated_pngs/$IMAGE_UUID/ | grep $IMAGE_FILE || echo "   ❌ Image file $IMAGE_FILE not found"
            
            if docker compose -f docker-compose.ssl.yml exec dynaform-nginx \
                test -f /usr/share/nginx/html/generated_pngs/$IMAGE_UUID/$IMAGE_FILE; then
                echo "   ✅ Image file exists!"
            else
                echo "   ❌ Image file does not exist"
            fi
        fi
    fi
    
    echo
    echo "📁 PDF Converter container - checking generated files:"
    docker compose -f docker-compose.ssl.yml exec pdf-converter \
        ls -la /app/generated_pngs/ 2>/dev/null | head -10 || echo "   ❌ Cannot access PDF converter generated_pngs"
    
    echo
    echo "📝 Recent nginx access logs:"
    docker compose -f docker-compose.ssl.yml logs --tail=10 dynaform-nginx | grep -E "(generated_images|404|GET)" || echo "   No relevant logs found"
    
    echo
    echo "📝 Recent PDF converter logs:"
    docker compose -f docker-compose.ssl.yml logs --tail=10 pdf-converter | grep -E "(generated_pngs|saved|error)" || echo "   No relevant logs found"
    
else
    echo "❌ Docker not found in PATH"
    echo "Please check manually with Docker Desktop or appropriate Docker commands"
fi

echo
echo "📋 Manual Checks:"
echo "1. Check if image exists on host:"
echo "   ls -la ./pdf-png/generated_pngs/$IMAGE_UUID/"

echo
echo "2. Test nginx configuration:"
echo "   curl -I https://dynaform.xyz$IMAGE_URL"

echo
echo "3. Check nginx container directly:"
echo "   docker exec dynaform-nginx-ssl ls -la /usr/share/nginx/html/generated_pngs/$IMAGE_UUID/"

echo
echo "💡 Common Issues & Solutions:"
echo "✅ Fixed: nginx path updated to /usr/share/nginx/html/generated_pngs/"
echo "🔍 Check: PDF converter successfully saving files"
echo "🔍 Check: Volume mount working between PDF converter and nginx"
echo "🔍 Check: File permissions (should be readable by nginx)"

echo
echo "🚀 Next Steps:"
echo "1. Restart nginx: docker compose restart dynaform-nginx"
echo "2. Try uploading a new PDF to generate fresh images"
echo "3. Check if new images are accessible"
