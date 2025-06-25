#!/bin/bash

# Fix and Test Generated Images Serving
# Issue: 404 errors when serving generated PNG images

echo "🔧 Fixing Generated Images 404 - Round 2"
echo "========================================="

echo "✅ Issue Analysis:"
echo "   • The nested location block with try_files was problematic"
echo "   • try_files doesn't work well with alias directive in nested locations"
echo "   • Simplified the configuration to remove conflicts"

echo
echo "✅ Changes Made:"
echo "   • Removed problematic try_files directive"
echo "   • Simplified nested location block"
echo "   • Enabled access_log temporarily for debugging"

echo
echo "🚀 Step 1: Test nginx configuration"
if command -v docker >/dev/null 2>&1; then
    echo "Testing nginx configuration..."
    if docker compose -f docker-compose.ssl.yml exec dynaform-nginx nginx -t 2>/dev/null; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration has errors"
        docker compose -f docker-compose.ssl.yml exec dynaform-nginx nginx -t
        exit 1
    fi
else
    echo "⚠️  Docker not found - please test manually"
fi

echo
echo "🚀 Step 2: Restart nginx to apply changes"
if command -v docker >/dev/null 2>&1; then
    echo "Restarting nginx..."
    docker compose -f docker-compose.ssl.yml restart dynaform-nginx
    echo "✅ Nginx restarted"
    
    # Wait for nginx to be ready
    sleep 5
    
    echo "🔍 Checking nginx status..."
    docker compose -f docker-compose.ssl.yml ps dynaform-nginx
else
    echo "⚠️  Please restart nginx manually:"
    echo "   docker compose -f docker-compose.ssl.yml restart dynaform-nginx"
fi

echo
echo "🚀 Step 3: Check if images directory exists"
if command -v docker >/dev/null 2>&1; then
    echo "Checking nginx container file system..."
    
    # Check if the directory exists
    if docker compose -f docker-compose.ssl.yml exec dynaform-nginx test -d /usr/share/nginx/html/generated_pngs; then
        echo "✅ generated_pngs directory exists"
        
        # List contents
        echo "📁 Directory contents:"
        docker compose -f docker-compose.ssl.yml exec dynaform-nginx ls -la /usr/share/nginx/html/generated_pngs/ | head -10
        
        # Check for specific UUID
        UUID="6fdf740a-f008-4a73-bc59-a35248a39f60"
        if docker compose -f docker-compose.ssl.yml exec dynaform-nginx test -d /usr/share/nginx/html/generated_pngs/$UUID; then
            echo "✅ UUID directory $UUID exists"
            
            echo "📁 UUID directory contents:"
            docker compose -f docker-compose.ssl.yml exec dynaform-nginx ls -la /usr/share/nginx/html/generated_pngs/$UUID/
            
            # Test specific file
            if docker compose -f docker-compose.ssl.yml exec dynaform-nginx test -f /usr/share/nginx/html/generated_pngs/$UUID/sampleform_page_1.png; then
                echo "✅ Image file exists!"
                
                # Check file permissions
                echo "📄 File permissions:"
                docker compose -f docker-compose.ssl.yml exec dynaform-nginx ls -la /usr/share/nginx/html/generated_pngs/$UUID/sampleform_page_1.png
            else
                echo "❌ Image file does not exist"
            fi
        else
            echo "❌ UUID directory $UUID does not exist"
        fi
    else
        echo "❌ generated_pngs directory does not exist"
        
        echo "🔍 Checking what's in /usr/share/nginx/html/:"
        docker compose -f docker-compose.ssl.yml exec dynaform-nginx ls -la /usr/share/nginx/html/
    fi
fi

echo
echo "🚀 Step 4: Test image URL"
echo "Testing URL: https://dynaform.xyz/conversion/generated_images/6fdf740a-f008-4a73-bc59-a35248a39f60/sampleform_page_1.png"

if command -v curl >/dev/null 2>&1; then
    echo "Using curl to test..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://dynaform.xyz/conversion/generated_images/6fdf740a-f008-4a73-bc59-a35248a39f60/sampleform_page_1.png")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Image is accessible! (HTTP 200)"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "❌ Still getting 404 error"
        echo "🔍 Check nginx logs for more details"
    else
        echo "⚠️  Got HTTP $HTTP_CODE"
    fi
else
    echo "⚠️  curl not available - test manually in browser"
fi

echo
echo "🔍 Step 5: Check nginx logs"
if command -v docker >/dev/null 2>&1; then
    echo "Recent nginx access logs:"
    docker compose -f docker-compose.ssl.yml logs --tail=20 dynaform-nginx | grep -E "(generated_images|GET|404)" || echo "No relevant logs found"
    
    echo
    echo "Recent nginx error logs:"
    docker compose -f docker-compose.ssl.yml logs --tail=10 dynaform-nginx | grep -i error || echo "No error logs found"
fi

echo
echo "💡 Next Steps if Still 404:"
echo "1. Try uploading a new PDF to generate fresh images"
echo "2. Check volume mount in docker-compose.ssl.yml"
echo "3. Verify PDF converter is working: docker logs \$(docker compose ps -q pdf-converter)"
echo "4. Test a simple file: curl -I https://dynaform.xyz/health"

echo
echo "🎯 Current nginx configuration for images:"
echo "   URL pattern: /conversion/generated_images/*"
echo "   File path: /usr/share/nginx/html/generated_pngs/*"
echo "   Expected file: /usr/share/nginx/html/generated_pngs/6fdf740a-f008-4a73-bc59-a35248a39f60/sampleform_page_1.png"
