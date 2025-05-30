#!/bin/bash
# Bash script to start Docker Compose with forced rebuild
# This ensures all containers are rebuilt with latest changes

echo -e "\033[32mStarting Docker Compose with forced rebuild...\033[0m"
echo -e "\033[33mThis will rebuild all containers to ensure latest changes are included.\033[0m"

# Set build timestamp to force rebuild
export BUILD_TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Run docker-compose with build flag
docker-compose up --build --remove-orphans

echo -e "\033[32mDocker Compose started with rebuild complete.\033[0m"
