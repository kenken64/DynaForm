#!/bin/bash
# Enhanced bash script to start the application and ensure Ollama models are ready

echo -e "\033[32mStarting doc2formjson application with full setup...\033[0m"

# Set build timestamp for forced rebuild
export BUILD_TIMESTAMP=$(date +"%Y%m%d%H%M%S")
echo -e "\033[36mBuild timestamp: $BUILD_TIMESTAMP\033[0m"

# Stop any existing containers
echo -e "\033[33mStopping existing containers...\033[0m"
docker-compose down

# Build and start all services with force rebuild
echo -e "\033[33mBuilding and starting all services...\033[0m"
docker-compose up --build --force-recreate -d

# Wait for services to be ready
echo -e "\033[33mWaiting for services to be ready...\033[0m"
sleep 10

# Check service status
echo -e "\033[36mService Status:\033[0m"
docker-compose ps

# Setup Ollama models
echo ""
echo -e "\033[32mSetting up Ollama models...\033[0m"

# Wait for Ollama to be ready
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "\033[33mChecking Ollama (attempt $RETRY_COUNT/$MAX_RETRIES)...\033[0m"
    
    if curl -s -f http://localhost:11434/api/tags >/dev/null 2>&1; then
        OLLAMA_READY=true
        break
    fi
    sleep 2
done

if [ "$OLLAMA_READY" = true ]; then
    echo -e "\033[32mOllama service is ready!\033[0m"
    
    # Check and pull model if needed
    MODELS_RESPONSE=$(curl -s http://localhost:11434/api/tags)
    if echo "$MODELS_RESPONSE" | grep -q "qwen2.5vl:latest"; then
        echo -e "\033[32mqwen2.5vl:latest model is already available!\033[0m"
    else
        echo -e "\033[33mPulling qwen2.5vl:latest model (this may take a few minutes)...\033[0m"
        docker-compose exec -T ollama-gpu ollama pull qwen2.5vl:latest
        
        if [ $? -eq 0 ]; then
            echo -e "\033[32mModel pulled successfully!\033[0m"
        else
            echo -e "\033[31mModel pull failed. You may need to pull it manually.\033[0m"
        fi
    fi
    
    # Load model into memory
    echo -e "\033[33mLoading model into memory...\033[0m"
    TEST_REQUEST='{"model":"qwen2.5vl:latest","prompt":"Hello","stream":false}'
    
    if curl -s -X POST -H "Content-Type: application/json" -d "$TEST_REQUEST" http://localhost:11434/api/generate >/dev/null 2>&1; then
        echo -e "\033[32mModel is loaded and ready!\033[0m"
    else
        echo -e "\033[33mModel not responding. Check logs: docker-compose logs ollama-gpu\033[0m"
    fi
else
    echo -e "\033[31mOllama service not ready after $MAX_RETRIES attempts\033[0m"
    echo -e "\033[36mCheck logs: docker-compose logs ollama-gpu\033[0m"
fi

echo ""
echo -e "\033[32mApplication setup complete!\033[0m"
echo ""
echo -e "\033[36mAccess Points:\033[0m"
echo -e "\033[37m  Frontend:      http://localhost:4201\033[0m"
echo -e "\033[37m  API:           http://localhost:3000\033[0m"  
echo -e "\033[37m  PDF Converter: http://localhost:5001\033[0m"
echo -e "\033[37m  Ollama:        http://localhost:11434\033[0m"
echo ""
echo -e "\033[33mUseful Commands:\033[0m"
echo -e "\033[36m  View logs:    docker-compose logs -f\033[0m"
echo -e "\033[36m  Stop:         docker-compose down\033[0m"
echo -e "\033[36m  Restart API:  docker-compose restart doc2formjson-api\033[0m"
