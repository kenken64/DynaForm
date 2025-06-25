#!/bin/bash

# Quick restart script for failed DynaForm SSL services
echo "🔄 Restarting failed DynaForm SSL services..."

# Stop all services
echo "🛑 Stopping all services..."
docker compose -f docker-compose.ssl.yml down

# Clean up any orphaned containers
echo "🧹 Cleaning up..."
docker compose -f docker-compose.ssl.yml down --remove-orphans

# Start infrastructure services first (without health check dependencies)
echo "🏗️ Starting infrastructure services..."
docker compose -f docker-compose.ssl.yml up -d mongodb redis ollama-gpu

# Wait for infrastructure
echo "⏳ Waiting for infrastructure services..."
sleep 30

# Start application services
echo "🚀 Starting application services..."
docker compose -f docker-compose.ssl.yml up -d verifiable-contract doc2formjson-api pdf-converter

# Wait for application services
echo "⏳ Waiting for application services..."
sleep 20

# Start AI agent (it will handle its own dependency checks)
echo "🤖 Starting AI Agent..."
docker compose -f docker-compose.ssl.yml up -d ai-agent

# Wait a bit
sleep 10

# Start web services
echo "🌐 Starting web services..."
docker compose -f docker-compose.ssl.yml up -d dynaform-nginx certbot

echo ""
echo "✅ Restart complete!"
echo ""
echo "📊 Current service status:"
docker compose -f docker-compose.ssl.yml ps

echo ""
echo "🔍 Check logs if any service is still failing:"
echo "docker compose -f docker-compose.ssl.yml logs [service-name]"
