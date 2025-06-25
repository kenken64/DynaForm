#!/bin/bash

# Fix WebAuthn RP ID Error
# Error: The RP ID "localhost" is invalid for this domain

echo "🔧 Fixing WebAuthn RP ID Configuration"
echo "======================================="

# Check current domain
if [ -f ".env.ssl" ]; then
    DOMAIN=$(grep "DOMAIN_NAME=" .env.ssl | cut -d'=' -f2)
    echo "✅ Current domain in .env.ssl: $DOMAIN"
else
    echo "❌ .env.ssl not found!"
    exit 1
fi

echo
echo "🎯 The Issue:"
echo "   • Your nginx is configured for: $DOMAIN"
echo "   • But WebAuthn RP_ID is still set to 'localhost'"
echo "   • Need to restart API service to pick up new environment"

echo
echo "🚀 Fixing WebAuthn configuration..."

# Restart the API service to pick up new environment variables
echo "Restarting doc2formjson-api to update WebAuthn config..."

if command -v docker >/dev/null 2>&1; then
    # Stop and start the API service to pick up new environment
    docker compose -f docker-compose.ssl.yml --env-file .env.ssl stop doc2formjson-api
    docker compose -f docker-compose.ssl.yml --env-file .env.ssl up -d doc2formjson-api
    
    echo "✅ API service restarted with new environment"
    echo
    echo "⏳ Waiting for API to be ready..."
    sleep 10
    
    # Check if API is healthy
    echo "🔍 Checking API health..."
    docker compose -f docker-compose.ssl.yml --env-file .env.ssl ps doc2formjson-api
    
    echo
    echo "🎉 WebAuthn should now be configured for: $DOMAIN"
    echo
    echo "📋 WebAuthn Configuration:"
    echo "   • RP_ID: $DOMAIN"
    echo "   • WEBAUTHN_ORIGIN: https://$DOMAIN"
    echo "   • CORS_ORIGIN: https://$DOMAIN"
    
    echo
    echo "✅ Test WebAuthn now:"
    echo "   1. Open: https://$DOMAIN"
    echo "   2. Try passkey registration/authentication"
    echo "   3. Should work without RP ID errors!"
    
else
    echo "⚠️  Docker not found. Please restart manually:"
    echo "   docker compose -f docker-compose.ssl.yml --env-file .env.ssl restart doc2formjson-api"
fi

echo
echo "💡 If you still get RP ID errors:"
echo "   • Make sure you're accessing: https://$DOMAIN (not localhost)"
echo "   • Check browser URL matches the domain exactly"
echo "   • WebAuthn requires exact domain match"
