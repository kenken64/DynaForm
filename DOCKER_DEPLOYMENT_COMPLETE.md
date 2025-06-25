# Docker Deployment - Complete Implementation

## Overview
This document describes the complete Docker deployment setup for DynaForm with AI Agent and Verifiable URL Contract services. All services are now properly containerized with correct service dependencies, networking, and environment configurations.

## Architecture

### Services
1. **MongoDB** - Database service
2. **Redis** - Caching service  
3. **Ollama-GPU** - AI model service
4. **Doc2FormJSON API** - Main backend API
5. **AI Agent** - Form processing agent (interceptor/server/chat modes)
6. **Verifiable Contract** - Blockchain contract service
7. **DynaForm Frontend** - Angular frontend
8. **Nginx** - SSL reverse proxy

### Service Dependencies
```
nginx
├── doc2formjson-api
│   ├── mongodb
│   ├── redis
│   └── ollama-gpu
├── ai-agent
│   ├── doc2formjson-api
│   ├── verifiable-contract
│   ├── mongodb
│   ├── ollama-gpu
│   └── redis
├── verifiable-contract
├── dynaform-frontend
└── ollama-gpu
```

## Key Files

### Docker Configurations
- `docker-compose.ssl.yml` - Main SSL-enabled compose file
- `ai-agent/Dockerfile` - AI agent container
- `verifiable-url-contract/Dockerfile` - Contract service container
- `ai-agent/docker-entrypoint.sh` - AI agent startup script

### Environment Files (Docker Service Names)
- `.env` - Root environment file
- `server/.env` - Backend API environment
- `ai-agent/.env` - AI agent environment
- `verifiable-url-contract/.env` - Contract service environment

## Environment Configuration

### Service Names for Docker Networking
All `.env` files have been updated to use Docker service names for inter-container communication:

- **MongoDB**: `mongodb` (instead of localhost)
- **Redis**: `redis` (instead of localhost)
- **Ollama**: `ollama-gpu` (instead of localhost)
- **Verifiable Contract**: `verifiable-contract` (instead of localhost)

### Key Environment Variables

#### AI Agent (.env)
```bash
MONGODB_URI=mongodb://doc2formapp:apppassword123@mongodb:27017/doc2formjson?authSource=admin
OLLAMA_HOST=http://ollama-gpu:11434
VERIFIABLE_CONTRACT_API=http://verifiable-contract:3002/api/urls
```

#### Server (.env)
```bash
MONGODB_URI=mongodb://doc2formapp:apppassword123@mongodb:27017/doc2formjson?authSource=admin
REDIS_HOST=redis
OLLAMA_BASE_URL=http://ollama-gpu:11434
```

## Deployment

### Quick Start
```bash
# Deploy all services with SSL
./deploy-ssl.sh

# Or restart existing services
./restart-ssl-services.sh
```

### Manual Deployment
```bash
# Start core services first
docker-compose -f docker-compose.ssl.yml up -d mongodb redis ollama-gpu

# Wait for core services to be ready
sleep 30

# Start main API
docker-compose -f docker-compose.ssl.yml up -d doc2formjson-api

# Wait for API to be ready
sleep 20

# Start dependent services
docker-compose -f docker-compose.ssl.yml up -d verifiable-contract ai-agent

# Start frontend and proxy
docker-compose -f docker-compose.ssl.yml up -d dynaform-frontend nginx
```

## AI Agent Modes

The AI agent can run in different modes via the `AI_AGENT_MODE` environment variable:

- **interceptor** (default) - Real-time form monitoring
- **server** - HTTP API server mode
- **chat** - Interactive chat mode
- **test** - Testing mode

### Running AI Agent in Server Mode
```bash
# Add ai-agent-server profile
docker-compose -f docker-compose.ssl.yml --profile ai-agent-server up -d
```

## Health Checks and Monitoring

### AI Agent Health Checks
The AI agent performs connectivity checks on startup:
- MongoDB connection
- Ollama service availability
- Verifiable Contract API availability

### Service Readiness
All services include proper health checks and dependency management through `depends_on` configuration.

## Troubleshooting

### Common Issues

1. **Service Connection Failures**
   - Verify all `.env` files use Docker service names (not localhost)
   - Check service startup order and dependencies
   - Ensure all services are in the same Docker network

2. **AI Agent Startup Issues**
   - Check logs: `docker-compose -f docker-compose.ssl.yml logs ai-agent`
   - Verify dependent services are healthy
   - Check environment variable configuration

3. **Network Connectivity**
   - All services use the default Docker network
   - Inter-service communication uses service names
   - External access through nginx proxy

### Logging
```bash
# View all service logs
docker-compose -f docker-compose.ssl.yml logs

# View specific service logs
docker-compose -f docker-compose.ssl.yml logs ai-agent
docker-compose -f docker-compose.ssl.yml logs doc2formjson-api
```

## Production Considerations

### Security
- All secrets should be moved to Docker secrets or external secret management
- MongoDB and Redis should use authentication
- SSL certificates should be properly managed

### Performance
- AI agent can be scaled horizontally if needed
- Redis provides caching for improved performance
- Ollama GPU service handles AI model inference

### Monitoring
- Consider adding health check endpoints for all services
- Implement proper logging aggregation
- Monitor resource usage and performance metrics

## Next Steps

1. **Testing**: Perform end-to-end testing of the complete stack
2. **Monitoring**: Add comprehensive monitoring and alerting
3. **Scaling**: Implement horizontal scaling for high-load scenarios
4. **Security**: Enhance security with proper secret management
5. **CI/CD**: Set up automated deployment pipelines

## Service URLs (Internal Docker Network)

- MongoDB: `mongodb:27017`
- Redis: `redis:6379`
- Ollama: `ollama-gpu:11434`
- Doc2FormJSON API: `doc2formjson-api:3000`
- AI Agent: `ai-agent:8001`
- Verifiable Contract: `verifiable-contract:3002`
- Frontend: `dynaform-frontend:4200`

## External Access (via nginx proxy)

- Frontend: `https://your-domain.com`
- API: `https://your-domain.com/api`
- AI Agent: `https://your-domain.com/ai` (if enabled)

---

**Status**: ✅ Complete - All services containerized with proper dependencies and networking
**Last Updated**: $(date)
