# WebAuthn TLS Error - Immediate Localhost Fix

## Problem
```
NotAllowedError: WebAuthn is not supported on sites with TLS certificate errors.
```

## Root Cause
WebAuthn requires a secure context. Browsers only allow WebAuthn on:
1. **Valid HTTPS** (with trusted certificates)
2. **Localhost** (HTTP or HTTPS, even with self-signed certificates)

## ✅ IMMEDIATE SOLUTION: Use Localhost

### Step 1: Access via Localhost URL
Change your browser URL from:
```
❌ https://192.168.1.100        (fails - IP with self-signed cert)
❌ https://formbt.com         (fails - custom domain with self-signed cert)
```

To:
```
✅ http://localhost             (works - localhost HTTP)
✅ https://localhost            (works - localhost HTTPS, accept cert warning)
```

### Step 2: Update Port Mapping (if needed)
Ensure your docker-compose.ssl.yml has the correct port mapping:

```yaml
services:
  dynaform:
    ports:
      - "80:80"     # HTTP access
      - "443:443"   # HTTPS access
```

### Step 3: Test WebAuthn
1. Open browser to `http://localhost` or `https://localhost`
2. If using HTTPS, accept the certificate warning once
3. Try passkey registration/authentication
4. WebAuthn should now work without errors!

## Why This Works
- Browsers treat `localhost` as a secure context for development
- WebAuthn is allowed on localhost even with self-signed certificates
- No certificate validation errors occur on localhost

## Production Deployment
For production, you'll need valid SSL certificates:

### Option A: Let's Encrypt (Free)
```bash
# Get free SSL certificates
docker compose -f docker-compose.ssl.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@domain.com \
  --agree-tos \
  -d yourdomain.com
```

### Option B: Cloudflare SSL
1. Use Cloudflare for DNS
2. Enable "Full (strict)" SSL mode
3. Use Cloudflare origin certificates

### Environment Variables for Production
Update your `.env` file:
```bash
# Production settings
RP_ID=yourdomain.com
WEBAUTHN_ORIGIN=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

## Summary
- **Development**: Always use `http://localhost` or `https://localhost`
- **Production**: Get valid SSL certificates for your domain
- **Never**: Use IP addresses or self-signed certs with custom domains for WebAuthn
