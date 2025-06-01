# Testing the Secure MongoDB Configuration

## Prerequisites
- Docker and Docker Compose installed
- All configuration files in place (validated by `./test-secure-config.sh`)

## Testing Steps

### 1. Validate Configuration (Without Docker)
```bash
./test-secure-config.sh
```
This script validates all configuration files, permissions, and setup without requiring Docker.

### 2. Start Secure Services
```bash
./start-secure.sh
```
This will:
- Check that secrets exist
- Start all services with Docker secrets
- Display connection information

### 3. Verify Services are Running
```bash
# Check service status
docker compose -f docker-compose.secure.yml ps

# Check logs
docker compose -f docker-compose.secure.yml logs -f
```

### 4. Test MongoDB Connection
```bash
# Test MongoDB connection from host
docker exec -it doc2formjson-mongodb mongosh --username admin --password "$(cat secrets/mongo_root_password.txt)" --authenticationDatabase admin

# Test application user
docker exec -it doc2formjson-mongodb mongosh --username doc2formapp --password "$(cat secrets/mongo_app_password.txt)" --authenticationDatabase doc2formjson
```

### 5. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Test form data operations
curl -X GET http://localhost:3000/api/form-data

# Test with a simple form submission
curl -X POST http://localhost:3000/api/form-data \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "data": {"field1": "value1"}}'
```

### 6. Test Frontend
Visit http://localhost:4201 and verify:
- Frontend loads correctly
- Can upload documents
- Can view form data
- All features work as expected

## Troubleshooting

### Common Issues

1. **Services fail to start**
   - Check Docker logs: `docker compose -f docker-compose.secure.yml logs`
   - Verify secrets exist: `ls -la secrets/`
   - Check file permissions: `ls -la secrets/*.txt`

2. **MongoDB connection fails**
   - Verify MongoDB is healthy: `docker compose -f docker-compose.secure.yml ps`
   - Check MongoDB logs: `docker compose -f docker-compose.secure.yml logs mongodb`
   - Test connection manually with mongosh

3. **API can't connect to MongoDB**
   - Check API logs for password source: `docker compose -f docker-compose.secure.yml logs doc2formjson-api`
   - Look for "🔐 Using MongoDB password from Docker secret" message
   - Verify network connectivity between containers

4. **Secrets not mounted**
   - Ensure secret files exist in `./secrets/` directory
   - Check Docker Compose secrets configuration
   - Verify file paths in docker-compose.secure.yml

### Validation Commands

```bash
# Check if secrets are properly mounted in containers
docker exec doc2formjson-api ls -la /run/secrets/

# Check MongoDB users
docker exec -it doc2formjson-mongodb mongosh --username admin --password "$(cat secrets/mongo_root_password.txt)" --authenticationDatabase admin --eval "db.runCommand({usersInfo: 1})"

# Test API configuration
docker exec doc2formjson-api node -e "console.log(require('./dist/config').config.MONGODB_URI)"
```

## Security Verification

### 1. Password Sources
Check API logs to ensure passwords are read from Docker secrets:
```bash
docker compose -f docker-compose.secure.yml logs doc2formjson-api | grep "Using MongoDB password"
```
Should show: "🔐 Using MongoDB password from Docker secret"

### 2. No Plain Text Passwords
Verify no passwords in environment variables:
```bash
docker compose -f docker-compose.secure.yml config | grep -i password
```
Should only show references to `/run/secrets/` paths, no plain text passwords.

### 3. File Permissions
```bash
ls -la secrets/
```
All files should have permissions `-rw-------` (600)

### 4. Container Security
```bash
# Check mounted secrets in container
docker exec doc2formjson-api cat /run/secrets/mongodb_app_password
```
Should display the password content (only accessible from within container)

## Performance Testing

### Load Test API
```bash
# Install apache bench if not available
# brew install httpd (macOS)

# Test API performance
ab -n 1000 -c 10 http://localhost:3000/health
```

### MongoDB Performance
```bash
# Connect to MongoDB and run performance test
docker exec -it doc2formjson-mongodb mongosh --username admin --password "$(cat secrets/mongo_root_password.txt)" --authenticationDatabase admin --eval "
  use doc2formjson;
  for(let i = 0; i < 1000; i++) {
    db.formdata.insertOne({testData: 'performance_test_' + i, timestamp: new Date()});
  }
  print('Inserted 1000 test documents');
  db.formdata.countDocuments({testData: /performance_test/});
"
```

## Cleanup
```bash
# Stop services
docker compose -f docker-compose.secure.yml down

# Remove test data (optional)
docker volume rm doc2formjson_mongodb_data

# Clean up test documents
docker exec -it doc2formjson-mongodb mongosh --username admin --password "$(cat secrets/mongo_root_password.txt)" --authenticationDatabase admin --eval "
  use doc2formjson;
  db.formdata.deleteMany({testData: /performance_test/});
"
```
