#!/bin/bash

# Deploy DynaForm with SSL, AI Agent, and Verifiable Contract services
set -e

echo "🚀 Starting DynaForm SSL deployment with AI Agent and Verifiable Contract..."

# Check if required environment variables are set
if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Error: DOMAIN_NAME environment variable is required"
    echo "Example: export DOMAIN_NAME=yourdomain.com"
    exit 1
fi

if [ -z "$SSL_EMAIL" ]; then
    echo "❌ Error: SSL_EMAIL environment variable is required"
    echo "Example: export SSL_EMAIL=admin@yourdomain.com"
    exit 1
fi

# Set build timestamp
export BUILD_TIMESTAMP=$(date +%s)

echo "📋 Configuration:"
echo "  Domain: $DOMAIN_NAME"
echo "  SSL Email: $SSL_EMAIL"
echo "  Build Timestamp: $BUILD_TIMESTAMP"

# Create required directories
echo "📁 Creating required directories..."
mkdir -p ./dynaform/generated_pngs
mkdir -p ./mongodb/logs
mkdir -p ./ai-agent/logs

# Stop existing services
echo "🛑 Stopping existing services..."
docker compose -f docker-compose.ssl.yml down --volumes --remove-orphans || true

# Build and start services
echo "🔨 Building and starting services..."
docker compose -f docker-compose.ssl.yml build --parallel

# Start infrastructure services first
echo "🏗️ Starting infrastructure services..."
docker compose -f docker-compose.ssl.yml up -d mongodb redis ollama-gpu

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 30

# Start application services
echo "🚀 Starting application services..."
docker compose -f docker-compose.ssl.yml up -d verifiable-contract ai-agent doc2formjson-api pdf-converter

# Wait for application services
echo "⏳ Waiting for application services to be ready..."
sleep 20

# Start nginx and certbot
echo "🌐 Starting web services..."
docker compose -f docker-compose.ssl.yml up -d dynaform-nginx certbot

echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.ssl.yml ps

echo ""
echo "🔍 Available Services:"
if [ "$DOMAIN_NAME" != "localhost" ]; then
    echo "  • Frontend: https://$DOMAIN_NAME (after SSL setup)"
    echo "  • API: https://$DOMAIN_NAME/api (after SSL setup)"
else
    echo "  • Frontend: https://localhost (self-signed certificates)"
    echo "  • API: https://localhost/api (self-signed certificates)"
fi
echo "  • AI Agent: http://localhost:8001"
echo "  • Verifiable Contract: http://localhost:3002"
echo "  • PDF Converter: http://localhost:5001"
echo ""

if [ "$DOMAIN_NAME" != "localhost" ]; then
    echo "� SSL Certificate Setup Required:"
    echo "1. Obtain SSL certificates:"
    echo "   docker compose -f docker-compose.ssl.yml run --rm certbot certonly \\"
    echo "     --webroot --webroot-path=/var/www/certbot \\"
    echo "     --email $SSL_EMAIL --agree-tos --no-eff-email -d $DOMAIN_NAME"
    echo ""
    echo "2. Restart nginx to use SSL certificates:"
    echo "   docker compose -f docker-compose.ssl.yml restart dynaform-nginx"
    echo ""
    echo "⚠️  Note: Make sure your domain $DOMAIN_NAME points to this server"
    echo "   and ports 80/443 are accessible before obtaining certificates."
else
    echo "� Using self-signed certificates for localhost development."
fi

echo ""
echo "�📊 Monitor logs with:"
echo "docker compose -f docker-compose.ssl.yml logs -f [service-name]"

echo ""
echo "🔧 Troubleshooting:"
echo "  • Check nginx logs: docker compose -f docker-compose.ssl.yml logs dynaform-nginx"
echo "  • Verify services: docker compose -f docker-compose.ssl.yml ps"
echo "  • Test health endpoints: curl -k https://localhost/health"
