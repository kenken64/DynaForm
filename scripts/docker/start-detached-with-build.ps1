#!/usr/bin/env pwsh
# PowerShell script to start Docker Compose in detached mode with forced rebuild
# This ensures all containers are rebuilt with latest changes and run in background

Write-Host "Starting Docker Compose in detached mode with forced rebuild..." -ForegroundColor Green
Write-Host "This will rebuild all containers to ensure latest changes are included." -ForegroundColor Yellow

# Set build timestamp to force rebuild
$env:BUILD_TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"

# Run docker-compose with build flag in detached mode
docker-compose up --build --remove-orphans -d

Write-Host "Docker Compose started in detached mode with rebuild complete." -ForegroundColor Green
Write-Host "Use 'docker-compose logs -f' to view logs or 'docker-compose down' to stop." -ForegroundColor Cyan
