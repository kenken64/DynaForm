#!/bin/bash
# Bash script to start the doc2formjson application with build
# This ensures all containers are built fresh every time

echo -e "\033[32mStarting doc2formjson application with fresh builds...\033[0m"

# Set build timestamp for forced rebuild
export BUILD_TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Stop any existing containers
echo -e "\033[33mStopping existing containers...\033[0m"
docker-compose down

# Build and start all services with force rebuild
echo -e "\033[33mBuilding and starting all services...\033[0m"
docker-compose up --build --force-recreate

echo -e "\033[32mApplication started successfully!\033[0m"
echo -e "\033[36mAccess the application at: http://localhost:4201\033[0m"
echo ""
echo -e "\033[33mNote: If you encounter Ollama model issues, run: ./setup-ollama-models.sh\033[0m"
