# DynaForm SSL Deployment with AI Agent and Verifiable Contract

This document describes the complete containerized setup for DynaForm with SSL support, including the AI Agent and Verifiable URL Contract services.

## Services Overview

The SSL deployment includes the following services:

### Core Services
- **MongoDB**: Database for form storage and user data
- **Redis**: Caching and session storage
- **Ollama GPU**: LLM inference service for form processing

### Application Services
- **DynaForm API** (port 3000): Main Node.js API server
- **PDF Converter** (port 5001): Python Flask service for PDF to PNG conversion
- **AI Agent** (port 8001): Python FastAPI service for form processing and publishing
- **Verifiable Contract** (port 3002): Node.js service for blockchain integration

### Infrastructure Services
- **Nginx**: Reverse proxy with SSL/HTTPS support
- **Certbot**: Let's Encrypt SSL certificate management

## Prerequisites

1. **Docker and Docker Compose** installed
2. **Domain name** pointing to your server
3. **Firewall** configured to allow ports 80 and 443

## Environment Configuration

### Required Environment Variables

Create a `.env.ssl` file or set these environment variables:

```bash
# SSL/Domain Configuration
DOMAIN_NAME=your-domain.com
SSL_EMAIL=your-email@domain.com

# Blockchain Configuration (optional, defaults provided)
BLOCKCHAIN_PRIVATE_KEY=0x0386d60f46138cc1b2ec00b047dce71815fb28eb64b85f8ed7109fb5e17ebe84
BLOCKCHAIN_CONTRACT_ADDRESS=0xC9C3Ef2Dc05f4f142F0180ae95E1606698311576
BLOCKCHAIN_PROVIDER_URL=https://eth-sepolia.g.alchemy.com/v2/E4mBYdLyTQiGitVF-HhKH
```

### Service Configuration

Each service has its own configuration:

#### AI Agent Configuration
- **MongoDB**: Connects to containerized MongoDB
- **Ollama**: Uses the ollama-gpu service
- **Verifiable Contract**: Connects to verifiable-contract service
- **Frontend URL**: Uses the SSL domain for frontend links

#### Verifiable Contract Configuration
- **Blockchain**: Ethereum Sepolia testnet
- **Port**: 3002
- **API Endpoints**: `/api/urls`, `/api/verify`, `/api/status`

## Deployment

### Automated Deployment

Use the provided deployment script:

```bash
# Set required environment variables
export DOMAIN_NAME=yourdomain.com
export SSL_EMAIL=admin@yourdomain.com

# Run deployment
./deploy-ssl.sh
```

### Manual Deployment

1. **Build and start services:**
   ```bash
   docker compose -f docker-compose.ssl.yml up -d --build
   ```

2. **Obtain SSL certificates:**
   ```bash
   docker compose -f docker-compose.ssl.yml run --rm certbot certonly \
     --webroot --webroot-path=/var/www/certbot \
     --email your-email@domain.com --agree-tos --no-eff-email \
     -d your-domain.com
   ```

3. **Restart Nginx to use SSL certificates:**
   ```bash
   docker compose -f docker-compose.ssl.yml restart dynaform-nginx
   ```

## Service URLs

After deployment, services are available at:

- **Frontend**: `https://your-domain.com`
- **API**: `https://your-domain.com/api`
- **AI Agent**: `http://localhost:8001` (internal)
- **Verifiable Contract**: `http://localhost:3002` (internal)
- **PDF Converter**: `http://localhost:5001` (internal)

## Health Checks

All services include health checks:

```bash
# Check service status
docker compose -f docker-compose.ssl.yml ps

# Check specific service health
curl http://localhost:8001/health      # AI Agent
curl http://localhost:3002/api/health  # Verifiable Contract
curl http://localhost:3000/health      # Main API
```

## Monitoring and Logs

### View logs
```bash
# All services
docker compose -f docker-compose.ssl.yml logs -f

# Specific service
docker compose -f docker-compose.ssl.yml logs -f ai-agent
docker compose -f docker-compose.ssl.yml logs -f verifiable-contract
```

### Service status
```bash
docker compose -f docker-compose.ssl.yml ps
```

## SSL Certificate Management

### Automatic Renewal
Certificates are automatically renewed by the certbot service.

### Manual Renewal
```bash
docker compose -f docker-compose.ssl.yml run --rm certbot renew
docker compose -f docker-compose.ssl.yml restart dynaform-nginx
```

## Volume Management

The setup uses the following persistent volumes:

- `mongodb_data_ssl`: MongoDB data
- `mongodb_logs_ssl`: MongoDB logs
- `redis_data_ssl`: Redis data
- `ollama_models_ssl`: Ollama models
- `certbot_certs`: SSL certificates
- `generated_images_ssl`: Generated PNG files

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   - Ensure domain points to your server
   - Check firewall allows ports 80/443
   - Verify DNS propagation

2. **Service Connection Issues**
   - Check service health endpoints
   - Verify environment variables
   - Check Docker network connectivity

3. **AI Agent Issues**
   - Ensure Ollama service is running
   - Check MongoDB connection
   - Verify Python dependencies

4. **Blockchain Issues**
   - Check blockchain provider URL
   - Verify private key and contract address
   - Ensure network connectivity

### Debug Commands

```bash
# Check service connectivity
docker compose -f docker-compose.ssl.yml exec ai-agent ping mongodb
docker compose -f docker-compose.ssl.yml exec ai-agent ping ollama-gpu

# Check environment variables
docker compose -f docker-compose.ssl.yml exec ai-agent env

# Access service shell
docker compose -f docker-compose.ssl.yml exec ai-agent /bin/bash
docker compose -f docker-compose.ssl.yml exec verifiable-contract /bin/sh
```

## Security Considerations

1. **Environment Variables**: Store sensitive data in `.env` files, not in docker-compose.yml
2. **Network Security**: Services communicate over internal Docker network
3. **SSL/TLS**: All external traffic uses HTTPS
4. **Blockchain Keys**: Use secure key management for production

## Scaling and Production

For production deployment:

1. Use external MongoDB and Redis instances
2. Implement proper logging and monitoring
3. Set up backup strategies for volumes
4. Use container orchestration (Kubernetes)
5. Implement CI/CD pipelines
6. Use secure key management systems

## API Documentation

### AI Agent API
- **Health**: `GET /health`
- **Process Form**: `POST /process`
- **Status**: `GET /status`

### Verifiable Contract API
- **Health**: `GET /api/health`
- **Add URL**: `POST /api/urls`
- **Verify URL**: `GET /api/verify`
- **Contract Status**: `GET /api/status`

## Support

For issues and questions:
1. Check service logs
2. Verify configuration
3. Test health endpoints
4. Review documentation
