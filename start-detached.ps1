# PowerShell script to start the doc2formjson application in background with build
# This ensures all containers are built fresh every time and run in detached mode

Write-Host "Starting doc2formjson application with fresh builds in background..." -ForegroundColor Green

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start all services with force rebuild in detached mode
Write-Host "Building and starting all services in background..." -ForegroundColor Yellow
docker-compose up --build --force-recreate -d

# Wait a moment for services to start
Start-Sleep -Seconds 5

# Check container status
Write-Host "Container status:" -ForegroundColor Cyan
docker-compose ps

Write-Host "Application started successfully in background!" -ForegroundColor Green
Write-Host "Access the application at: http://localhost:4201" -ForegroundColor Cyan
Write-Host "View logs with: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "Stop with: docker-compose down" -ForegroundColor Cyan
