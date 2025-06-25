#!/bin/bash

# Docker entrypoint for AI Agent Real-time Interceptor
echo "🎧 Starting AI Agent Real-time Ollama Conversation Interceptor..."

# Wait for dependent services to be fully ready
echo "⏳ Waiting for dependent services to be fully ready..."
sleep 20

# Simple connectivity checks with shorter timeouts
echo "🔍 Performing basic connectivity checks..."

# Check MongoDB with simple timeout
echo "⏳ Checking MongoDB..."
python -c "
import pymongo
import sys
try:
    client = pymongo.MongoClient('${MONGODB_URI}', serverSelectionTimeoutMS=10000)
    client.admin.command('ping')
    print('✅ MongoDB is accessible')
except Exception as e:
    print('⚠️ MongoDB check failed, continuing anyway:', str(e))
" || echo "⚠️ MongoDB check failed, continuing anyway"

# Check if we can import required modules
echo "⏳ Checking Python dependencies..."
python -c "
import sys
try:
    import pymongo, requests, ollama
    print('✅ Python dependencies are available')
except ImportError as e:
    print('❌ Missing Python dependency:', str(e))
    sys.exit(1)
"

echo "🚀 All services are ready! Starting AI Agent..."

# Set default mode
MODE=${1:-interceptor}

echo "🚀 Starting Real-time Interceptor in $MODE mode..."

case $MODE in
    "interceptor"|"realtime"|"passive")
        echo "🎧 Starting real-time conversation interception..."
        echo "💡 The agent will intercept ALL Ollama conversations automatically"
        echo "🔧 Proxy server will be available at http://localhost:11435"
        echo "📝 Configure your Ollama clients to use the proxy for interception"
        echo ""
        echo "🎯 Monitoring for publishing keywords: publish, form, blockchain"
        echo "💬 Example: 'I want to publish form abc123'"
        echo ""
        exec python passive_agent.py
        ;;
    "server"|"api")
        echo "🌐 Starting FastAPI server mode..."
        echo "📡 API will be available at http://localhost:8001"
        echo ""
        exec python main.py --mode server
        ;;
    "chat")
        echo "💬 Starting interactive chat mode..."
        exec python main.py --mode chat
        ;;
    "test")
        if [ -z "$2" ]; then
            echo "❌ Error: Form ID required for test mode"
            echo "Usage: docker run ... ai-agent test <form_id>"
            exit 1
        fi
        echo "🧪 Testing form publishing for: $2"
        exec python passive_agent.py --test-form "$2"
        ;;
    "simulate")
        if [ -z "$2" ]; then
            echo "❌ Error: Conversation text required for simulation mode"
            echo "Usage: docker run ... ai-agent simulate 'your conversation text here'"
            exit 1
        fi
        echo "🧪 Simulating conversation: $2"
        exec python passive_agent.py --simulate "$2"
        ;;
    "test-interception")
        echo "🧪 Testing real-time interception capabilities..."
        exec python test_real_time_interception.py
        ;;
    "help"|"-h"|"--help")
        echo ""
        echo "📋 Available modes:"
        echo "  interceptor    - Start real-time conversation interception (default)"
        echo "  server         - Start FastAPI server mode"
        echo "  chat           - Start interactive chat mode"
        echo "  test <form_id> - Test publishing a specific form"
        echo "  simulate <text> - Simulate a conversation"  
        echo "  test-interception - Test the interception system"
        echo "  help           - Show this help message"
        echo ""
        echo "🔧 Configuration:"
        echo "  - Environment variables are set via docker-compose"
        echo "  - Proxy server runs on port 11435"
        echo "  - FastAPI server runs on port 8001"
        echo ""
        ;;
    *)
        echo "❌ Unknown mode: $MODE"
        echo "Use 'docker run ... ai-agent help' for available options"
        exit 1
        ;;
esac
