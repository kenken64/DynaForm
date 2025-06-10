#!/usr/bin/env pwsh
# PowerShell script for development - always rebuilds with latest changes
# Uses development override file for maximum rebuild assurance

Write-Host "Starting Docker Compose in DEVELOPMENT mode..." -ForegroundColor Green
Write-Host "This will ALWAYS rebuild all containers with latest changes." -ForegroundColor Yellow

# Set build timestamp to force rebuild
$env:BUILD_TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "Build timestamp: $env:BUILD_TIMESTAMP" -ForegroundColor Cyan

# Run docker-compose with both main and dev override files
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --remove-orphans

Write-Host "Development environment stopped." -ForegroundColor Green
