#!/bin/bash
# Simple health check script that doesn't require curl/wget
# This creates a ready file when Ollama is responding

set -e

echo "Starting Ollama server..."

# Start Ollama in the background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready - simplified approach
echo "Waiting for Ollama server to be ready..."
for i in {1..30}; do
    if (echo > /dev/tcp/localhost/11434) 2>/dev/null; then
        echo "Port 11434 is open, giving Ollama a moment to initialize..."
        sleep 3
        echo "Ollama is ready!"
        break
    fi
    echo "Attempt $i/30: Waiting for Ollama port to be available..."
    sleep 2
done

# Create ready indicator file
touch /tmp/ollama_ready
echo "Ollama server is ready!"

# Pull models if specified
if [ -n "$OLLAMA_MODELS" ]; then
    echo "Pulling models: $OLLAMA_MODELS"
    IFS=',' read -ra MODELS <<< "$OLLAMA_MODELS"
    for model in "${MODELS[@]}"; do
        echo "Pulling model: $model (this will update to latest if already exists)"
        ollama pull "$model" || echo "Warning: Failed to pull $model, continuing..."
    done
    echo "Model pulling completed!"
fi

# Keep the server running
wait $OLLAMA_PID
