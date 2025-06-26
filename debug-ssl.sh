#!/bin/bash

# Debug SSL Certificate Issues
# This script helps diagnose SSL certificate problems

echo "🔍 SSL Certificate Debug Tool"
echo "============================="

# Check if domain argument provided
DOMAIN=${1:-"formbt.com"}
echo "Debugging domain: $DOMAIN"
echo

# Check Docker status
echo "📦 Docker Status:"
if docker ps > /dev/null 2>&1; then
    echo "✅ Docker is running"
    docker --version
else
    echo "❌ Docker is not running or not accessible"
    echo "Please start Docker first"
    exit 1
fi
echo

# Check DNS resolution
echo "🌐 DNS Resolution:"
echo "Checking DNS for $DOMAIN..."
DOMAIN_IP=$(dig +short "$DOMAIN" | tail -n1)
if [ -n "$DOMAIN_IP" ]; then
    echo "✅ Domain resolves to: $DOMAIN_IP"
else
    echo "❌ Domain does not resolve"
    echo "Make sure your domain's A record is configured"
fi
echo

# Check server's public IP
echo "🖥️  Server Public IP:"
PUBLIC_IP=$(curl -s --max-time 10 ifconfig.me 2>/dev/null || echo "Could not determine")
echo "Server IP: $PUBLIC_IP"

if [ "$DOMAIN_IP" = "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "Could not determine" ]; then
    echo "✅ DNS matches server IP"
else
    echo "⚠️  DNS and server IP don't match (this might cause issues)"
fi
echo

# Check port accessibility
echo "🔌 Port Accessibility:"
if command -v nc > /dev/null; then
    echo "Checking if port 80 is accessible..."
    timeout 5 nc -z "$DOMAIN" 80 && echo "✅ Port 80 accessible" || echo "❌ Port 80 not accessible"
    
    echo "Checking if port 443 is accessible..."
    timeout 5 nc -z "$DOMAIN" 443 && echo "✅ Port 443 accessible" || echo "❌ Port 443 not accessible"
else
    echo "⚠️  netcat (nc) not available, skipping port check"
fi
echo

# Check existing certificates
echo "📜 Existing Certificates:"
if docker compose -f docker-compose.ssl.yml run --rm certbot certificates 2>/dev/null; then
    echo "Above are existing certificates"
else
    echo "No existing certificates found or certbot not accessible"
fi
echo

# Check nginx configuration
echo "⚙️  Nginx Configuration:"
if [ -f "dynaform/nginx.ssl.conf" ]; then
    echo "✅ nginx.ssl.conf exists"
    grep -n "server_name\|ssl_certificate" dynaform/nginx.ssl.conf | head -10
else
    echo "❌ nginx.ssl.conf not found"
fi
echo

# Check docker-compose file
echo "🐳 Docker Compose:"
if [ -f "docker-compose.ssl.yml" ]; then
    echo "✅ docker-compose.ssl.yml exists"
    echo "Checking certbot configuration..."
    grep -A 10 -B 2 "certbot:" docker-compose.ssl.yml
else
    echo "❌ docker-compose.ssl.yml not found"
fi
echo

# Check environment file
echo "🔧 Environment Configuration:"
if [ -f ".env.ssl" ]; then
    echo "✅ .env.ssl exists"
    echo "Domain and email configuration:"
    grep "DOMAIN_NAME\|SSL_EMAIL" .env.ssl || echo "Domain/email not configured"
else
    echo "❌ .env.ssl not found"
fi
echo

# Recommendations
echo "💡 Recommendations:"
echo "1. Make sure your domain's A record points to: $PUBLIC_IP"
echo "2. Ensure ports 80 and 443 are open in your firewall"
echo "3. Verify Docker is running and accessible"
echo "4. Check that .env.ssl has correct DOMAIN_NAME and SSL_EMAIL"
echo
echo "🚀 To fix SSL issues:"
echo "   ./setup-ssl.sh $DOMAIN your-email@domain.com"
echo
