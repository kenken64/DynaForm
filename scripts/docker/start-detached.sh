#!/bin/bash
# Bash script to start the doc2formjson application in detached mode
# This runs all services in the background

echo -e "\033[32mStarting doc2formjson application in detached mode...\033[0m"

# Stop any existing containers
echo -e "\033[33mStopping existing containers...\033[0m"
docker-compose down

# Start all services in detached mode
echo -e "\033[33mStarting all services in detached mode...\033[0m"
docker-compose up -d

echo -e "\033[32mApplication started successfully in detached mode!\033[0m"
echo -e "\033[36mAccess the application at: http://localhost:4201\033[0m"
echo ""
echo -e "\033[33mUseful commands:\033[0m"
echo -e "\033[36m  View logs: docker-compose logs -f\033[0m"
echo -e "\033[36m  Stop:      docker-compose down\033[0m"
echo -e "\033[36m  Status:    docker-compose ps\033[0m"
