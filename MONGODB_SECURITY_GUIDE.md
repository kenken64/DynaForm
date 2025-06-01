# MongoDB Security Guide for Doc2FormJSON

This guide explains the secure password management implementation for MongoDB in the Doc2FormJSON application.

## 🔐 Security Implementation Overview

The secure configuration uses Docker Secrets to manage MongoDB passwords, avoiding plaintext credentials in Docker Compose files.

### Security Features

1. **Docker Secrets Integration**: Passwords stored in encrypted files
2. **Environment Variable Fallbacks**: Backward compatibility support
3. **Runtime Password Loading**: Passwords read securely at container startup
4. **Git Ignore Protection**: Secrets directory excluded from version control
5. **Permission Controls**: Restricted file permissions (600) for password files

## 📁 File Structure

```
├── secrets/                          # Docker secrets directory
│   ├── mongo_root_password.txt       # MongoDB root password
│   ├── mongo_app_password.txt        # Application user password
│   └── mongo_reader_password.txt     # Read-only user password
├── docker-compose.secure.yml         # Secure Docker Compose configuration
├── setup-mongodb-security.sh         # Security setup script
├── start-secure.sh                   # Secure startup script
└── mongodb/
    └── init-scripts/
        └── 02-create-users-secure.sh # Secure user creation script
```

## 🚀 Quick Start

### 1. Generate Secure Passwords

```bash
# Run the security setup script
./setup-mongodb-security.sh
```

This creates:
- Secure random passwords (32 characters each)
- Password files in `./secrets/` directory
- Proper file permissions (600)
- Git ignore entries

### 2. Start with Secure Configuration

```bash
# Start all services with secure MongoDB
./start-secure.sh
```

Or manually:
```bash
docker-compose -f docker-compose.secure.yml up --build
```

## 🔧 Configuration Details

### Docker Secrets Configuration

The secure Docker Compose file (`docker-compose.secure.yml`) defines secrets:

```yaml
secrets:
  mongo_root_password:
    file: ./secrets/mongo_root_password.txt
  mongo_app_password:
    file: ./secrets/mongo_app_password.txt
  mongo_reader_password:
    file: ./secrets/mongo_reader_password.txt
```

### MongoDB Service Configuration

```yaml
services:
  mongodb:
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD_FILE=/run/secrets/mongo_root_password
      - MONGO_INITDB_DATABASE=doc2formjson
    secrets:
      - mongo_root_password
      - mongo_app_password
      - mongo_reader_password
```

### API Service Configuration

The Node.js API service reads passwords securely:

```yaml
services:
  doc2formjson-api:
    environment:
      - MONGODB_HOST=mongodb
      - MONGODB_PORT=27017
      - MONGODB_DATABASE=doc2formjson
      - MONGODB_USERNAME=doc2formapp
      - MONGODB_PASSWORD_FILE=/run/secrets/mongo_app_password
    secrets:
      - mongo_app_password
```

## 🔑 Password Management

### Automatic Password Generation

The setup script generates cryptographically secure passwords:

```bash
# Generate 32-character base64 password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

### Password Reading in Application

The API service configuration includes secure password handling:

```typescript
// Helper function to read Docker secrets
function readDockerSecret(secretName: string): string | null {
  try {
    const secretPath = `/run/secrets/${secretName}`;
    if (existsSync(secretPath)) {
      return readFileSync(secretPath, 'utf8').trim();
    }
  } catch (error) {
    console.warn(`Could not read Docker secret ${secretName}:`, error);
  }
  return null;
}

// Build MongoDB URI with secure password
function buildMongoDBURI(): string {
  const passwordFromSecret = readDockerSecret('mongodb_app_password');
  const password = passwordFromSecret || process.env.MONGODB_PASSWORD || 'fallback';
  
  if (passwordFromSecret) {
    console.log('🔐 Using MongoDB password from Docker secret');
  }
  
  return `mongodb://${username}:${password}@${host}:${port}/${database}`;
}
```

## 🛡️ Security Best Practices

### File Permissions

Password files have restricted permissions:
```bash
chmod 600 secrets/*.txt  # Owner read/write only
chmod 700 secrets/       # Owner access only
```

### Git Protection

The `.gitignore` file excludes sensitive data:
```gitignore
# MongoDB Secrets
secrets/
*.password
.env.local
```

### Environment Variables

For development, you can use environment variables:
```bash
# Development only - not recommended for production
export MONGODB_PASSWORD="your-dev-password"
```

### Production Deployment

For production:
1. Use external secret management (AWS Secrets Manager, Azure Key Vault, etc.)
2. Enable MongoDB authentication and SSL/TLS
3. Use network security (VPC, firewalls)
4. Regular password rotation
5. Monitor access logs

## 🔄 Password Rotation

To rotate passwords:

1. **Generate new passwords:**
   ```bash
   ./setup-mongodb-security.sh
   # Answer 'y' to regenerate passwords
   ```

2. **Update database users:**
   ```bash
   # Connect to MongoDB and update passwords
   ./mongodb-manager.sh connect
   ```

3. **Restart services:**
   ```bash
   docker-compose -f docker-compose.secure.yml down
   docker-compose -f docker-compose.secure.yml up --build
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Secret files not found:**
   ```bash
   # Ensure secrets directory exists and has files
   ls -la secrets/
   ```

2. **Permission denied:**
   ```bash
   # Fix file permissions
   chmod 600 secrets/*.txt
   chmod 700 secrets/
   ```

3. **Container startup failures:**
   ```bash
   # Check container logs
   docker logs doc2formjson-mongodb
   ```

4. **Authentication failures:**
   ```bash
   # Verify secret file contents
   cat secrets/mongo_app_password.txt
   ```

### Debug Mode

To debug secret loading:
```bash
# Check if secrets are mounted in container
docker exec doc2formjson-mongodb ls -la /run/secrets/
```

## 🔍 Verification

### Test MongoDB Connection

```bash
# Test connection with secure credentials
./test-mongodb-integration.sh
```

### Manual Verification

```bash
# Read password from secret file
PASSWORD=$(cat secrets/mongo_app_password.txt)

# Test connection
docker exec doc2formjson-mongodb mongo \
  "mongodb://doc2formapp:$PASSWORD@localhost:27017/doc2formjson" \
  --eval "db.runCommand({ping: 1})"
```

## 📊 Migration from Insecure Configuration

To migrate from hardcoded passwords:

1. **Backup existing data:**
   ```bash
   ./mongodb-manager.sh backup
   ```

2. **Run security setup:**
   ```bash
   ./setup-mongodb-security.sh
   ```

3. **Switch to secure configuration:**
   ```bash
   docker-compose down
   ./start-secure.sh
   ```

4. **Verify data integrity:**
   ```bash
   ./mongodb-manager.sh stats
   ```

## 🎯 Benefits

- **🔒 Enhanced Security**: No plaintext passwords in configuration
- **🔄 Easy Rotation**: Simple password update process
- **🚀 Production Ready**: Industry-standard secret management
- **🔍 Audit Trail**: Clear security implementation
- **📝 Backward Compatible**: Falls back to environment variables
- **🛡️ Git Safe**: Secrets automatically excluded from version control

---

**Security Note**: This implementation provides a foundation for secure password management. For enterprise deployments, consider integrating with external secret management services and implementing additional security layers such as network encryption, access controls, and monitoring.