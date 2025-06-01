# Start Doc2FormJSON with Secure MongoDB Configuration
# This script uses Docker Secrets for secure password management

# Enable strict error handling
$ErrorActionPreference = "Stop"

# Color functions for output
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host " $Message" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Header "🔐 Starting Doc2FormJSON with Secure MongoDB"

# Check if secrets exist
if (-not (Test-Path "./secrets") -or -not (Test-Path "./secrets/mongo_root_password.txt")) {
    Write-Error "MongoDB secrets not found!"
    Write-Host ""
    Write-Host "Please run the security setup script first:" -ForegroundColor White
    Write-Host "  .\setup-mongodb-security.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Success "MongoDB secrets found"

# Build timestamp for cache busting
$env:BUILD_TIMESTAMP = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
Write-Success "Build timestamp: $($env:BUILD_TIMESTAMP)"

# Start with secure configuration
Write-Header "🚀 Starting Services with Docker Secrets"

Write-Host "Starting services with secure configuration..." -ForegroundColor White
try {
    docker compose -f docker-compose.secure.yml up --build
}
catch {
    Write-Error "Failed to start Docker services: $_"
    exit 1
}

Write-Success "All services started successfully with secure MongoDB!"

# Setup Ollama models
Write-Host ""
Write-Host "Setting up Ollama models..." -ForegroundColor Green

# Wait for Ollama to be ready
$MAX_RETRIES = 30
$RETRY_COUNT = 0
$OLLAMA_READY = $false

while ($RETRY_COUNT -lt $MAX_RETRIES) {
    $RETRY_COUNT++
    Write-Host "Checking Ollama (attempt $RETRY_COUNT/$MAX_RETRIES)..." -ForegroundColor Yellow

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response) {
            $OLLAMA_READY = $true
            break
        }
    }
    catch {
        # Continue trying
    }
    Start-Sleep -Seconds 2
}

if ($OLLAMA_READY) {
    Write-Host "Ollama service is ready!" -ForegroundColor Green

    # Check and pull model if needed
    try {
        $modelsResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET
        $hasModel = $false
        
        if ($modelsResponse.models) {
            foreach ($model in $modelsResponse.models) {
                if ($model.name -eq "qwen2.5vl:latest") {
                    $hasModel = $true
                    break
                }
            }
        }

        if ($hasModel) {
            Write-Host "qwen2.5vl:latest model is already available!" -ForegroundColor Green
        }
        else {
            Write-Host "Pulling qwen2.5vl:latest model (this may take a few minutes)..." -ForegroundColor Yellow
            
            $pullResult = docker compose exec -T ollama-gpu ollama pull qwen2.5vl:latest
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Model pulled successfully!" -ForegroundColor Green
            }
            else {
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
            $generateResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method POST -Body $testRequest -ContentType "application/json" -TimeoutSec 30
            Write-Host "Model is loaded and ready!" -ForegroundColor Green
        }
        catch {
            Write-Host "Model not responding. Check logs: docker compose logs ollama-gpu" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error checking models: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "Ollama service not ready after $MAX_RETRIES attempts" -ForegroundColor Red
    Write-Host "Check logs: docker compose logs ollama-gpu" -ForegroundColor Cyan
}

Write-Host ""
Write-Header "📋 Connection Information"
Write-Host "🌐 Frontend: http://localhost:4201" -ForegroundColor White
Write-Host "🔌 API: http://localhost:3000" -ForegroundColor White
Write-Host "🗄️  MongoDB: mongodb://localhost:27018" -ForegroundColor White
Write-Host ""
Write-Host "🔐 MongoDB credentials are managed securely via Docker secrets" -ForegroundColor White
Write-Host "📁 Secrets directory: ./secrets/" -ForegroundColor White
Write-Host ""
Write-Warning "Remember: Never commit the secrets/ directory to version control!"
