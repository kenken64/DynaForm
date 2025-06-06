#!/bin/bash

# Real-time Ollama Conversation Interceptor Startup Script
echo "🎧 Starting Real-time Ollama Conversation Interceptor..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration!"
fi

# Check command line arguments
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
        python passive_agent.py
        ;;
    "test")
        if [ -z "$2" ]; then
            echo "❌ Error: Form ID required for test mode"
            echo "Usage: $0 test <form_id>"
            exit 1
        fi
        echo "🧪 Testing form publishing for: $2"
        python passive_agent.py --test-form "$2"
        ;;
    "simulate")
        if [ -z "$2" ]; then
            echo "❌ Error: Conversation text required for simulation mode"
            echo "Usage: $0 simulate 'your conversation text here'"
            exit 1
        fi
        echo "🧪 Simulating conversation: $2"
        python passive_agent.py --simulate "$2"
        ;;
    "test-interception")
        echo "🧪 Testing real-time interception capabilities..."
        python test_real_time_interception.py
        ;;
    "test-workflow"|"complete-test")
        echo "🧪 Testing complete end-to-end workflow..."
        echo "This will test:"
        echo "  ✅ MongoDB connectivity and form retrieval"
        echo "  ✅ Automatic fingerprint generation"
        echo "  ✅ Conversation interception simulation"
        echo "  ✅ Blockchain publishing workflow"
        echo ""
        python test_complete_workflow.py
        ;;
    "help"|"-h"|"--help")
        echo ""
        echo "📋 Available modes:"
        echo "  interceptor       - Start real-time conversation interception (default)"
        echo "  test <form_id>    - Test publishing a specific form"
        echo "  simulate <text>   - Simulate a conversation"  
        echo "  test-interception - Test the interception system"
        echo "  test-workflow     - Test complete end-to-end workflow"
        echo "  help              - Show this help message"
        echo ""
        echo "🔧 Configuration:"
        echo "  - Edit .env file for MongoDB, Ollama, and API settings"
        echo "  - Proxy server runs on port 11435"
        echo "  - Configure clients to use proxy for real-time interception"
        echo ""
        ;;
    *)
        echo "❌ Unknown mode: $MODE"
        echo "Use '$0 help' for available options"
        exit 1
        ;;
esac

echo ""
echo "👋 Real-time interceptor finished"
