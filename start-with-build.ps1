#!/usr/bin/env pwsh
# PowerShell script to start Docker Compose with forced rebuild
# This ensures all containers are rebuilt with latest changes

Write-Host "Starting Docker Compose with forced rebuild..." -ForegroundColor Green
Write-Host "This will rebuild all containers to ensure latest changes are included." -ForegroundColor Yellow

# Set build timestamp to force rebuild
$env:BUILD_TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"

# Run docker-compose with build flag
docker-compose up --build --remove-orphans

Write-Host "Docker Compose started with rebuild complete." -ForegroundColor Green
