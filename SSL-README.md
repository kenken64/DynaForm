# DynaForm SSL/HTTPS Setup

This directory contains the SSL/HTTPS configuration for DynaForm using Let's Encrypt certificates and nginx as a reverse proxy.

## 🚀 Quick Start

### For Development (localhost with self-signed certificate)
```bash
./setup-ssl.sh
```

### For Production (with real domain and Let's Encrypt)
```bash
./setup-ssl.sh yourdomain.com your-email@domain.com
```

## 📋 Prerequisites

1. **Docker and Docker Compose** installed
2. **Domain name** pointed to your server (for production)
3. **Ports 80 and 443** available
4. **Root privileges or Docker group membership**

## 🏗️ Architecture

```
Internet
    ↓
[Nginx Proxy with SSL]
    ↓
┌─────────────────────────────────────┐
│  Docker Network (SSL)              │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  │
│  │  Angular    │  │    API      │  │
│  │  Frontend   │  │   Service   │  │
│  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  │
│  │    PDF      │  │  MongoDB    │  │
│  │ Converter   │  │  Database   │  │
│  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  │
│  │   Ollama    │  │  Certbot    │  │
│  │    LLM      │  │ SSL Certs   │  │
│  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────┘
```

## 📁 File Structure

```
.
├── docker-compose.ssl.yml          # SSL-enabled Docker Compose
├── setup-ssl.sh                    # Automated setup script
├── renew-certificates.sh           # Certificate renewal script
├── .env.ssl                        # Environment configuration
└── dynaform/
    ├── nginx.ssl.conf              # SSL nginx configuration
    ├── Dockerfile.ssl              # SSL-enabled Dockerfile
    └── nginx.conf                  # Original nginx config
```

## 🔧 Configuration Files

### docker-compose.ssl.yml
- SSL-enabled version of the main docker-compose file
- Includes Certbot service for Let's Encrypt
- Configures nginx with SSL support
- Separate network and volumes for SSL setup

### nginx.ssl.conf
- Complete nginx configuration with SSL support
- HTTP to HTTPS redirects
- Let's Encrypt ACME challenge handling
- Security headers and rate limiting
- Reverse proxy configuration for all services

### Dockerfile.ssl
- Multi-stage build for Angular application
- nginx with SSL certificate support
- Self-signed certificate generation for fallback
- Automatic certificate detection and configuration

## 🛠️ Manual Setup

If you prefer manual setup instead of using the script:

### 1. Create Environment File
```bash
cp .env.example .env.ssl
# Edit .env.ssl with your domain and email
```

### 2. Build Services
```bash
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl build
```

### 3. Obtain SSL Certificates (Production)
```bash
# Start nginx for ACME challenge
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl up -d dynaform-nginx

# Request certificate
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  --email your-email@domain.com --agree-tos --no-eff-email -d your-domain.com

# Restart nginx with new certificates
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl restart dynaform-nginx
```

### 4. Start All Services
```bash
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl up -d
```

## 🔐 SSL Certificate Management

### Automatic Renewal
The setup includes automatic certificate renewal:

```bash
# Manual renewal
./renew-certificates.sh

# Add to crontab for automatic renewal
0 3 * * * /path/to/your/project/renew-certificates.sh
```

### Certificate Locations
- **Let's Encrypt certificates**: `/etc/letsencrypt/live/yourdomain.com/`
- **Self-signed certificates**: `/etc/ssl/certs/nginx-selfsigned.crt`

## 🌐 Access URLs

After setup, your application will be available at:

- **HTTPS**: `https://yourdomain.com` (or `https://localhost`)
- **HTTP**: Redirects to HTTPS automatically
- **API**: `https://yourdomain.com/api/`
- **PDF Conversion**: `https://yourdomain.com/conversion/`
- **Health Check**: `https://yourdomain.com/health`

## 🔍 Monitoring and Logs

### View All Logs
```bash
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl logs -f
```

### View Specific Service Logs
```bash
# Nginx logs
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl logs -f dynaform-nginx

# API logs
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl logs -f doc2formjson-api

# Certbot logs
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl logs -f certbot
```

### Service Status
```bash
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl ps
```

## 🛡️ Security Features

### SSL/TLS Configuration
- **TLS 1.2 and 1.3** support
- **Strong cipher suites**
- **HSTS headers** for security
- **SSL session caching**
- **OCSP stapling**

### Security Headers
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Content-Security-Policy`

### Rate Limiting
- **API endpoints**: 10 requests/second
- **Authentication**: 5 requests/minute
- **Burst handling** for legitimate traffic

## 🚨 Troubleshooting

### Common Issues

#### 1. Certificate Not Found
```bash
# Check certificate status
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot certificates

# Re-obtain certificate
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  --email your-email@domain.com --agree-tos --no-eff-email -d your-domain.com --force-renewal
```

#### 2. nginx Configuration Error
```bash
# Test nginx configuration
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl exec dynaform-nginx nginx -t

# Reload nginx
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl exec dynaform-nginx nginx -s reload
```

#### 3. Port 443 Already in Use
```bash
# Check what's using port 443
sudo lsof -i :443

# Stop conflicting services
sudo systemctl stop apache2  # or nginx, etc.
```

#### 4. Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Debug Mode
For debugging, you can run services individually:

```bash
# Start only nginx
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl up dynaform-nginx

# Start only certbot
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl up certbot
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl down
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl build --no-cache
docker-compose -f docker-compose.ssl.yml --env-file .env.ssl up -d
```

### Backup Certificates
```bash
# Backup Let's Encrypt certificates
docker run --rm -v dynaform_certbot_certs:/data -v $(pwd):/backup alpine \
  tar czf /backup/certificates-$(date +%Y%m%d).tar.gz -C /data .
```

## 📞 Support

For issues and questions:
1. Check the logs first
2. Review the troubleshooting section
3. Check Docker and nginx documentation
4. Verify DNS settings for your domain

## 🔒 Production Checklist

Before deploying to production:

- [ ] Domain DNS points to your server
- [ ] Firewall allows ports 80 and 443
- [ ] Valid email address for Let's Encrypt
- [ ] Regular backup strategy in place
- [ ] Certificate renewal automation configured
- [ ] Monitoring and alerting set up
- [ ] Security headers verified
- [ ] SSL configuration tested with SSL Labs
