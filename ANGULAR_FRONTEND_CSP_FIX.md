# Angular Frontend CSP and API Connection Fix

## Issues Identified
1. **Content Security Policy (CSP) too restrictive** - blocking Google Fonts and API connections
2. **Hardcoded localhost:3000 URLs** in Angular services instead of relative URLs
3. **Angular build output path mismatch** in Dockerfile.ssl
4. **Incorrect health check URLs** in docker-compose.ssl.yml

## Fixes Applied

### 1. Updated Content Security Policy (nginx.ssl.conf)
```nginx
# Before (too restrictive)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:;" always;

# After (allows Google Fonts and proper API connections)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws: wss:;" always;
```

### 2. Fixed Hardcoded API URLs in Angular Services
Updated the following files to use relative URLs:
- `dynaform/src/app/services/recipient-group.service.ts`
- `dynaform/src/app/auth/auth.service.new.ts`  
- `dynaform/src/app/auth/auth.service.ts`
- `dynaform/src/app/forms-list/forms-list.component.ts`

```typescript
// Before
private apiUrl = 'http://localhost:3000/api';

// After  
private apiUrl = '/api'; // Relative URL handled by nginx proxy
```

### 3. Fixed Angular Build Output Path (Dockerfile.ssl)
```dockerfile
# Before (incorrect path for Angular 18+)
COPY --from=builder /app/dist/dynaform /usr/share/nginx/html

# After (correct path for Angular 18+ application builder)
COPY --from=builder /app/dist/dynaform/browser /usr/share/nginx/html
```

### 4. Fixed Health Check URLs (docker-compose.ssl.yml)
```yaml
# Before (external domain that may not exist)
test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "https://formbt.com/health", "||", "exit", "1"]

# After (local container check)
test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/", "||", "exit", "1"]
```

## How It Works Now

### Request Flow
1. **Browser** → **nginx (port 443/80)** → **Angular SPA served from /usr/share/nginx/html**
2. **Angular API calls** → **nginx /api/ location** → **doc2formjson-api:3000**
3. **Static resources** → **nginx directly serves from container**

### Network Architecture
```
Browser (HTTPS/HTTP)
    ↓
nginx:443/80 (SSL termination + static files)
    ├── / → Angular SPA files
    ├── /api/ → doc2formjson-api:3000
    ├── /conversion/ → pdf-converter:5001
    └── /conversion/generated_images/ → static files
```

### Security
- **CSP allows**: Google Fonts, WebSocket connections, relative API calls
- **Rate limiting**: API calls (10r/s), Auth calls (5r/m)
- **SSL**: Self-signed certificates (can be replaced with Let's Encrypt)

## Testing
After these fixes:
1. Angular should load without CSP errors
2. Google Fonts should load properly
3. API authentication should work through nginx proxy
4. No more "Refused to connect" errors

## Files Modified
- `dynaform/nginx.ssl.conf` - Updated CSP headers
- `dynaform/Dockerfile.ssl` - Fixed Angular build output path
- `dynaform/src/app/services/recipient-group.service.ts` - Relative API URL
- `dynaform/src/app/auth/auth.service.new.ts` - Relative API URL
- `dynaform/src/app/auth/auth.service.ts` - Relative API URL
- `dynaform/src/app/forms-list/forms-list.component.ts` - Relative mock URL
- `docker-compose.ssl.yml` - Fixed health check URLs

The Angular frontend should now properly display and connect to the API through the nginx reverse proxy without CSP violations.
