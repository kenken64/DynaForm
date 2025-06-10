# DynaForm Quick Start Script (PowerShell)
# This is a convenience script that redirects to the organized scripts directory

Write-Host "🚀 DynaForm Quick Start" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host ""
Write-Host "All scripts have been moved to the 'scripts/' directory for better organization." -ForegroundColor Yellow
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 DOCKER SCRIPTS (scripts/docker/):" -ForegroundColor Blue
Write-Host "  .\scripts\docker\start-dev.ps1           - Development mode"
Write-Host "  .\scripts\docker\start-complete.ps1      - Complete stack"
Write-Host "  .\scripts\docker\start-secure.ps1        - Secure mode"
Write-Host "  .\scripts\docker\start-detached.ps1      - Background mode"
Write-Host ""
Write-Host "⚙️  SETUP SCRIPTS (scripts/setup/):" -ForegroundColor Blue
Write-Host "  .\scripts\setup\setup-mongodb-security.ps1    - Setup MongoDB"
Write-Host "  .\scripts\setup\setup-ollama-models.ps1       - Setup AI models"
Write-Host ""
Write-Host "🧪 TEST SCRIPTS (scripts/test/):" -ForegroundColor Blue
Write-Host "  .\scripts\test\test-*.sh                       - Various shell tests"
Write-Host "  node .\scripts\test\test-*.js                  - Various Node.js tests"
Write-Host ""
Write-Host "📚 For full documentation, see: scripts\README.md" -ForegroundColor Magenta
Write-Host ""

# If arguments provided, try to guess what the user wants
param(
    [string]$Command
)

if ($Command) {
    switch ($Command.ToLower()) {
        "dev" { 
            Write-Host "🔄 Starting development mode..." -ForegroundColor Green
            & ".\scripts\docker\start-dev.ps1"
        }
        "development" { 
            Write-Host "🔄 Starting development mode..." -ForegroundColor Green
            & ".\scripts\docker\start-dev.ps1"
        }
        "complete" { 
            Write-Host "🔄 Starting complete stack..." -ForegroundColor Green
            & ".\scripts\docker\start-complete.ps1"
        }
        "full" { 
            Write-Host "🔄 Starting complete stack..." -ForegroundColor Green
            & ".\scripts\docker\start-complete.ps1"
        }
        "secure" { 
            Write-Host "🔄 Starting secure mode..." -ForegroundColor Green
            & ".\scripts\docker\start-secure.ps1"
        }
        "setup" {
            Write-Host "📖 Setup documentation:" -ForegroundColor Yellow
            Write-Host "  1. Run: .\scripts\setup\setup-mongodb-security.ps1"
            Write-Host "  2. Run: .\scripts\setup\setup-ollama-models.ps1"
        }
        "help" {
            Write-Host "Usage: .\quick-start.ps1 [dev|complete|secure|setup|help]" -ForegroundColor Cyan
        }
        default {
            Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
            Write-Host "💡 Try: .\quick-start.ps1 help" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "💡 Quick start: .\quick-start.ps1 dev" -ForegroundColor Yellow
    Write-Host "💡 Full help:   .\quick-start.ps1 help" -ForegroundColor Yellow
}
