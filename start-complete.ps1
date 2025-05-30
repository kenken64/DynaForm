#!/usr/bin/env pwsh
# Enhanced PowerShell script to start the application and ensure Ollama models are ready

Write-Host "Starting doc2formjson application with full setup..." -ForegroundColor Green

# Set build timestamp for forced rebuild
$env:BUILD_TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"
Write-Host "Build timestamp: $env:BUILD_TIMESTAMP" -ForegroundColor Cyan

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start all services with force rebuild
Write-Host "Building and starting all services..." -ForegroundColor Yellow
docker-compose up --build --force-recreate -d

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "Service Status:" -ForegroundColor Cyan
docker-compose ps

# Setup Ollama models
Write-Host ""
Write-Host "Setting up Ollama models..." -ForegroundColor Green

# Wait for Ollama to be ready
$maxRetries = 30
$retryCount = 0
do {
    Start-Sleep -Seconds 2
    $retryCount++
    Write-Host "Checking Ollama (attempt $retryCount/$maxRetries)..." -ForegroundColor Yellow
    
    $ollamaReady = try { 
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
        $true
    } catch { 
        $false 
    }
} while (-not $ollamaReady -and $retryCount -lt $maxRetries)

if ($ollamaReady) {
    Write-Host "Ollama service is ready!" -ForegroundColor Green
    
    # Check and pull model if needed
    $models = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
    $qwenModel = $models.models | Where-Object { $_.name -eq "qwen2.5vl:latest" }
    
    if ($qwenModel) {
        Write-Host "qwen2.5vl:latest model is already available!" -ForegroundColor Green
    } else {
        Write-Host "Pulling qwen2.5vl:latest model (this may take a few minutes)..." -ForegroundColor Yellow
        docker-compose exec -T ollama-gpu ollama pull qwen2.5vl:latest
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Model pulled successfully!" -ForegroundColor Green
        } else {
            Write-Host "Model pull failed. You may need to pull it manually." -ForegroundColor Red
        }
    }
    
    # Load model into memory
    Write-Host "Loading model into memory..." -ForegroundColor Yellow
    $testRequest = @{
        model = "qwen2.5vl:latest"
        prompt = "Hello"
        stream = $false
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $testRequest -ContentType "application/json" -TimeoutSec 30
        Write-Host "Model is loaded and ready!" -ForegroundColor Green
    } catch {
        Write-Host "Model not responding. Check logs: docker-compose logs ollama-gpu" -ForegroundColor Yellow
    }
} else {
    Write-Host "Ollama service not ready after $maxRetries attempts" -ForegroundColor Red
    Write-Host "Check logs: docker-compose logs ollama-gpu" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Application setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend:      http://localhost:4201" -ForegroundColor White
Write-Host "  API:           http://localhost:3000" -ForegroundColor White  
Write-Host "  PDF Converter: http://localhost:5001" -ForegroundColor White
Write-Host "  Ollama:        http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  View logs:    docker-compose logs -f" -ForegroundColor Cyan
Write-Host "  Stop:         docker-compose down" -ForegroundColor Cyan
Write-Host "  Restart API:  docker-compose restart doc2formjson-api" -ForegroundColor Cyan
