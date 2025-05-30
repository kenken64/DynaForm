# Ollama GPU Docker Setup

This directory contains the Docker configuration for running Ollama with GPU support.

## Prerequisites

1. **NVIDIA Docker Runtime**: Install nvidia-docker2
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y nvidia-docker2
   sudo systemctl restart docker
   
   # Windows with WSL2
   # Make sure you have NVIDIA Container Toolkit installed
   ```

2. **NVIDIA Drivers**: Ensure NVIDIA drivers are installed on the host system

3. **Docker Compose**: Version 3.8 or higher with GPU support

## Configuration

### Environment Variables (.env)

- `OLLAMA_MODELS`: Comma-separated list of models to pull on startup
- `OLLAMA_HOST`: Host and port binding (default: 0.0.0.0:11434)
- `OLLAMA_GPU_MEMORY_FRACTION`: GPU memory allocation (0.8 = 80%)
- `OLLAMA_NUM_PARALLEL`: Number of parallel requests
- `OLLAMA_MAX_LOADED_MODELS`: Maximum models to keep in memory

### GPU Memory Requirements

| Model | VRAM Required |
|-------|---------------|
| qwen2.5vl:latest | ~8GB |
| llama3.2-vision:latest | ~12GB |
| llama3.2:3b | ~4GB |

## Usage

1. **Start with Docker Compose** (from root directory):
   ```bash
   docker-compose up ollama-gpu -d
   ```

2. **Check logs**:
   ```bash
   docker-compose logs -f ollama-gpu
   ```

3. **Test the service**:
   ```bash
   curl http://localhost:11434/api/tags
   ```

4. **Pull additional models**:
   ```bash
   docker-compose exec ollama-gpu ollama pull llama3.2:3b
   ```

## API Endpoints

- **Health Check**: `GET http://localhost:11434/api/tags`
- **Generate**: `POST http://localhost:11434/api/generate`
- **Chat**: `POST http://localhost:11434/api/chat`

## Troubleshooting

1. **GPU not detected**:
   ```bash
   docker-compose exec ollama-gpu nvidia-smi
   ```

2. **Memory issues**:
   - Reduce `OLLAMA_GPU_MEMORY_FRACTION`
   - Reduce `OLLAMA_MAX_LOADED_MODELS`

3. **Model loading issues**:
   - Check available disk space in volume
   - Verify model names are correct
