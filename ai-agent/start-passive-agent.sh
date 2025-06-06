#!/bin/bash

# Start the Passive AI Agent
echo "🎧 Starting Passive Form Publishing AI Agent..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration!"
fi

# Check command line arguments
MODE=${1:-monitor}

echo "🚀 Starting Passive AI Agent in $MODE mode..."

case $MODE in
    "monitor"|"passive")
        echo "🎧 Starting passive monitoring mode..."
        echo "💡 The agent will automatically detect and process form publishing requests"
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
    "help"|"-h"|"--help")
        echo "🤖 Passive Form Publishing AI Agent"
        echo ""
        echo "Usage:"
        echo "  $0 [monitor|passive]           # Start passive monitoring (default)"
        echo "  $0 test <form_id>              # Test publishing a specific form"
        echo "  $0 simulate 'conversation'     # Simulate a conversation"
        echo "  $0 help                        # Show this help"
        echo ""
        echo "Examples:"
        echo "  $0                             # Start monitoring"
        echo "  $0 test abc123                 # Test form abc123"
        echo "  $0 simulate 'publish form xyz' # Test conversation"
        ;;
    *)
        echo "❌ Unknown mode: $MODE"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
