# MongoDB Dockerfile for Doc2FormJSON Application
FROM mongo:7.0

# Set metadata
LABEL maintainer="Doc2FormJSON Team"
LABEL description="MongoDB container for form data storage"
LABEL version="1.0"

# Environment variables
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_DATABASE=doc2formjson

# Create necessary directories
RUN mkdir -p /docker-entrypoint-initdb.d
RUN mkdir -p /data/db
RUN mkdir -p /data/logs

# Copy initialization scripts (secure version for Docker secrets)
COPY init-scripts/01-init-database.js /docker-entrypoint-initdb.d/
COPY init-scripts/02-create-users-secure.sh /docker-entrypoint-initdb.d/02-create-users.sh

COPY mongod.conf /etc/mongod.conf.custom

# Set proper permissions
RUN chown -R mongodb:mongodb /data/db
RUN chown -R mongodb:mongodb /data/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD mongo --eval "db.adminCommand('ping')" || exit 1

# Expose MongoDB port (container port)
EXPOSE 27018

# Volume for persistent data
VOLUME ["/data/db", "/data/logs"]

# Default command
CMD ["mongod", "--config", "/etc/mongod.conf.custom"]
