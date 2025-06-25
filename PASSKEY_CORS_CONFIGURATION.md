# Passkey and CORS Configuration Guide

This document explains how to configure WebAuthn/Passkey authentication and CORS settings using environment variables.

## Environment Variables

### WebAuthn/Passkey Configuration

#### `RP_ID` (Relying Party ID)
- **Description**: The domain identifier for WebAuthn operations
- **Development**: `localhost`
- **Production**: Your actual domain (e.g., `yourdomain.com`)
- **Example**: 
  ```env
  RP_ID=localhost              # Development
  RP_ID=app.yourdomain.com     # Production
  ```

#### `RP_NAME` (Relying Party Name)
- **Description**: Human-readable name displayed during passkey registration
- **Default**: `DynaForm`
- **Example**:
  ```env
  RP_NAME=DynaForm
  RP_NAME=Your App Name
  ```

#### `WEBAUTHN_ORIGIN`
- **Description**: Expected origin for WebAuthn operations
- **Development**: `http://localhost:4200`
- **Production**: Your app's URL (e.g., `https://yourdomain.com`)
- **Example**:
  ```env
  WEBAUTHN_ORIGIN=http://localhost:4200    # Development
  WEBAUTHN_ORIGIN=https://yourdomain.com   # Production
  ```

### CORS Configuration

#### `CORS_ORIGIN`
- **Description**: Allowed origins for cross-origin requests
- **Multiple origins**: Comma-separated list
- **Wildcard**: Use `*` for development only
- **Example**:
  ```env
  CORS_ORIGIN=*                                           # Development (not recommended for production)
  CORS_ORIGIN=https://yourdomain.com                      # Single origin
  CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com  # Multiple origins
  ```

#### `CORS_CREDENTIALS`
- **Description**: Whether to allow credentials in CORS requests
- **Values**: `true` or `false`
- **Production**: Usually `true` for authenticated requests
- **Example**:
  ```env
  CORS_CREDENTIALS=false    # Development
  CORS_CREDENTIALS=true     # Production
  ```

## Configuration Examples

### Development Configuration
```env
# WebAuthn/Passkey Configuration
RP_ID=localhost
RP_NAME=DynaForm
WEBAUTHN_ORIGIN=http://localhost:4200

# CORS Configuration
CORS_ORIGIN=*
CORS_CREDENTIALS=false
```

### Production Configuration
```env
# WebAuthn/Passkey Configuration
RP_ID=yourdomain.com
RP_NAME=DynaForm
WEBAUTHN_ORIGIN=https://yourdomain.com

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true
```

### Docker Compose Configuration

The `docker-compose.ssl.yml` file includes these environment variables:

```yaml
doc2formjson-api:
  environment:
    # WebAuthn/Passkey Configuration
    - RP_ID=localhost
    - RP_NAME=DynaForm
    - WEBAUTHN_ORIGIN=https://localhost
    # CORS Configuration  
    - CORS_ORIGIN=https://localhost,http://localhost
    - CORS_CREDENTIALS=true
```

## Security Considerations

### Production Deployment
1. **Never use `*` for CORS_ORIGIN** in production
2. **Use HTTPS** for all production WebAuthn operations
3. **Set specific domains** for RP_ID and WEBAUTHN_ORIGIN
4. **Enable credentials** (`CORS_CREDENTIALS=true`) for authenticated requests

### Domain Requirements
- **RP_ID** must match the domain serving your application
- **WEBAUTHN_ORIGIN** must be the exact URL users access your app from
- Both HTTP and HTTPS origins can be specified for CORS during development

### Multiple Domains
If your app is accessible from multiple domains:
```env
RP_ID=yourdomain.com
WEBAUTHN_ORIGIN=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,https://www.yourdomain.com
```

## Troubleshooting

### Passkey Registration/Authentication Fails
- Check that `RP_ID` matches your domain
- Verify `WEBAUTHN_ORIGIN` is exactly the URL in the browser
- Ensure you're using HTTPS in production

### CORS Errors
- Verify the request origin is included in `CORS_ORIGIN`
- Check that `CORS_CREDENTIALS` is set correctly
- For multiple origins, ensure comma separation without spaces

### Common Issues
1. **Mixed Content**: Use HTTPS for both frontend and backend in production
2. **Subdomain Mismatch**: RP_ID should be the root domain, not subdomain
3. **Port Mismatch**: Include port numbers in development URLs if needed

## Implementation Files

The following files implement this configuration:

- `server/src/services/webauthnService.ts` - WebAuthn configuration
- `server/src/middleware/index.ts` - CORS middleware
- `server/.env` - Development environment variables
- `server/.env.production.example` - Production template
- `docker-compose.ssl.yml` - Docker deployment configuration
