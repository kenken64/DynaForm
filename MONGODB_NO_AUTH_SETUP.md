# MongoDB No Authentication Setup

This document explains the MongoDB configuration for DynaForm with authentication disabled for simplified development and deployment.

## Configuration Overview

The MongoDB setup has been configured to run **without authentication** for easier development and deployment. This means:

- No username/password required to connect
- All collections are accessible without credentials
- Simplified connection strings
- No user management required

## Files Modified

### 1. `mongodb/Dockerfile`
- Removed `MONGO_INITDB_ROOT_USERNAME` environment variable
- Uses `mongod.noauth.conf` configuration
- Only copies no-auth initialization script

### 2. `mongodb/mongod.noauth.conf`
- Security section is completely commented out
- No authorization requirements
- Allows all connections without credentials

### 3. `mongodb/init-scripts/01-init-database-noauth.js`
- Creates required collections and indexes
- No user creation or authentication setup
- Simplified initialization

### 4. `docker-compose.ssl.yml`
- Only sets `MONGO_INITDB_DATABASE=doc2formjson`
- No `MONGO_INITDB_ROOT_USERNAME` or `MONGO_INITDB_ROOT_PASSWORD`
- Mounts the no-auth configuration file

## Connection Strings

### From Application (Node.js)
```javascript
const mongoUri = 'mongodb://mongodb:27017/doc2formjson';
```

### From Docker Network
```bash
mongodb://mongodb:27017/doc2formjson
```

### From Host Machine
```bash
mongodb://localhost:27017/doc2formjson
```

## Collections Created

The initialization script creates these collections:
- `forms` - Form definitions and templates
- `form_submissions` - User form submissions
- `users` - Application users (for authentication)
- `form_templates` - Reusable form templates
- `recipient_groups` - Groups of form recipients
- `recipients` - Individual form recipients

## Indexes Created

Performance indexes are automatically created for:
- Form searches by ID, title, creator
- Submission searches by form, user, date
- User lookups by email and username
- Recipient group and recipient searches

## Security Considerations

⚠️ **Warning**: This setup disables MongoDB authentication completely.

### Development Environment
- ✅ Acceptable for local development
- ✅ Simplifies container orchestration
- ✅ No credential management needed

### Production Environment
Consider these security measures:
- 🔒 Enable network-level security (VPC, firewall rules)
- 🔒 Use Docker network isolation
- 🔒 Consider enabling authentication for production
- 🔒 Regular backups and monitoring

## Troubleshooting

### Error: "missing 'MONGO_INITDB_ROOT_USERNAME'"
This error occurs when:
- The Dockerfile sets `MONGO_INITDB_ROOT_USERNAME` without password
- Old authentication environment variables are present

**Solution**: Ensure no authentication variables are set in docker-compose.

### Connection Refused
Check that:
- MongoDB container is running: `docker ps`
- Port 27017 is accessible
- Network connectivity between containers

### Database Not Found
The init script automatically creates the `doc2formjson` database. If issues persist:
```bash
# Connect to MongoDB container
docker exec -it doc2formjson-mongodb-ssl mongosh

# Switch to database
use doc2formjson

# List collections
show collections
```

## Enabling Authentication (Optional)

If you need to enable authentication later:

1. Update `mongod.noauth.conf`:
   ```yaml
   security:
     authorization: enabled
   ```

2. Add environment variables to docker-compose:
   ```yaml
   environment:
     - MONGO_INITDB_ROOT_USERNAME=admin
     - MONGO_INITDB_ROOT_PASSWORD=your-secure-password
     - MONGO_INITDB_DATABASE=doc2formjson
   ```

3. Update application connection strings to include credentials

## Backup and Restore

### Backup
```bash
docker exec doc2formjson-mongodb-ssl mongodump --db doc2formjson --out /data/backup
```

### Restore
```bash
docker exec doc2formjson-mongodb-ssl mongorestore --db doc2formjson /data/backup/doc2formjson
```
