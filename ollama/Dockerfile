# Ollama GPU-enabled Dockerfile
FROM ollama/ollama:latest

# Install curl for health checks and model management with retry logic
RUN for i in 1 2 3; do \
      apt-get update && \
      apt-get install -y --no-install-recommends curl && \
      rm -rf /var/lib/apt/lists/* && \
      break || sleep 10; \
    done || \
    (echo "curl installation failed, trying wget as alternative..." && \
     apt-get clean && \
     rm -rf /var/lib/apt/lists/* && \
     apt-get update --fix-missing && \
     apt-get install -y --no-install-recommends --fix-broken wget && \
     rm -rf /var/lib/apt/lists/* && \
     ln -s /usr/bin/wget /usr/bin/curl)

# Set environment variables for GPU support
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create directories for models and data
RUN mkdir -p /root/.ollama

# Expose the default Ollama port
EXPOSE 11434

# Health check to ensure Ollama is running (works with both curl and wget)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD (curl -f http://localhost:11434/api/tags 2>/dev/null || wget -q --spider http://localhost:11434/api/tags) || exit 1

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
