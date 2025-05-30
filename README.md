## Docker Setup and Build Options

This project uses Docker Compose to orchestrate multiple services. The configuration ensures that containers are always rebuilt with the latest changes.

### Quick Start Options

**For Development (Always Rebuilds):**

*Windows (PowerShell):*
```powershell
# Interactive mode with forced rebuild
.\start-dev.ps1

# Detached mode with forced rebuild  
.\start-dev-detached.ps1
```

*Mac/Linux (Bash):*
```bash
# Make scripts executable (first time only)
chmod +x *.sh

# Interactive mode with forced rebuild
./start-dev.sh

# Detached mode with forced rebuild  
./start-dev-detached.sh
```

**Standard Options:**

*Windows (PowerShell):*
```powershell
# Interactive mode with build
.\start-with-build.ps1

# Detached mode with build
.\start-detached-with-build.ps1

# Original scripts (may not always rebuild)
.\start.ps1
.\start-detached.ps1
```

*Mac/Linux (Bash):*
```bash
# Interactive mode with build
./start-with-build.sh

# Detached mode with build
./start-detached-with-build.sh

# Original scripts (may not always rebuild)
./start.sh
./start-detached.sh
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