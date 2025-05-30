# PowerShell script to start the doc2formjson application with build
# This ensures all containers are built fresh every time

Write-Host "Starting doc2formjson application with fresh builds..." -ForegroundColor Green

# Set build timestamp for forced rebuild
$env:BUILD_TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start all services with force rebuild
Write-Host "Building and starting all services..." -ForegroundColor Yellow
docker-compose up --build --force-recreate

Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "Access the application at: http://localhost:4201" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: If you encounter Ollama model issues, run: .\setup-ollama-models.ps1" -ForegroundColor Yellow
