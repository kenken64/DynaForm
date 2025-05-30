#!/bin/bash
# Bash script for development - always rebuilds with latest changes
# Uses development override file for maximum rebuild assurance

echo -e "\033[32mStarting Docker Compose in DEVELOPMENT mode...\033[0m"
echo -e "\033[33mThis will ALWAYS rebuild all containers with latest changes.\033[0m"

# Set build timestamp to force rebuild
export BUILD_TIMESTAMP=$(date +"%Y%m%d%H%M%S")

echo -e "\033[36mBuild timestamp: $BUILD_TIMESTAMP\033[0m"

# Run docker-compose with both main and dev override files
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --remove-orphans

echo -e "\033[32mDevelopment environment stopped.\033[0m"
