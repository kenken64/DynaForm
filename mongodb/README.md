# MongoDB Setup for Doc2FormJSON

This directory contains MongoDB Docker configuration for the Doc2FormJSON application.

## Features

- **Production-ready MongoDB 7.0** with optimized configuration
- **Automatic database initialization** with proper collections and indexes
- **User management** with application-specific users and permissions
- **Data persistence** with Docker volumes
- **Health checks** for monitoring container status
- **Security configurations** with authentication enabled
- **Performance optimizations** with proper indexing and caching

## Files Structure

```
mongodb/
├── Dockerfile                          # MongoDB container definition
├── mongod.conf                         # MongoDB configuration file
├── docker-compose.mongodb.yml          # Standalone MongoDB compose file
├── init-scripts/
│   ├── 01-init-database.js            # Database and collections setup
│   └── 02-create-users.sh             # User creation script
└── README.md                          # This file
```

## Configuration

### Environment Variables

- `MONGO_INITDB_ROOT_USERNAME`: Root admin username (default: admin)
- `MONGO_INITDB_ROOT_PASSWORD`: Root admin password (default: password123)
- `MONGO_INITDB_DATABASE`: Initial database name (default: doc2formjson)

### Application Users

The setup creates two application users:

1. **doc2formapp** (read/write access)
   - Username: `doc2formapp`
   - Password: `apppassword123`
   - Permissions: Read/Write access to doc2formjson database

2. **doc2formreader** (read-only access)
   - Username: `doc2formreader`
   - Password: `readerpassword123`
   - Permissions: Read-only access to doc2formjson database

### Collections

The initialization script creates the following collections with proper indexing:

- **form_submissions**: Stores form submission data
- **forms**: Stores form definitions
- **users**: Stores user information
- **form_templates**: Stores reusable form templates

### Connection String

For the application to connect to MongoDB:

```
mongodb://doc2formapp:apppassword123@mongodb:27018/doc2formjson
```

## Usage

### With Main Docker Compose

The MongoDB service is already integrated into the main `docker-compose.yml`. Just run:

```bash
docker-compose up -d
```

### Standalone MongoDB

To run only MongoDB:

```bash
cd mongodb
docker-compose -f docker-compose.mongodb.yml up -d
```

### Manual Build

```bash
cd mongodb
docker build -t doc2formjson-mongodb .
docker run -d \
  --name mongodb \
  -p 27018:27018 \
  -v mongodb_data:/data/db \
  -v mongodb_logs:/data/logs \
  doc2formjson-mongodb
```

## Data Persistence

Data is persisted using Docker volumes:

- `mongodb_data`: Database files
- `mongodb_logs`: MongoDB log files

## Health Monitoring

The container includes health checks that verify MongoDB is responding properly:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{.State.Health}}' doc2formjson-mongodb
```

## Connecting to MongoDB

### From Host Machine

```bash
# Using MongoDB shell
mongo mongodb://admin:password123@localhost:27018/admin

# Using application credentials
mongo mongodb://doc2formapp:apppassword123@localhost:27018/doc2formjson
```

### From Application

The Node.js API service connects using the environment variable:

```javascript
const mongoUri = process.env.MONGODB_URI || 'mongodb://doc2formapp:apppassword123@mongodb:27018/doc2formjson';
```

## Security Notes

⚠️ **Important**: The default passwords are for development only. In production:

1. Change all default passwords
2. Use environment variables for credentials
3. Enable SSL/TLS encryption
4. Configure proper network security
5. Regular backup procedures

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker logs doc2formjson-mongodb
   ```

2. **Authentication failed**
   - Verify username/password in connection string
   - Check if initialization scripts ran successfully

3. **Connection refused**
   - Ensure MongoDB is running: `docker ps`
   - Check if port 27018 is available
   - Verify network connectivity

4. **Data not persisting**
   - Check volume mounts: `docker volume ls`
   - Verify volume permissions

### Performance Tuning

For production environments, consider:

- Adjusting `cacheSizeGB` in mongod.conf based on available memory
- Enabling replication for high availability
- Setting up sharding for horizontal scaling
- Monitoring slow operations and optimizing queries

## Backup and Recovery

### Backup

```bash
# Create backup
docker exec doc2formjson-mongodb mongodump --db doc2formjson --out /data/backup

# Copy backup from container
docker cp doc2formjson-mongodb:/data/backup ./backup
```

### Restore

```bash
# Copy backup to container
docker cp ./backup doc2formjson-mongodb:/data/restore

# Restore database
docker exec doc2formjson-mongodb mongorestore --db doc2formjson /data/restore/doc2formjson
```
