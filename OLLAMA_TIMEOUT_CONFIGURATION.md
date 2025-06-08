# Ollama Timeout Configuration Guide

## Overview

This document outlines the timeout configuration for Ollama services across the Doc2FormJSON application ecosystem. Proper timeout configuration ensures reliable AI processing without premature request cancellations.

## Configuration Summary

| Component | Setting | Current Value | Purpose |
|-----------|---------|---------------|---------|
| AI Agent | `OLLAMA_TIMEOUT` | 1200s (20 min) | HTTP request timeout |
| AI Agent | `OLLAMA_KEEP_ALIVE` | 15m | Model memory retention |
| Server | `OLLAMA_TIMEOUT_MS` | 180000ms (3 min) | HTTP request timeout |
| Server | `OLLAMA_KEEP_ALIVE` | 7200s (2 hours) | Model memory retention |

## Configuration Files

### 1. AI Agent Configuration

**File:** `ai-agent/.env`

```properties
# Ollama Configuration
OLLAMA_HOST=http://134.122.45.17:11434
OLLAMA_MODEL=qwen2.5vl:latest
OLLAMA_KEEP_ALIVE=15m
OLLAMA_TIMEOUT=1200
```

**Implementation:** `ai-agent/config.py`

```python
# Ollama Configuration
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')
OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', 300))  # Default 5 minutes
OLLAMA_KEEP_ALIVE = os.getenv('OLLAMA_KEEP_ALIVE', '5m')
```

**Usage:** `ai-agent/ollama_service.py`

```python
class OllamaService:
    def __init__(self):
        # Set timeout for Ollama requests (configurable via environment)
        self.timeout = aiohttp.ClientTimeout(total=config.OLLAMA_TIMEOUT)
        self.keep_alive = config.OLLAMA_KEEP_ALIVE
```

### 2. Server Configuration

**File:** `server/.env`

```properties
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11435
OLLAMA_KEEP_ALIVE=7200s
OLLAMA_TIMEOUT_MS=180000
DEFAULT_QWEN_MODEL_NAME=qwen2.5vl:latest
DEEPSEEK_MODEL_NAME=gemma3:4b
```

**Implementation:** `server/src/config/index.ts`

```typescript
// Ollama Timeout Configuration
get OLLAMA_TIMEOUT_MS() {
  return parseInt(process.env.OLLAMA_TIMEOUT_MS || '180000', 10); // Default 3 minutes
},
```

**Usage:** `server/src/services/ollamaService.ts`

```typescript
// Create AbortController for timeout handling
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), config.OLLAMA_TIMEOUT_MS);
```

## Timeout Values Explained

### Request Timeouts

- **AI Agent**: 20 minutes (1200 seconds)
  - Handles complex document processing and blockchain publishing
  - Allows for extensive AI reasoning and form generation

- **Server**: 3 minutes (180 seconds)  
  - Handles image description and quick AI responses
  - Shorter timeout for responsive web API

### Keep-Alive Durations

- **AI Agent**: 15 minutes
  - Balances memory usage with performance
  - Suitable for intermittent document processing

- **Server**: 2 hours (7200 seconds)
  - Keeps models loaded for frequent web requests
  - Optimizes response time for user interactions

## Adjusting Timeouts

### For Development/Testing

**Shorter timeouts for faster feedback:**

```properties
# AI Agent
OLLAMA_TIMEOUT=300      # 5 minutes
OLLAMA_KEEP_ALIVE=5m

# Server  
OLLAMA_TIMEOUT_MS=60000 # 1 minute
OLLAMA_KEEP_ALIVE=1800s # 30 minutes
```

### For Production/Heavy Processing

**Longer timeouts for complex operations:**

```properties
# AI Agent
OLLAMA_TIMEOUT=3600     # 1 hour
OLLAMA_KEEP_ALIVE=30m

# Server
OLLAMA_TIMEOUT_MS=600000 # 10 minutes
OLLAMA_KEEP_ALIVE=14400s # 4 hours
```

## Common Timeout Scenarios

### 1. Document Processing Timeouts

**Symptoms:**
- AI agent fails during form generation
- "Request timeout" errors in logs

**Solutions:**
- Increase `OLLAMA_TIMEOUT` in AI agent
- Consider document complexity and size

### 2. Image Description Timeouts

**Symptoms:**
- Web API returns 408 timeout errors
- Image processing fails in browser

**Solutions:**
- Increase `OLLAMA_TIMEOUT_MS` in server config
- Optimize image size before processing

### 3. Model Loading Delays

**Symptoms:**
- First requests after idle time are slow
- "Model not loaded" errors

**Solutions:**
- Increase `OLLAMA_KEEP_ALIVE` values
- Pre-warm models on startup

## Monitoring and Debugging

### Log Messages to Watch

**Timeout Indicators:**
```
Ollama request timed out after 180000ms
AbortError: The operation was aborted
Connection to Ollama service timed out
```

**Keep-Alive Indicators:**
```
Model unloaded due to inactivity
Loading model qwen2.5vl:latest
Model loaded successfully
```

### Health Check Endpoints

**AI Agent Status:**
```bash
curl http://localhost:8001/health
```

**Server Ollama Status:**
```bash
curl http://localhost:3000/api/healthcheck
```

## Best Practices

### 1. Environment-Specific Configuration

- **Development**: Shorter timeouts for quick feedback
- **Staging**: Production-like timeouts for realistic testing  
- **Production**: Conservative timeouts with monitoring

### 2. Resource Monitoring

- Monitor memory usage with long keep-alive values
- Track request duration vs timeout settings
- Set up alerts for frequent timeout errors

### 3. Graceful Degradation

- Implement retry logic for timeout scenarios
- Provide user feedback during long operations
- Cache results to avoid repeated processing

## Troubleshooting

### Timeout Too Short

**Problem:** Legitimate requests timing out
**Solution:** Increase timeout values gradually
**Test:** Monitor success rate after changes

### Timeout Too Long

**Problem:** Hung requests consuming resources
**Solution:** Decrease timeout values
**Monitor:** Resource usage and response times

### Keep-Alive Too Short

**Problem:** Frequent model reloading
**Solution:** Increase keep-alive duration
**Benefit:** Faster subsequent requests

### Keep-Alive Too Long

**Problem:** High memory usage
**Solution:** Decrease keep-alive duration
**Balance:** Performance vs resource usage

## Configuration History

| Date | Component | Change | Reason |
|------|-----------|--------|--------|
| 2025-06-08 | AI Agent | Timeout: 600s → 1200s | Handle complex processing |
| 2025-06-08 | AI Agent | Keep-alive: 10m → 15m | Better model retention |
| 2025-06-08 | Server | Keep-alive: 5000s → 7200s | Improved web performance |
| 2025-06-08 | Server | Added configurable timeout | Environment flexibility |

## Related Documentation

- [Ollama Documentation](https://ollama.ai/docs)
- [AI Agent README](./ai-agent/README.md)
- [Server Configuration Guide](./server/README.md)
- [Docker Compose Configuration](./docker-compose.yml)
