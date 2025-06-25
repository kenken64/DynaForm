# CSP and API Connection Debug Guide

## Issue Summary
Angular frontend is trying to connect to `http://localhost:3000/api/auth/passkey/authenticate/begin` instead of using relative URLs through nginx proxy.

## Root Cause Analysis

### 1. Access Method Issue
The problem occurs when users access the application directly on port 3000 (API port) instead of through nginx (ports 80/443).

### 2. CSP Configuration
Content Security Policy needs to allow proper API connections and external resources.

## Solution Applied

### 1. Port Configuration Fix
```yaml
# In docker-compose.ssl.yml - API service
# Commented out external port exposure to force traffic through nginx
# ports:
#   - "3000:3000"
```

### 2. CSP Headers Updated
```nginx
# In nginx.ssl.conf
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws: wss:;" always;
```

### 3. Angular Services Fixed
All services use relative URLs:
```typescript
private apiUrl = '/api'; // Relative URL that goes through nginx proxy
```

### 4. Angular Build Path Fixed
```dockerfile
# In Dockerfile.ssl - correct path for Angular 18+
COPY --from=builder /app/dist/dynaform/browser /usr/share/nginx/html
```

## Deployment Instructions

### 1. Rebuild and Deploy
```bash
# Rebuild the nginx service with fixes
docker-compose -f docker-compose.ssl.yml build --no-cache dynaform-nginx

# Stop and restart all services
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml up -d
```

### 2. Correct Access URLs
- ✅ **CORRECT**: `https://localhost` or `http://localhost` (through nginx)
- ❌ **WRONG**: `http://localhost:3000` (direct API access)

### 3. Service Flow
```
Browser Request
    ↓
nginx:80/443 (SSL + Static Files)
    ├── / → Angular SPA files
    ├── /api/ → doc2formjson-api:3000 (internal)
    └── /conversion/ → pdf-converter:5001 (internal)
```

## Verification Steps

### 1. Check Container Status
```bash
docker-compose -f docker-compose.ssl.yml ps
```

### 2. Check nginx Logs
```bash
docker-compose -f docker-compose.ssl.yml logs dynaform-nginx
```

### 3. Test API Proxy
```bash
# Should return API response
curl -k https://localhost/api/health
```

### 4. Browser Developer Tools
- Network tab should show requests to `/api/...` (relative URLs)
- No CSP violations in Console
- No blocked requests

## Troubleshooting

### If still getting localhost:3000 errors:
1. **Clear browser cache** completely
2. **Verify accessing correct URL** (nginx ports, not API port)
3. **Check nginx is running** and healthy
4. **Verify Angular build** includes the fixes

### If CSP errors persist:
1. **Check nginx.ssl.conf** is properly mounted in container
2. **Verify nginx restart** after config changes
3. **Test with browser dev tools** to see actual headers

### If Angular app doesn't load:
1. **Check Angular build path** in Dockerfile.ssl
2. **Verify static files** are in `/usr/share/nginx/html`
3. **Check nginx configuration** for proper serving

## Expected Behavior After Fix
- ✅ Angular app loads from nginx
- ✅ Google Fonts load without CSP errors  
- ✅ API calls work through nginx proxy (relative URLs)
- ✅ No "Refused to connect" errors
- ✅ Passkey authentication works properly

## Key Files Modified
- `docker-compose.ssl.yml` - Removed API port exposure
- `dynaform/nginx.ssl.conf` - Updated CSP headers
- `dynaform/Dockerfile.ssl` - Fixed Angular build path
- Angular service files - Ensured relative URLs
