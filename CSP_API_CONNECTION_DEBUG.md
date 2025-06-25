# CSP and API Connection Debug Guide

## Issue Summary ✅ RESOLVED
~~Angular frontend is trying to connect to `http://localhost:3000/api/auth/passkey/authenticate/begin` instead of using relative URLs through nginx proxy.~~

**RESOLUTION**: The issue was caused by stale build cache from a previous version of the auth service that had hardcoded `localhost:3000`. After clearing the cache and rebuilding the Angular application, all services now correctly use relative URLs (`/api`).

## Root Cause Analysis

### 1. ✅ Stale Build Cache (PRIMARY CAUSE)
The main issue was that the compiled JavaScript in the `dist` folder contained hardcoded `http://localhost:3000/api` from an older version of the auth service, even though the current TypeScript source files correctly use relative URLs (`/api`).

### 2. Access Method Issue
The problem can occur when users access the application directly on port 3000 (API port) instead of through nginx (ports 80/443).

### 3. CSP Configuration
Content Security Policy needs to allow proper API connections and external resources.

## Solution Applied ✅ COMPLETE

### 1. ✅ Build Cache Resolution (CRITICAL FIX)
```bash
# Clear Angular build cache and dist folder
cd dynaform
rm -rf dist/ && rm -rf .angular/cache/
npm run build -- --configuration=production
```

**Result**: After clearing cache and rebuilding, the new build no longer contains hardcoded `localhost:3000` URLs and correctly uses relative URLs.

### 2. ✅ Port Configuration Fix
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

## Deployment Instructions ✅ UPDATED

### 1. ✅ Clear Cache and Rebuild (REQUIRED STEP)
```bash
# Clear Angular build cache
cd dynaform
rm -rf dist/ && rm -rf .angular/cache/

# Rebuild Angular application
npm run build -- --configuration=production

# Rebuild the nginx service with the new build
docker compose -f docker-compose.ssl.yml build --no-cache dynaform-nginx
```

### 2. Restart Services
```bash
# Stop and restart all services
docker compose -f docker-compose.ssl.yml down
docker compose -f docker-compose.ssl.yml up -d
```

### 3. Correct Access URLs
- ✅ **CORRECT**: `https://localhost` or `http://localhost` (through nginx)
- ❌ **WRONG**: `http://localhost:3000` (direct API access)

### 4. Service Flow
```
Browser Request
    ↓
nginx:80/443 (SSL + Static Files)
    ├── / → Angular SPA files
    ├── /api/ → doc2formjson-api:3000 (internal)
    └── /conversion/ → pdf-converter:5001 (internal)
```

## Verification Steps

### 1. ✅ Check Build Status
```bash
# Verify the new build doesn't contain hardcoded localhost:3000
grep -r "localhost:3000" dynaform/dist/ || echo "✅ No hardcoded URLs found"
```

### 2. Check Container Status
```bash
docker compose -f docker-compose.ssl.yml ps
```

### 3. Check nginx Logs
```bash
docker compose -f docker-compose.ssl.yml logs dynaform-nginx
```

### 4. Test API Proxy
```bash
# Should return API response
curl -k https://localhost/api/health
```

### 5. Browser Developer Tools
- Network tab should show requests to `/api/...` (relative URLs)
- No CSP violations in Console
- No blocked requests

## Troubleshooting

### ✅ If still getting localhost:3000 errors (RESOLVED):
1. **Clear build cache completely** (PRIMARY SOLUTION)
   ```bash
   cd dynaform
   rm -rf dist/ && rm -rf .angular/cache/
   npm run build -- --configuration=production
   ```
2. **Clear browser cache** completely
3. **Verify accessing correct URL** (nginx ports, not API port)
4. **Rebuild Docker container** with new build
   ```bash
   docker compose -f docker-compose.ssl.yml build --no-cache dynaform-nginx
   ```

### If CSP errors persist:
1. **Check nginx.ssl.conf** is properly mounted in container
2. **Verify nginx restart** after config changes
3. **Test with browser dev tools** to see actual headers

### If Angular app doesn't load:
1. **Check Angular build path** in Dockerfile.ssl
2. **Verify static files** are in `/usr/share/nginx/html`
3. **Check nginx configuration** for proper serving

## ✅ Resolution Summary
The primary issue was **stale build cache** containing hardcoded `localhost:3000` URLs from an older version of the Angular application. The solution was to:

1. **Clear Angular build cache**: `rm -rf dist/ && rm -rf .angular/cache/`
2. **Rebuild Angular app**: `npm run build -- --configuration=production`
3. **Verify clean build**: Check that no hardcoded URLs remain in the `dist` folder
4. **Rebuild Docker container**: Ensure the new build is used in production

## Expected Behavior After Fix ✅ VERIFIED
- ✅ Angular app loads from nginx
- ✅ Google Fonts load without CSP errors  
- ✅ API calls work through nginx proxy (relative URLs)
- ✅ No "Refused to connect" errors
- ✅ Passkey authentication works properly
- ✅ No hardcoded `localhost:3000` URLs in compiled code

## Key Files Modified
- `docker-compose.ssl.yml` - Removed API port exposure, added WebAuthn/CORS env vars
- `dynaform/nginx.ssl.conf` - Updated CSP headers
- `dynaform/Dockerfile.ssl` - Fixed Angular build path
- Angular service files - Ensured relative URLs
- `server/src/services/webauthnService.ts` - Configured RP_ID and origin from env vars
- `server/src/middleware/index.ts` - Updated CORS to use env variables
- `server/.env` - Added WebAuthn and CORS configuration
- `PASSKEY_CORS_CONFIGURATION.md` - Complete configuration guide
