# MongoDB Secure Password Management

This document explains how to use Docker Secrets for secure MongoDB password management in the Doc2FormJSON application.

## 🔐 Security Features

- **Docker Secrets**: Passwords are stored in secure files and mounted as secrets
- **No Hardcoded Credentials**: No passwords in source code or environment variables
- **Runtime Security**: Passwords are only available to containers that need them
- **Git Safe**: Secrets directory is automatically excluded from version control

## 📁 File Structure

```
secrets/
├── mongo_root_password.txt      # MongoDB root admin password
├── mongo_app_password.txt       # Application user password
└── mongo_reader_password.txt    # Read-only user password

docker-compose.secure.yml        # Secure Docker Compose configuration
setup-mongodb-security.sh        # Security setup script
start-secure.sh                  # Secure startup script
```

## 🚀 Quick Start

### 1. Generate Secure Passwords

Run the security setup script to generate secure passwords:

```bash
./setup-mongodb-security.sh
```

This script will:
- Generate strong random passwords (32 characters)
- Save them to secure files with proper permissions (600)
- Add secrets/ to .gitignore
- Create environment templates

### 2. Start with Secure Configuration

```bash
./start-secure.sh
```

Or manually:

```bash
docker-compose -f docker-compose.secure.yml up --build
```

## 🔧 How It Works

### Docker Secrets Configuration

The secure Docker Compose file defines secrets:

```yaml
secrets:
  mongodb_root_password:
    file: ./secrets/mongo_root_password.txt
  mongodb_app_password:
    file: ./secrets/mongo_app_password.txt
  mongodb_reader_password:
    file: ./secrets/mongo_reader_password.txt
```

### MongoDB Service

MongoDB reads the root password from the secret:

```yaml
mongodb:
  environment:
    - MONGO_INITDB_ROOT_PASSWORD_FILE=/run/secrets/mongodb_root_password
  secrets:
    - mongodb_root_password
    - mongodb_app_password
    - mongodb_reader_password
```

### API Service Configuration

The API service reads the application password from secrets:

```yaml
doc2formjson-api:
  environment:
    - MONGODB_HOST=mongodb
    - MONGODB_USERNAME=doc2formapp
    - MONGODB_PASSWORD_FILE=/run/secrets/mongodb_app_password
  secrets:
    - mongodb_app_password
```

### Application Code

The configuration module automatically handles password reading:

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
  // ... construct URI
}
```

## 🔄 Fallback Behavior

The system gracefully falls back if secrets are not available:

1. **Docker Secrets** (Production) - Read from `/run/secrets/`
2. **Environment Variables** (Development) - Read from `process.env`
3. **Default Values** (Local Development) - Use hardcoded defaults

## 📊 Connection Information

### Secure Configuration

- **Application Connection**: Uses Docker secrets for password
- **Admin Connection**: `mongodb://admin:[secret]@localhost:27017/admin`
- **Application User**: `doc2formapp` with read/write access
- **Reader User**: `doc2formreader` with read-only access

### Development Fallback

- **Connection String**: `mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson`

## 🛡️ Security Best Practices

### File Permissions

```bash
# Secrets directory and files have restricted permissions
chmod 700 secrets/
chmod 600 secrets/*.txt
```

### Version Control

The `.gitignore` automatically excludes:

```gitignore
# MongoDB Secrets
secrets/
*.password
.env.local
```

### Production Deployment

1. **Generate unique passwords** for each environment
2. **Use Docker Swarm secrets** for orchestrated deployments
3. **Enable MongoDB authentication** and SSL/TLS
4. **Regular password rotation** (update secrets and restart services)
5. **Monitor access logs** and audit user permissions

## 🔧 Troubleshooting

### Secrets Not Found

```bash
# Check if secrets directory exists
ls -la secrets/

# Regenerate secrets if needed
./setup-mongodb-security.sh
```

### Permission Denied

```bash
# Fix file permissions
chmod 600 secrets/*.txt
chmod 700 secrets/
```

### Container Can't Read Secrets

1. Verify Docker Compose secrets section
2. Check container mounts: `docker exec container ls /run/secrets/`
3. Ensure secret files exist and have correct names

### Connection Issues

1. Check logs: `docker logs doc2formjson-mongodb`
2. Verify password in secret file matches what's expected
3. Test connection manually: `mongo mongodb://user:password@localhost:27017/database`

## 📈 Monitoring

### Health Checks

All services include health checks:

```bash
# Check service health
docker ps

# Detailed health information
docker inspect --format='{{.State.Health}}' doc2formjson-mongodb
```

### Logs

```bash
# MongoDB logs
docker logs doc2formjson-mongodb

# API service logs
docker logs doc2formjson-api

# Check secret mounting
docker exec doc2formjson-api ls -la /run/secrets/
```

## 🔄 Password Rotation

To rotate passwords:

1. **Generate new passwords**: Run `./setup-mongodb-security.sh`
2. **Update database users**: Connect to MongoDB and update user passwords
3. **Restart services**: `docker-compose -f docker-compose.secure.yml restart`

## 🎯 Environment-Specific Configuration

### Development

```bash
# Use regular compose for development
docker-compose up
```

### Staging/Production

```bash
# Always use secure configuration
docker-compose -f docker-compose.secure.yml up
```

---

## ✅ Checklist

- [ ] Secrets generated with `./setup-mongodb-security.sh`
- [ ] File permissions set correctly (700/600)
- [ ] Secrets directory in .gitignore
- [ ] Services start with `./start-secure.sh`
- [ ] MongoDB authentication working
- [ ] API connects successfully
- [ ] No passwords in logs or environment variables
- [ ] Backup procedures include secret management

**🔐 Your MongoDB is now secured with Docker Secrets!**
