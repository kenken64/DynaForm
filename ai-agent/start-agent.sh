#!/bin/bash

# Start the AI Agent
# Make sure to set up the environment first

echo "🤖 Starting Form Publishing AI Agent..."

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

# Check if we should run in server or chat mode
MODE=${1:-server}

echo "🚀 Starting AI Agent in $MODE mode..."

if [ "$MODE" = "chat" ]; then
    python main.py --mode chat
else
    python main.py --mode server --host 0.0.0.0 --port 8001
fi
