#!/bin/bash
# Bash script to start Docker Compose in detached mode with forced rebuild
# This ensures all containers are rebuilt with latest changes and run in background

echo -e "\033[32mStarting Docker Compose in detached mode with forced rebuild...\033[0m"
echo -e "\033[33mThis will rebuild all containers to ensure latest changes are included.\033[0m"

# Set build timestamp to force rebuild
export BUILD_TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Run docker-compose with build flag in detached mode
docker-compose up --build --remove-orphans -d

echo -e "\033[32mDocker Compose started in detached mode with rebuild complete.\033[0m"
echo -e "\033[36mUse 'docker-compose logs -f' to view logs or 'docker-compose down' to stop.\033[0m"
