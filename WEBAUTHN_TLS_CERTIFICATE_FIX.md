# WebAuthn TLS Certificate Error Resolution

## Issue Summary
```
NotAllowedError: WebAuthn is not supported on sites with TLS certificate errors.
```

**Root Cause**: WebAuthn requires either:
1. Valid HTTPS with trusted SSL certificates, OR
2. Access via localhost (HTTP or HTTPS)

## Current Problem
The application is being accessed with self-signed SSL certificates that browsers don't trust for WebAuthn operations.

## Solution Options

### Option 1: Use Localhost for Development ✅ RECOMMENDED FOR DEV
Access the application via localhost instead of IP addresses or custom domains:

```bash
# ✅ WORKS: Access via localhost
http://localhost
https://localhost  (accept certificate warning once)

# ❌ FAILS: Access via IP or custom domain with self-signed certs
https://192.168.1.100
https://formbt.com (with self-signed certs)
```

**Steps:**
1. Update your browser to access: `http://localhost` or `https://localhost`
2. If using HTTPS, accept the certificate warning once
3. WebAuthn will work on localhost even with self-signed certificates

### Option 2: Get Valid SSL Certificates (Production)

#### A. Using Let's Encrypt (Free, Automated)
```bash
# 1. Update domain in docker-compose.ssl.yml
DOMAIN_NAME=yourdomain.com
SSL_EMAIL=your-email@domain.com

# 2. Get certificates using certbot
docker compose -f docker-compose.ssl.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@domain.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com

# 3. Restart nginx to use the new certificates
docker compose -f docker-compose.ssl.yml restart dynaform-nginx
```

#### B. Using Cloudflare (Recommended for Production)
1. Point your domain to Cloudflare
2. Enable "Full (strict)" SSL mode
3. Use Cloudflare's SSL certificates
4. Update nginx to use Cloudflare's origin certificates

### Option 3: Disable HTTPS for Development
For development only, you can access via HTTP:

```bash
# Access via HTTP (no SSL issues)
http://localhost
```

**Update WebAuthn configuration for HTTP:**
```typescript
// In server/.env for development
WEBAUTHN_ORIGIN=http://localhost:4200
RP_ID=localhost
```

## Quick Fix for Immediate Testing

### Step 1: Access via Localhost
Instead of accessing the app via IP or custom domain, use:
- `http://localhost` (if running on port 80)
- `http://localhost:4200` (if running Angular dev server)

### Step 2: Update Environment Variables
Ensure the server configuration uses localhost:

```bash
# In docker-compose.ssl.yml, update these environment variables:
- RP_ID=localhost
- WEBAUTHN_ORIGIN=https://localhost  # or http://localhost for HTTP
- CORS_ORIGIN=https://localhost,http://localhost
```

### Step 3: Restart Services
```bash
docker compose -f docker-compose.ssl.yml down
docker compose -f docker-compose.ssl.yml up -d
```

## Browser Certificate Acceptance

If using HTTPS with self-signed certificates on localhost:

### Chrome/Edge:
1. Navigate to `https://localhost`
2. Click "Advanced"
3. Click "Proceed to localhost (unsafe)"
4. WebAuthn will now work

### Firefox:
1. Navigate to `https://localhost`
2. Click "Advanced"
3. Click "Accept the Risk and Continue"
4. WebAuthn will now work

### Safari:
1. Navigate to `https://localhost`
2. Click "Show Details"
3. Click "visit this website"
4. WebAuthn will now work

## Production Deployment Checklist

For production deployment with proper SSL:

- [ ] Domain points to your server
- [ ] DNS records are configured
- [ ] Firewall allows ports 80/443
- [ ] Let's Encrypt certificates obtained
- [ ] Nginx configured with valid certificates
- [ ] WebAuthn environment variables updated with production domain
- [ ] CORS configured for production domain

## Verification Steps

### 1. Check SSL Certificate
```bash
# Check certificate validity
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### 2. Test WebAuthn Support
```javascript
// In browser console
if (window.PublicKeyCredential) {
  console.log('WebAuthn supported');
} else {
  console.log('WebAuthn not supported');
}
```

### 3. Check Browser Security
- Open Developer Tools → Security tab
- Verify "Secure" connection status
- Look for certificate warnings

## Common Issues

### "NET::ERR_CERT_AUTHORITY_INVALID"
- **Cause**: Self-signed certificate
- **Solution**: Use localhost or get valid SSL certificate

### "NET::ERR_CERT_COMMON_NAME_INVALID"
- **Cause**: Certificate doesn't match domain
- **Solution**: Generate certificate for correct domain

### "This site can't be reached"
- **Cause**: Firewall or network issues
- **Solution**: Check port 443 is open and accessible

## Environment Variable Reference

### Development (Localhost)
```env
RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:4200
CORS_ORIGIN=http://localhost:4200,http://localhost
```

### Production (Valid SSL)
```env
RP_ID=yourdomain.com
WEBAUTHN_ORIGIN=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

## Immediate Action Required

**For immediate testing, use localhost:**
1. Access the app via `http://localhost` or `https://localhost`
2. Accept any certificate warnings (one-time)
3. WebAuthn should work immediately

**For production deployment:**
1. Set up proper domain with valid SSL certificates
2. Update environment variables to match your domain
3. Test WebAuthn functionality
