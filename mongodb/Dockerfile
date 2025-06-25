# MongoDB Dockerfile for Doc2FormJSON Application
FROM mongo:7.0

# Set metadata
LABEL maintainer="Doc2FormJSON Team"
LABEL description="MongoDB container for form data storage - No Authentication"
LABEL version="1.0"

# Environment variables for no authentication setup
ENV MONGO_INITDB_DATABASE=doc2formjson

# Create necessary directories
RUN mkdir -p /docker-entrypoint-initdb.d
RUN mkdir -p /data/db
RUN mkdir -p /data/logs

# Copy initialization scripts (no authentication version)
COPY init-scripts/01-init-database-noauth.js /docker-entrypoint-initdb.d/01-init-database.js

COPY mongod.noauth.conf /etc/mongod.conf.custom

# Set proper permissions
RUN chown -R mongodb:mongodb /data/db
RUN chown -R mongodb:mongodb /data/logs

# Health check (no authentication)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD mongosh --eval "db.adminCommand('ping')" || exit 1

# Expose MongoDB port (container port)
EXPOSE 27018

# Volume for persistent data
VOLUME ["/data/db", "/data/logs"]

# Default command
CMD ["mongod", "--config", "/etc/mongod.conf.custom"]
