# MongoDB Password Generator and Setup Script (PowerShell)
# This script generates secure passwords and sets up the secrets files

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

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Magenta
}

# Generate secure password
function Generate-Password {
    param([int]$Length = 32)
    
    # Use .NET's RNGCryptoServiceProvider for secure random generation
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    $password = ""
    
    for ($i = 0; $i -lt $Length; $i++) {
        $randomIndex = Get-Random -Minimum 0 -Maximum $chars.Length
        $password += $chars[$randomIndex]
    }
    
    return $password
}

# Create secrets directory
function Create-SecretsDirectory {
    Write-Info "Creating secrets directory..."
    
    if (-not (Test-Path "secrets")) {
        New-Item -ItemType Directory -Path "secrets" -Force | Out-Null
    }
    
    # Set restrictive permissions (Windows equivalent)
    $acl = Get-Acl "secrets"
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, "FullControl", "Allow")
    $acl.SetAccessRule($rule)
    Set-Acl -Path "secrets" -AclObject $acl
    
    Write-Success "Secrets directory created with restricted permissions"
}

# Generate and save passwords
function Generate-Passwords {
    Write-Header "Generating Secure MongoDB Passwords"
    
    # Generate passwords
    $rootPassword = Generate-Password -Length 24
    $appPassword = Generate-Password -Length 32
    $readerPassword = Generate-Password -Length 24
    
    # Save to secret files
    $rootPassword | Out-File -FilePath "secrets\mongo_root_password.txt" -Encoding utf8 -NoNewline
    $appPassword | Out-File -FilePath "secrets\mongo_app_password.txt" -Encoding utf8 -NoNewline
    $readerPassword | Out-File -FilePath "secrets\mongo_reader_password.txt" -Encoding utf8 -NoNewline
    
    # Set restrictive permissions on secret files
    foreach ($file in @("secrets\mongo_root_password.txt", "secrets\mongo_app_password.txt", "secrets\mongo_reader_password.txt")) {
        $acl = Get-Acl $file
        $acl.SetAccessRuleProtection($true, $false)
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, "FullControl", "Allow")
        $acl.SetAccessRule($rule)
        Set-Acl -Path $file -AclObject $acl
    }
    
    Write-Success "Generated root password: $($rootPassword.Substring(0,8))... (24 characters)"
    Write-Success "Generated app password: $($appPassword.Substring(0,8))... (32 characters)"
    Write-Success "Generated reader password: $($readerPassword.Substring(0,8))... (24 characters)"
    
    # Create .env.secrets file
    Create-EnvSecretsFile -RootPassword $rootPassword -AppPassword $appPassword -ReaderPassword $readerPassword
    
    return @{
        Root = $rootPassword
        App = $appPassword
        Reader = $readerPassword
    }
}

# Create .env.secrets file
function Create-EnvSecretsFile {
    param(
        [string]$RootPassword,
        [string]$AppPassword,
        [string]$ReaderPassword
    )
    
    Write-Info "Creating .env.secrets file..."
    
    $envContent = @"
# MongoDB Credentials - GENERATED AUTOMATICALLY
# DO NOT COMMIT TO VERSION CONTROL

# MongoDB Root Admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=$RootPassword

# MongoDB Application Database
MONGO_INITDB_DATABASE=doc2formjson

# MongoDB Application User (used by API)
MONGODB_APP_USERNAME=doc2formapp
MONGODB_APP_PASSWORD=$AppPassword

# MongoDB Read-only User (for analytics)
MONGODB_READER_USERNAME=doc2formreader
MONGODB_READER_PASSWORD=$ReaderPassword

# Connection URIs
MONGODB_URI=mongodb://doc2formapp:$AppPassword@mongodb:27018/doc2formjson
MONGODB_ADMIN_URI=mongodb://admin:$RootPassword@mongodb:27018/admin

# Generation timestamp
GENERATED_AT=$(Get-Date)
"@
    
    $envContent | Out-File -FilePath ".env.secrets" -Encoding utf8
    
    # Set restrictive permissions
    $acl = Get-Acl ".env.secrets"
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, "FullControl", "Allow")
    $acl.SetAccessRule($rule)
    Set-Acl -Path ".env.secrets" -AclObject $acl
    
    Write-Success ".env.secrets file created with secure permissions"
}

# Update API .env file
function Update-ApiEnv {
    param([string]$AppPassword)
    
    Write-Info "Updating API .env file..."
    
    $envFile = "describeImge\.env"
    
    if (Test-Path $envFile) {
        # Backup original
        $backupFile = "$envFile.backup.$((Get-Date).ToString('yyyyMMdd_HHmmss'))"
        Copy-Item $envFile $backupFile
        
        # Read current content
        $content = Get-Content $envFile
        
        # Update MongoDB URI and password
        $updatedContent = $content | ForEach-Object {
            if ($_ -match "^MONGODB_URI=") {
                "MONGODB_URI=mongodb://doc2formapp:$AppPassword@mongodb:27018/doc2formjson"
            }
            elseif ($_ -match "^MONGODB_PASSWORD=") {
                "MONGODB_PASSWORD=$AppPassword"
            }
            else {
                $_
            }
        }
        
        $updatedContent | Out-File -FilePath $envFile -Encoding utf8
        
        Write-Success "API .env file updated with new MongoDB credentials"
    }
    else {
        Write-Warning "API .env file not found at $envFile"
    }
}

# Update .gitignore
function Update-GitIgnore {
    Write-Info "Updating .gitignore to protect secrets..."
    
    $gitignoreEntries = @"

# MongoDB Secrets
secrets/
.env.secrets
*.env.secrets
*password*.txt

# Environment files with credentials
.env.local
.env.production
.env.development

# Docker secrets
docker-secrets/

"@
    
    if (Test-Path ".gitignore") {
        $currentContent = Get-Content ".gitignore" -Raw
        if ($currentContent -notmatch "secrets/") {
            Add-Content -Path ".gitignore" -Value $gitignoreEntries
            Write-Success "Updated .gitignore with security entries"
        } else {
            Write-Info ".gitignore already contains security entries"
        }
    } else {
        $gitignoreEntries | Out-File -FilePath ".gitignore" -Encoding utf8
        Write-Success "Created .gitignore with security entries"
    }
}

# Verify MongoDB init script
function Verify-MongoInitScript {
    Write-Info "Verifying MongoDB initialization script..."
    
    $initScriptPath = "mongodb\init-scripts\01-create-users.js"
    
    if (Test-Path $initScriptPath) {
        Write-Success "MongoDB initialization script found"
    } else {
        Write-Warning "MongoDB initialization script not found at $initScriptPath"
        Write-Info "The script should create the application user automatically"
    }
}

# Display final instructions
function Show-FinalInstructions {
    param([hashtable]$Passwords)
    
    Write-Header "🔐 MongoDB Security Setup Complete!"
    
    Write-Host ""
    Write-Host "📁 Generated Files:" -ForegroundColor White
    Write-Host "   ├── secrets\mongo_root_password.txt" -ForegroundColor Gray
    Write-Host "   ├── secrets\mongo_app_password.txt" -ForegroundColor Gray
    Write-Host "   ├── secrets\mongo_reader_password.txt" -ForegroundColor Gray
    Write-Host "   └── .env.secrets" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "🔑 Credentials Summary:" -ForegroundColor White
    Write-Host "   Root Admin:     admin / $($Passwords.Root.Substring(0,8))..." -ForegroundColor Yellow
    Write-Host "   App User:       doc2formapp / $($Passwords.App.Substring(0,8))..." -ForegroundColor Yellow
    Write-Host "   Reader User:    doc2formreader / $($Passwords.Reader.Substring(0,8))..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🚀 Next Steps:" -ForegroundColor White
    Write-Host "   1. Start secure services: .\start-secure.ps1" -ForegroundColor Cyan
    Write-Host "   2. Test connection: .\test-mongodb-connection.js" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Warning "🔒 SECURITY REMINDERS:"
    Write-Host "   • Never commit the secrets/ directory" -ForegroundColor Red
    Write-Host "   • Never commit .env.secrets file" -ForegroundColor Red
    Write-Host "   • Backup passwords securely" -ForegroundColor Red
    Write-Host "   • Use these credentials only in production" -ForegroundColor Red
}

# Main execution
try {
    Write-Header "🔐 MongoDB Security Setup for Windows"
    
    # Check if secrets already exist
    if ((Test-Path "secrets\mongo_root_password.txt") -and 
        (Test-Path "secrets\mongo_app_password.txt") -and 
        (Test-Path "secrets\mongo_reader_password.txt")) {
        
        Write-Warning "MongoDB secrets already exist!"
        $response = Read-Host "Do you want to regenerate them? This will overwrite existing passwords! (y/N)"
        
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Info "Keeping existing secrets. Setup cancelled."
            exit 0
        }
    }
    
    # Create directory and generate passwords
    Create-SecretsDirectory
    $passwords = Generate-Passwords
    
    # Update configuration files
    Update-ApiEnv -AppPassword $passwords.App
    Update-GitIgnore
    Verify-MongoInitScript
    
    # Show final instructions
    Show-FinalInstructions -Passwords $passwords
    
} catch {
    Write-Error "Setup failed: $_"
    exit 1
}
