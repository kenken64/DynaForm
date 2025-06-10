# DynaForm Scripts Directory

This directory contains all the scripts for managing, testing, and running the DynaForm application.

## Directory Structure

```
scripts/
├── docker/          # Docker Compose startup scripts
├── setup/           # Setup and configuration scripts
├── test/            # Testing and debugging scripts
└── README.md        # This file
```

## Docker Scripts (`docker/`)

These scripts manage the Docker Compose services for different environments:

### Main Startup Scripts
- `start.sh` / `start.ps1` - Basic startup (development mode)
- `start-dev.sh` / `start-dev.ps1` - Development mode with hot reload
- `start-complete.sh` / `start-complete.ps1` - Complete stack including all services
- `start-secure.sh` / `start-secure.ps1` - Secure mode with authentication

### Build Scripts
- `start-with-build.sh` / `start-with-build.ps1` - Build images before starting
- `start-detached-with-build.sh` / `start-detached-with-build.ps1` - Build and run in background

### Detached Mode Scripts
- `start-detached.sh` / `start-detached.ps1` - Run services in background
- `start-dev-detached.sh` / `start-dev-detached.ps1` - Development mode in background

### Platform-Specific Scripts
- `start-macos.sh` - macOS-optimized startup
- `start-complete-with-mongodb.sh` - Complete stack with MongoDB focus

## Setup Scripts (`setup/`)

Scripts for initial configuration and setup:

- `setup-mongodb-security.sh` / `setup-mongodb-security.ps1` - Configure MongoDB security
- `setup-ollama-models.sh` / `setup-ollama-models.ps1` - Download and configure Ollama AI models
- `setup-redis.sh` - Configure Redis cache
- `mongodb-manager.sh` - MongoDB management utilities

## Test Scripts (`test/`)

### Shell Test Scripts
- `test-mongodb-integration.sh` - Test MongoDB connection and operations
- `test-redis-cache.sh` - Test Redis caching functionality
- `test-recipient-integration.sh` - Test recipient management
- `test-recipient-groups-integration.sh` - Test recipient groups
- `test-routing-fix.sh` / `test-routing-fix-simple.sh` - Test API routing
- `test-secure-config.sh` - Test security configuration
- `test-pdf-fingerprint-implementation.sh` - Test PDF fingerprinting

### JavaScript Test Scripts
- `test-*.js` - Various Node.js test scripts for specific features
- `debug-*.js` - Debugging utilities
- `verify-*.js` - Verification scripts

## Usage Examples

### Quick Start (Development)
```bash
# Linux/macOS
./scripts/docker/start-dev.sh

# Windows PowerShell
./scripts/docker/start-dev.ps1
```

### Production Start
```bash
# Linux/macOS
./scripts/docker/start-complete.sh

# Windows PowerShell
./scripts/docker/start-complete.ps1
```

### Setup New Environment
```bash
# 1. Setup MongoDB security
./scripts/setup/setup-mongodb-security.sh

# 2. Setup Ollama models
./scripts/setup/setup-ollama-models.sh

# 3. Setup Redis
./scripts/setup/setup-redis.sh
```

### Run Tests
```bash
# Test MongoDB
./scripts/test/test-mongodb-integration.sh

# Test Redis
./scripts/test/test-redis-cache.sh

# Test specific functionality
node scripts/test/test-form-creation-api.js
```

## Platform Notes

- **Linux/macOS**: Use `.sh` scripts
- **Windows**: Use `.ps1` scripts (requires PowerShell execution policy)
- **Cross-platform**: Most functionality is available in both formats

## Prerequisites

Before running any scripts, ensure you have:
- Docker and Docker Compose installed
- Node.js (for JavaScript test scripts)
- Appropriate permissions to execute scripts

## Making Scripts Executable

If you encounter permission issues on Linux/macOS:

```bash
chmod +x scripts/docker/*.sh
chmod +x scripts/setup/*.sh
chmod +x scripts/test/*.sh
```

## Environment Variables

Many scripts rely on environment variables defined in:
- `.env` (main environment file)
- `.env.secrets` (sensitive data - not in version control)

Refer to `.env.secrets.template` for required secret variables.
