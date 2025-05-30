#!/bin/bash
# Simple health check script that doesn't require curl/wget
# This creates a ready file when Ollama is responding

set -e

echo "Starting Ollama server..."

# Start Ollama in the background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready using nc (netcat) or simple socket check
echo "Waiting for Ollama server to be ready..."
for i in {1..60}; do
    if (echo > /dev/tcp/localhost/11434) 2>/dev/null; then
        echo "Port 11434 is open, testing API..."
        # Try to test the API endpoint using built-in tools
        if echo -e "GET /api/tags HTTP/1.1\r\nHost: localhost:11434\r\nConnection: close\r\n\r\n" | nc localhost 11434 | head -1 | grep -q "200"; then
            break
        fi
    fi
    echo "Attempt $i/60: Waiting for Ollama to be ready..."
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
