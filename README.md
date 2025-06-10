# DynaForm - AI-Powered Document-to-Form Conversion Platform

**Transform PDF documents into interactive web forms using AI, with blockchain verification for form integrity.**

## Quick Start

**🚀 Super Fast Start:**
```bash
# Mac/Linux
./quick-start.sh dev

# Windows PowerShell  
.\quick-start.ps1 dev
```

**📖 All Scripts Organized:**
All startup, setup, and test scripts are now organized in the `scripts/` directory:
- `scripts/docker/` - Docker Compose startup scripts
- `scripts/setup/` - Setup and configuration scripts  
- `scripts/test/` - Testing and debugging scripts

See `scripts/README.md` for complete documentation.

## Overview

DynaForm is a complete Web3-enabled document digitization platform that converts static PDFs into verified, interactive forms through AI analysis and blockchain verification.

### Core Workflow
```
PDF → AI Analysis → Form Fields → Web Form → Data Collection → Blockchain Verification → Export
```

### Full-Stack Architecture

- **🌐 Frontend**: Angular application (port 4201)
- **🔧 Backend**: Node.js/Express API (port 3000)
- **🗄️ Database**: MongoDB with security features
- **🤖 AI Engine**: Ollama with qwen2.5vl multimodal model
- **📄 PDF Processing**: Python Flask service (port 5001)
- **⚡ Caching**: Redis for performance optimization
- **🔗 Blockchain**: Verifiable smart contracts for form authenticity

### Key Features

- **AI-Powered Extraction**: Automatically extracts form fields from PDF images
- **User Management**: Authentication, authorization, and user profiles
- **Form Builder**: Create and manage interactive forms
- **Public Sharing**: Share forms publicly for data collection
- **Data Export**: Export collected data to Excel formats
- **Blockchain Verification**: Smart contract-based form integrity validation
- **Recipient Management**: Organize and manage form recipients
- **Performance Monitoring**: Comprehensive testing and stress monitoring

### Development Features

- **Cross-Platform**: Windows PowerShell + Mac/Linux Bash scripts
- **Docker Orchestration**: Complete containerized deployment
- **Secure Configuration**: MongoDB with Docker secrets
- **Smart Contracts**: Hardhat-based blockchain deployment
- **Testing Suite**: Unit, integration, and stress testing

## 📚 Documentation & Diagrams

This project includes comprehensive documentation with diagrams, implementation guides, and technical specifications:

| Category | Document | Description |
|----------|----------|-------------|
| **🏗️ Architecture** | [Architecture Diagram](architecture-diagram.md) | Complete system architecture with Mermaid diagrams |
| **🏗️ Architecture** | [Server Class Diagram](server-class-diagram.md) | Backend class structure and relationships |
| **🏗️ Architecture** | [MongoDB Data Flow](mongodb-data-flow-diagrams.md) | Database architecture and data flow diagrams |
| **🏗️ Architecture** | [Dashboard PDF Upload Sequence](dashboard-pdf-upload-sequence.md) | Complete PDF to web form generation flow |
| **🤖 AI Agent** | [AI Agent Code](AI_AGENT_CODE.md) | Complete AI agent implementation details |
| **🤖 AI Agent** | [AI Agent Blockchain Publishing](AI_AGENT_BLOCKCHAIN_PUBLISHING.md) | Blockchain integration for AI agent |
| **🤖 AI Agent** | [AI Agent Completion Summary](AI_AGENT_COMPLETION_SUMMARY.md) | AI agent development summary |
| **🤖 AI Agent** | [Form Extraction Prompt](FORM_EXTRACTION_PROMPT.md) | AI prompts for form field extraction |
| **🤖 AI Agent** | [Ollama Timeout Configuration](OLLAMA_TIMEOUT_CONFIGURATION.md) | Ollama service configuration |
| **🗄️ Database** | [MongoDB Security Guide](MONGODB_SECURITY_GUIDE.md) | Database security implementation |
| **🗄️ Database** | [MongoDB Setup](MONGODB_SETUP_COMPLETE.md) | Database setup and configuration |
| **🗄️ Database** | [MongoDB Users Schema](MONGODB_USERS_SCHEMA.md) | User management database schema |
| **⚡ Caching** | [Redis Cache Implementation](REDIS_CACHE_IMPLEMENTATION_COMPLETE.md) | Redis caching system |
| **⚡ Caching** | [Redis Implementation Final](REDIS_CACHE_IMPLEMENTATION_FINAL.md) | Final Redis implementation |
| **⚡ Caching** | [Redis Iteration Complete](REDIS_ITERATION_COMPLETE.md) | Redis development iterations |
| **🌐 Frontend** | [Angular Routing Fix](ANGULAR_ROUTING_FIX_COMPLETE.md) | Frontend routing implementation |
| **🌐 Frontend** | [Public Form Implementation](PUBLIC_FORM_IMPLEMENTATION_COMPLETE.md) | Public form features |
| **🌐 Frontend** | [Carousel Implementation](CAROUSEL_IMPLEMENTATION_COMPLETE.md) | Image carousel component |
| **🌐 Frontend** | [Forms List Create Button](FORMS_LIST_CREATE_BUTTON_COMPLETE.md) | Forms management interface |
| **🔧 Backend** | [Form Data API](FORM_DATA_API.md) | Backend API documentation |
| **🔧 Backend** | [Recipient Groups API](RECIPIENT_GROUPS_API.md) | Recipient management API |
| **🔧 Backend** | [PDF Fingerprint Update](BACKEND_PDF_FINGERPRINT_UPDATE.md) | PDF processing implementation |
| **🔧 Backend** | [PDF Fingerprint Fix](PDF_FINGERPRINT_FIX_COMPLETE.md) | PDF fingerprint fixes |
| **✨ Features** | [Form Title Autosave](FORM_TITLE_AUTOSAVE_COMPLETE.md) | Auto-save functionality |
| **✨ Features** | [Field Configuration Fix](FIELD_CONFIGURATION_ERROR_FIX_COMPLETE.md) | Form field configuration |
| **✨ Features** | [User Info Implementation](USERINFO_IMPLEMENTATION_COMPLETE.md) | User profile features |
| **✨ Features** | [User Public Submissions](USER_PUBLIC_SUBMISSIONS_TESTING_COMPLETE.md) | Public submission system |
| **🔐 Security** | [Secure Implementation](SECURE_IMPLEMENTATION_SUMMARY.md) | Security implementation guide |
| **🔐 Security** | [Testing Secure Config](TESTING_SECURE_CONFIG.md) | Security testing procedures |
| **🧪 Testing** | [Autosave Testing Guide](AUTOSAVE_TESTING_GUIDE.md) | Testing autosave features |
| **🧪 Testing** | [Autosave Fix Verification](AUTOSAVE_FIX_VERIFICATION.md) | Autosave bug fixes |
| **🛠️ DevOps** | [Scripts Organization](SCRIPTS_REORGANIZATION_COMPLETE.md) | Script structure reorganization |
| **🛠️ DevOps** | [Scripts Documentation](scripts/README.md) | Complete scripts usage guide |
| **⚙️ Hardware** | [NVIDIA Configuration](NVIDIA.md) | GPU acceleration setup |

### Quick Access to Key Diagrams

- **🏗️ [System Architecture](architecture-diagram.md)** - Complete physical architecture
- **🗄️ [Database Design](mongodb-data-flow-diagrams.md)** - MongoDB data flow and schemas  
- **🔧 [Backend Structure](server-class-diagram.md)** - Server-side class diagrams
- **📄 [PDF Upload Flow](dashboard-pdf-upload-sequence.md)** - Complete user journey from PDF to web form
- **🤖 [AI Integration](AI_AGENT_CODE.md)** - AI agent implementation details

## Docker Setup and Build Options

This project uses Docker Compose to orchestrate multiple services including MongoDB for data persistence. The configuration ensures that containers are always rebuilt with the latest changes.

### Complete Application Stack

**MongoDB + All Services (Recommended):**

```bash
# Complete setup with MongoDB - Interactive mode
./scripts/docker/start-complete-with-mongodb.sh

# MongoDB management
./scripts/setup/mongodb-manager.sh start     # Start MongoDB only
./scripts/setup/mongodb-manager.sh connect   # Connect to MongoDB shell
./scripts/setup/mongodb-manager.sh stats     # Show database statistics
./scripts/setup/mongodb-manager.sh help      # Show all commands
```

**Services Included:**
- 🗄️ **MongoDB**: Document database for form data storage
- 🤖 **Ollama**: LLM service for form field analysis  
- 🔧 **API**: Node.js/Express backend service
- 📄 **PDF Converter**: Python Flask service for PDF processing
- 🌐 **Frontend**: Angular application

### Quick Start Options

**For Development (Always Rebuilds):**

*Windows (PowerShell):*
```powershell
# Interactive mode with forced rebuild
.\scripts\docker\start-dev.ps1

# Detached mode with forced rebuild  
.\scripts\docker\start-dev-detached.ps1
```

*Mac/Linux (Bash):*
```bash
# Make scripts executable (first time only)
chmod +x scripts/docker/*.sh scripts/setup/*.sh scripts/test/*.sh

# Complete stack with MongoDB (recommended)
./scripts/docker/start-complete-with-mongodb.sh

# Interactive mode with forced rebuild
./scripts/docker/start-dev.sh

# Detached mode with forced rebuild  
./scripts/docker/start-dev-detached.sh
```

**Standard Options:**

*Windows (PowerShell):*
```powershell
# Interactive mode with build
.\scripts\docker\start-with-build.ps1

# Detached mode with build
.\scripts\docker\start-detached-with-build.ps1

# Original scripts (may not always rebuild)
.\scripts\docker\start.ps1
.\scripts\docker\start-detached.ps1
```

*Mac/Linux (Bash):*
```bash
# Interactive mode with build
./scripts/docker/start-with-build.sh

# Detached mode with build
./scripts/docker/start-detached-with-build.sh

# Original scripts (may not always rebuild)
./scripts/docker/start.sh
./scripts/docker/start-detached.sh
```

### Manual Docker Commands

**Always rebuild all containers:**
```bash
# Set timestamp for forced rebuild
$env:BUILD_TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"
docker-compose up --build

# Or using development override
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**Standard commands:**
```bash
# Start services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services and Ports

- **Frontend (Angular)**: http://localhost:4201
- **API (Node.js)**: http://localhost:3000  
- **PDF Converter (Python Flask)**: http://localhost:5001
- **Ollama GPU**: http://localhost:11434
- **MongoDB**: mongodb://localhost:27017

### MongoDB Configuration

The application uses MongoDB for persistent data storage with the following setup:

**Database Information:**
- **Database Name**: `doc2formjson`
- **Collections**: `form_submissions`, `forms`, `users`, `form_templates`
- **Application User**: `doc2formapp` (read/write access)
- **Read-only User**: `doc2formreader` (analytics access)

**Connection Details:**
```
MongoDB URI: mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson
Admin URI: mongodb://admin:password123@localhost:27017/admin
```

**Environment Variables:**
```bash
MONGODB_URI=mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson
MONGODB_DB_NAME=doc2formjson
```

**⚠️ Security Note**: Default passwords are for development only. Change them in production!

### MongoDB Management

Use the MongoDB manager script for easy database operations:

```bash
./mongodb-manager.sh start      # Start MongoDB container
./mongodb-manager.sh stop       # Stop MongoDB container
./mongodb-manager.sh connect    # Open MongoDB shell
./mongodb-manager.sh stats      # Show database statistics
./mongodb-manager.sh backup     # Create database backup
./mongodb-manager.sh logs       # View MongoDB logs
./mongodb-manager.sh help       # Show all commands
```

**Sample Database Operations:**
```javascript
// Connect to application database
use doc2formjson

// View collections
show collections

// Count form submissions
db.form_submissions.countDocuments()

// Find recent submissions
db.form_submissions.find().sort({submissionMetadata.submittedAt: -1}).limit(5)

// Search submissions by form title
db.form_submissions.find({formTitle: {$regex: "invoice", $options: "i"}})
```

## Install Ollama with Qwen Multimodal

```
ollama run qwen2.5vl:latest
```

https://ollama.com/blog/multimodal-models


## Server side that convert pdf to png

Linux
```
sudo apt-get update
sudo apt-get install poppler-utils
```

Macos
```
brew install poppler
```

Install python libraries

```
pip install Flask pdf2image Pillow
```

```
python app.py
```

```
curl -X POST \
     -F "pdfFile=@/path/to/your/document.pdf" \
     http://localhost:5001/conversion/pdf-to-png-save
```



## Server side with LLM Models
```
npm i 
```

Okay, let's set up your Node.js Express project to be TypeScript-compatible. This involves installing TypeScript, configuring it, and adjusting your scripts.

Here's a step-by-step guide:

**1. Initialize your project (if you haven't already):**

```bash
npm init -y
```

**2. Install Dependencies:**

*   **Core Dependencies (for your application):**
    ```bash
    npm install express multer
    # npm install node-fetch # If you were using this for Node < 18
    ```
*   **Development Dependencies (for TypeScript and tooling):**
    ```bash
    npm install --save-dev typescript ts-node nodemon @types/node @types/express @types/multer
    ```
    *   `typescript`: The TypeScript compiler.
    *   `ts-node`: Allows you to run TypeScript files directly without pre-compiling (great for development).
    *   `nodemon`: Automatically restarts your server when files change (works well with `ts-node`).
    *   `@types/node`: Type definitions for Node.js built-in modules.
    *   `@types/express`: Type definitions for Express.
    *   `@types/multer`: Type definitions for Multer.

**3. Create a TypeScript Configuration File (`tsconfig.json`):**

Run this command in your project root:

```bash
npx tsc --init
```


**7. Running Your TypeScript Application:**

*   **For Development:**
    ```bash
    npm run dev
    ```
    `nodemon` will start your server using `ts-node`. Any changes you make to `.ts` files in `src` will cause the server to automatically restart.

*   **For Production:**
    1.  **Build the project:**
        ```bash
        npm run build
        ```
        This will compile your TypeScript code from `src` into JavaScript in the `dist` folder.
    2.  **Run the compiled code:**
        ```bash
        npm run start
        ```
        This runs the `dist/server.js` file using Node.js.

Now your Express API is set up with TypeScript, providing better code organization, type safety, and an improved development experience! Remember to change `DEFAULT_MODEL_NAME` in `src/server.ts`.

```
curl -X POST \
     -F "imageFile=@/path/to/your/my_test_image.jpg" \
     -F "prompt=Describe this image in a few sentences." \
     -F "model=qwen:7b" \
     http://localhost:3000/api/describe-image
```


```
curl -X POST \                         
     -F "imageFile=@sampleform_page_1.png" \               
     -F "prompt=List all the form fields format the output in json (make sure is this json structure {forms:[ fields: []]}) and also provide the field type whether it is a textbox or checkbox" \
     -F "model=qwen2.5vl:latest" \
     http://localhost:3000/api/describe-image

```

```
curl -X POST \
     -F "imageFile=@sampleform_page_1.png" \
     -F "prompt=List all the form fields format the output in csv and also provide the field type whether is a textbox or checkbox" \ 
     -F "model=qwen2.5vl:latest" \
     http://localhost:3000/api/describe-image


{"description":"Sure, here is the list of form fields in CSV format with their respective types:\n\n| Field Name | Field Type |\n|------------|------------|\n| Given Name | Textbox    |\n| Family Name | Textbox    |\n| Address 1 | Textbox    |\n| Address 2 | Textbox    |\n| House nr | Textbox    |\n| Postcode | Textbox    |\n| City | Textbox    |\n| Country | Textbox    |\n| Gender | Textbox    |\n| Height (cm) | Textbox    |\n| Driving License | Checkbox   |\n| I speak and understand (tick all that apply) | Checkbox   |\n| Deutsch | Checkbox   |\n| English | Checkbox   |\n| Français | Checkbox   |\n| Esperanto | Checkbox   |\n| Latin | Checkbox   |\n| Favourite colour | Textbox    |\n\nThis CSV format lists the field names and their corresponding types.","modelUsed":"qwen2.5vl:latest","createdAt":"2025-05-26T19:19:28.563265Z","timings":{"totalDuration":8454185958,"promptEvalDuration":1119861291,"evalDuration":7290537000},"tokenCounts":{"promptEvalCount":1311,"evalCount":185}}%
```

### Ollama Model Management

The application requires the `qwen2.5vl:latest` model to be available in Ollama. The model is automatically cached in a Docker volume for persistence.

**Automatic Setup:**

*Windows (PowerShell):*
```powershell
# Complete setup with model initialization
.\start-complete.ps1
```

*Mac/Linux (Bash):*
```bash
# Complete setup with model initialization
./start-complete.sh
```

**Manual Model Setup:**

*Windows (PowerShell):*
```powershell
# Ensure models are ready (run after containers are started)
.\setup-ollama-models.ps1
```

*Mac/Linux (Bash):*
```bash
# Ensure models are ready (run after containers are started)
./setup-ollama-models.sh
```

**Troubleshooting Ollama Issues:**
- Model not found: Run `.\setup-ollama-models.ps1` (Windows) or `./setup-ollama-models.sh` (Mac/Linux)
- Check Ollama logs: `docker-compose logs ollama-gpu`
- Manually pull model: `docker-compose exec ollama-gpu ollama pull qwen2.5vl:latest`

### API Routing Fix

The nginx configuration has been updated to properly proxy API calls from the frontend to the backend services:
- Frontend (port 4201) → API calls get proxied to → Backend (port 3000)
- PDF conversion calls get proxied to → PDF service (port 5001)

## Cross-Platform Usage

This project includes both PowerShell scripts (`.ps1`) for Windows and Bash scripts (`.sh`) for Mac/Linux to provide identical functionality across platforms.

### Windows Setup
PowerShell scripts are ready to use. If you encounter execution policy issues:
```powershell
# Allow script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Mac/Linux Setup
Make shell scripts executable on first use:
```bash
# Make all scripts executable
chmod +x *.sh

# Or make individual scripts executable
chmod +x start-complete.sh
chmod +x setup-ollama-models.sh
```

### Script Equivalents
| Windows (PowerShell) | Mac/Linux (Bash) | Description |
|---------------------|-------------------|-------------|
| `start-complete.ps1` | `start-complete.sh` | Complete setup with model initialization |
| `start-dev.ps1` | `start-dev.sh` | Development mode (always rebuilds) |
| `start-dev-detached.ps1` | `start-dev-detached.sh` | Development detached mode |
| `start-with-build.ps1` | `start-with-build.sh` | Force rebuild and start |
| `start-detached-with-build.ps1` | `start-detached-with-build.sh` | Force rebuild and start detached |
| `start.ps1` | `start.sh` | Standard start with build |
| `start-detached.ps1` | `start-detached.sh` | Standard start detached |
| `setup-ollama-models.ps1` | `setup-ollama-models.sh` | Setup Ollama models only |

### Secure MongoDB Configuration 🔐

For production deployments, use the secure configuration that implements Docker secrets for password management:

```bash
# Setup secure MongoDB configuration (one-time setup)
./setup-mongodb-security.sh

# Start with secure configuration
./start-secure.sh

# Test secure configuration
./test-secure-config.sh

# Test MongoDB connection
node test-mongodb-connection.js
```

**Security Features:**
- 🔒 **Docker Secrets**: Passwords stored as Docker secrets, not environment variables
- 🔑 **Role-based Access**: Separate users for admin, application, and read-only access
- 📁 **Secure Storage**: Password files with restricted permissions (600)
- 🛡️ **No Plain Text**: No passwords in Docker Compose files or environment variables
- 📝 **Comprehensive Logging**: Security audit trail and configuration validation

**Files Created:**
- `secrets/mongo_root_password.txt` - MongoDB admin password
- `secrets/mongo_app_password.txt` - Application user password  
- `secrets/mongo_reader_password.txt` - Read-only user password
- `docker-compose.secure.yml` - Secure Docker Compose configuration

See [MONGODB_SECURITY_GUIDE.md](./MONGODB_SECURITY_GUIDE.md) for detailed security documentation.
See [TESTING_SECURE_CONFIG.md](./TESTING_SECURE_CONFIG.md) for testing instructions.