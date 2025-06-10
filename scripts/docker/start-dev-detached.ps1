#!/usr/bin/env pwsh
# PowerShell script for development in detached mode - always rebuilds with latest changes
# Uses development override file for maximum rebuild assurance

Write-Host "Starting Docker Compose in DEVELOPMENT mode (detached)..." -ForegroundColor Green
Write-Host "This will ALWAYS rebuild all containers with latest changes." -ForegroundColor Yellow

# Set build timestamp to force rebuild
$env:BUILD_TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "Build timestamp: $env:BUILD_TIMESTAMP" -ForegroundColor Cyan

# Run docker-compose with both main and dev override files in detached mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --remove-orphans -d

Write-Host "Development environment started in detached mode." -ForegroundColor Green
Write-Host "Services running:" -ForegroundColor Cyan
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f" -ForegroundColor Cyan
Write-Host "  Stop:      docker-compose -f docker-compose.yml -f docker-compose.dev.yml down" -ForegroundColor Cyan
Write-Host "  Restart:   docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart" -ForegroundColor Cyan
