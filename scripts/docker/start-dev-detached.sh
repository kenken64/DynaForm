#!/bin/bash
# Bash script for development in detached mode - always rebuilds with latest changes
# Uses development override file for maximum rebuild assurance

echo -e "\033[32mStarting Docker Compose in DEVELOPMENT mode (detached)...\033[0m"
echo -e "\033[33mThis will ALWAYS rebuild all containers with latest changes.\033[0m"

# Set build timestamp to force rebuild
export BUILD_TIMESTAMP=$(date +"%Y%m%d%H%M%S")

echo -e "\033[36mBuild timestamp: $BUILD_TIMESTAMP\033[0m"

# Run docker-compose with both main and dev override files in detached mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --remove-orphans -d

echo -e "\033[32mDevelopment environment started in detached mode.\033[0m"
echo -e "\033[36mServices running:\033[0m"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

echo ""
echo -e "\033[33mUseful commands:\033[0m"
echo -e "\033[36m  View logs: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f\033[0m"
echo -e "\033[36m  Stop:      docker-compose -f docker-compose.yml -f docker-compose.dev.yml down\033[0m"
echo -e "\033[36m  Restart:   docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart\033[0m"
