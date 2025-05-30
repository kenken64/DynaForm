#!/bin/bash

# Entrypoint script for Ollama with model initialization

set -e

echo "Starting Ollama server..."

# Start Ollama in the background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama server to be ready..."
until (curl -f http://localhost:11434/api/tags >/dev/null 2>&1 || wget -q --spider http://localhost:11434/api/tags >/dev/null 2>&1); do
    sleep 2
done

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
