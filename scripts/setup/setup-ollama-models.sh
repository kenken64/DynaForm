#!/bin/bash
# Bash script to ensure Ollama models are properly loaded

echo -e "\033[32mChecking and loading Ollama models...\033[0m"

# Check if Ollama container is running
OLLAMA_CONTAINER=$(docker-compose ps ollama-gpu -q)
if [ -z "$OLLAMA_CONTAINER" ]; then
    echo -e "\033[31mOllama container is not running. Please start the application first.\033[0m"
    exit 1
fi

echo -e "\033[33mWaiting for Ollama service to be ready...\033[0m"
while true; do
    if curl -s -f http://localhost:11434/api/tags >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

echo -e "\033[32mOllama service is ready!\033[0m"

# Check if qwen2.5vl:latest model is available
echo -e "\033[33mChecking for qwen2.5vl:latest model...\033[0m"
MODELS_RESPONSE=$(curl -s http://localhost:11434/api/tags)
if echo "$MODELS_RESPONSE" | grep -q "qwen2.5vl:latest"; then
    echo -e "\033[32mqwen2.5vl:latest model is already available!\033[0m"
    echo -e "\033[36mModel details:\033[0m"
    echo "$MODELS_RESPONSE" | jq '.models[] | select(.name == "qwen2.5vl:latest") | {name, size, modified_at}' 2>/dev/null || echo "  Model found (jq not available for detailed info)"
else
    echo -e "\033[33mqwen2.5vl:latest model not found. Pulling it now...\033[0m"
    echo -e "\033[36mThis may take several minutes depending on your internet connection...\033[0m"
    
    # Pull the model using docker exec
    docker-compose exec ollama-gpu ollama pull qwen2.5vl:latest
    
    if [ $? -eq 0 ]; then
        echo -e "\033[32mqwen2.5vl:latest model pulled successfully!\033[0m"
    else
        echo -e "\033[31mFailed to pull qwen2.5vl:latest model!\033[0m"
        exit 1
    fi
fi

# Keep the model loaded by making a test request
echo -e "\033[33mLoading model into memory...\033[0m"
TEST_REQUEST='{"model":"qwen2.5vl:latest","prompt":"Hello","stream":false}'

if curl -s -X POST -H "Content-Type: application/json" -d "$TEST_REQUEST" http://localhost:11434/api/generate >/dev/null 2>&1; then
    echo -e "\033[32mModel is loaded and ready for use!\033[0m"
else
    echo -e "\033[33mModel pull completed but failed to load. Check Ollama logs:\033[0m"
    echo -e "\033[36m  docker-compose logs ollama-gpu\033[0m"
fi

echo ""
echo -e "\033[36mAvailable models:\033[0m"
curl -s http://localhost:11434/api/tags | jq -r '.models[]? | "  - \(.name) (\((.size / 1073741824) | floor)GB)"' 2>/dev/null || echo "  Use 'curl http://localhost:11434/api/tags' to see available models"

echo ""
echo -e "\033[32mOllama setup complete! You can now use the application.\033[0m"
