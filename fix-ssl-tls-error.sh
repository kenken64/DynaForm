#!/bin/bash

# Fix OpenSSL TLS Error - Quick Diagnosis and Fix
# This script diagnoses and fixes the SSL TLS internal error

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 SSL TLS Error Diagnosis and Fix${NC}"
echo "=================================="

# Check if containers are running
echo -e "${BLUE}📦 Container Status:${NC}"
docker compose -f docker-compose.ssl.yml ps
echo

# Check nginx logs for errors
echo -e "${BLUE}📋 Nginx Error Logs:${NC}"
echo "Checking nginx logs for SSL errors..."
docker compose -f docker-compose.ssl.yml logs dynaform-nginx | tail -20
echo

# Check if SSL certificates exist
echo -e "${BLUE}🔒 SSL Certificate Status:${NC}"
if docker compose -f docker-compose.ssl.yml run --rm certbot certificates 2>/dev/null; then
    echo -e "${GREEN}✅ Certificates found${NC}"
else
    echo -e "${RED}❌ No certificates found${NC}"
fi
echo

# Check nginx configuration
echo -e "${BLUE}⚙️  Nginx Configuration Test:${NC}"
if docker compose -f docker-compose.ssl.yml exec dynaform-nginx nginx -t 2>/dev/null; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    echo "Showing nginx config errors:"
    docker compose -f docker-compose.ssl.yml exec dynaform-nginx nginx -t
fi
echo

# Quick fixes based on diagnosis
echo -e "${BLUE}🚀 Quick Fixes:${NC}"

# Fix 1: Check if we're using localhost or real domain
if [ -f ".env.ssl" ]; then
    DOMAIN=$(grep "DOMAIN_NAME=" .env.ssl | cut -d'=' -f2)
    echo "Domain configured: $DOMAIN"
    
    if [ "$DOMAIN" = "localhost" ]; then
        echo -e "${YELLOW}💡 Quick Fix for localhost:${NC}"
        echo "1. Stop current services:"
        echo "   docker compose -f docker-compose.ssl.yml down"
        echo
        echo "2. Use HTTP instead of HTTPS for localhost:"
        echo "   Access: http://localhost"
        echo
        echo "3. Or accept self-signed certificate:"
        echo "   Access: https://localhost (click 'Advanced' -> 'Proceed')"
        echo
    else
        echo -e "${YELLOW}💡 Quick Fix for domain '$DOMAIN':${NC}"
        echo "1. Check if certificate exists:"
        echo "   ./force-renew-ssl.sh list"
        echo
        echo "2. Create/renew certificate:"
        echo "   ./force-renew-ssl.sh recreate"
        echo
        echo "3. Or use staging for testing:"
        echo "   ./force-renew-ssl.sh staging"
        echo
    fi
else
    echo -e "${RED}❌ .env.ssl file not found${NC}"
    echo "Run: ./setup-ssl.sh localhost"
fi

echo -e "${BLUE}🔄 Immediate Actions:${NC}"
echo
echo "Choose one option:"
echo
echo -e "${GREEN}Option 1: Use localhost (fastest)${NC}"
echo "docker compose -f docker-compose.ssl.yml down"
echo "./setup-ssl.sh localhost"
echo "Access: http://localhost"
echo
echo -e "${GREEN}Option 2: Fix SSL certificates${NC}"
echo "./force-renew-ssl.sh recreate"
echo "docker compose -f docker-compose.ssl.yml restart dynaform-nginx"
echo
echo -e "${GREEN}Option 3: Use HTTP only (temporary)${NC}"
echo "Access: http://formbt.com (if port 80 is working)"
echo
echo -e "${GREEN}Option 4: Debug mode${NC}"
echo "./debug-ssl.sh formbt.com"
echo

# Check specific nginx SSL errors
echo -e "${BLUE}🔍 Detailed SSL Error Check:${NC}"
docker compose -f docker-compose.ssl.yml exec dynaform-nginx ls -la /etc/letsencrypt/live/ 2>/dev/null || {
    echo -e "${RED}❌ SSL certificate directory not found${NC}"
    echo "This confirms certificates are missing"
}

echo
echo -e "${YELLOW}⚡ Recommended Quick Fix:${NC}"
echo -e "${GREEN}./force-renew-ssl.sh recreate${NC}"
echo "This will delete and recreate certificates properly"
