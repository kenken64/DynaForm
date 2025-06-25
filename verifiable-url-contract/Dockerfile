# Use Node.js 18 Alpine image
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for hardhat compilation if needed)
RUN npm i

# Copy application code
COPY . .

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Run the application
CMD ["npm", "start"]
