#!/usr/bin/env pwsh
# PowerShell script to ensure Ollama models are properly loaded

Write-Host "Checking and loading Ollama models..." -ForegroundColor Green

# Check if Ollama container is running
$ollamaContainer = docker-compose ps ollama-gpu -q
if (-not $ollamaContainer) {
    Write-Host "Ollama container is not running. Please start the application first." -ForegroundColor Red
    exit 1
}

Write-Host "Waiting for Ollama service to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 2
    $response = try { 
        Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
        $true
    } catch { 
        $false 
    }
} while (-not $response)

Write-Host "Ollama service is ready!" -ForegroundColor Green

# Check if qwen2.5vl:latest model is available
Write-Host "Checking for qwen2.5vl:latest model..." -ForegroundColor Yellow
$models = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
$qwenModel = $models.models | Where-Object { $_.name -eq "qwen2.5vl:latest" }

if ($qwenModel) {
    Write-Host "qwen2.5vl:latest model is already available!" -ForegroundColor Green
    Write-Host "Model details:" -ForegroundColor Cyan
    Write-Host "  Name: $($qwenModel.name)" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($qwenModel.size / 1GB, 2)) GB" -ForegroundColor White
    Write-Host "  Modified: $($qwenModel.modified_at)" -ForegroundColor White
} else {
    Write-Host "qwen2.5vl:latest model not found. Pulling it now..." -ForegroundColor Yellow
    Write-Host "This may take several minutes depending on your internet connection..." -ForegroundColor Cyan
    
    # Pull the model using docker exec
    docker-compose exec ollama-gpu ollama pull qwen2.5vl:latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "qwen2.5vl:latest model pulled successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to pull qwen2.5vl:latest model!" -ForegroundColor Red
        exit 1
    }
}

# Keep the model loaded by making a test request
Write-Host "Loading model into memory..." -ForegroundColor Yellow
$testRequest = @{
    model = "qwen2.5vl:latest"
    prompt = "Hello"
    stream = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $testRequest -ContentType "application/json" -TimeoutSec 30
    Write-Host "Model is loaded and ready for use!" -ForegroundColor Green
} catch {
    Write-Host "Model pull completed but failed to load. Check Ollama logs:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs ollama-gpu" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Available models:" -ForegroundColor Cyan
$models.models | ForEach-Object {
    $sizeGB = [math]::Round($_.size / 1GB, 2)
    Write-Host "  - $($_.name) ($sizeGB GB)" -ForegroundColor White
}

Write-Host ""
Write-Host "Ollama setup complete! You can now use the application." -ForegroundColor Green
