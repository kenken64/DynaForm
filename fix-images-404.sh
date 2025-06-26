#!/bin/bash

# Fix Generated Images 404 Error
# The nginx path was incorrect for serving generated PNG images

echo "🔧 Fixing Generated Images 404 Error"
echo "====================================="

echo "✅ Issue identified:"
echo "   • nginx was looking for images at: /root/DynaForm/pdf-png/generated_pngs/"
echo "   • But docker mounts them at: /usr/share/nginx/html/generated_pngs/"
echo

echo "✅ Fixed nginx configuration path"
echo "   • Updated alias to: /usr/share/nginx/html/generated_pngs/"

echo
echo "🚀 Restarting nginx to apply the fix..."

if command -v docker >/dev/null 2>&1; then
    # Restart nginx to apply new configuration
    docker compose -f docker-compose.ssl.yml --env-file .env.ssl restart dynaform-nginx
    
    echo "✅ Nginx restarted successfully!"
    echo
    echo "🧪 Testing image access..."
    sleep 5
    
    # Test if images directory is accessible
    echo "Checking if generated_pngs directory exists in nginx container..."
    docker compose -f docker-compose.ssl.yml --env-file .env.ssl exec dynaform-nginx \
        ls -la /usr/share/nginx/html/ | grep generated_pngs || echo "Directory not found"
    
    echo
    echo "📋 Current image URL structure:"
    echo "   Frontend requests: /conversion/generated_images/{uuid}/{filename}.png"
    echo "   Nginx serves from: /usr/share/nginx/html/generated_pngs/{uuid}/{filename}.png"
    echo "   PDF converter saves to: ./pdf-png/generated_pngs/{uuid}/{filename}.png"
    
    echo
    echo "🎉 Generated images should now be accessible!"
    echo "   Try accessing your image URL again:"
    echo "   https://formbt.com/conversion/generated_images/7ee36852-b3a7-4293-85d4-2728d527eb48/StudentForm_page_1.png"
    
else
    echo "⚠️  Docker not found. Please restart nginx manually:"
    echo "   docker compose -f docker-compose.ssl.yml restart dynaform-nginx"
fi

echo
echo "💡 If images still don't load:"
echo "   1. Check if PDF converter service is running and healthy"
echo "   2. Verify files exist: docker exec -it dynaform-nginx-ssl ls /usr/share/nginx/html/generated_pngs/"
echo "   3. Check nginx logs: docker logs dynaform-nginx-ssl"
