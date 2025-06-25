#!/bin/bash

# PDF Converter Docker Entrypoint Script
# Handles permissions and ensures the generated_pngs directory is writable

echo "🚀 Starting PDF Converter with permission fixes..."

# Ensure the generated_pngs directory exists and has proper permissions
if [ -d "/app/generated_pngs" ]; then
    echo "📁 Setting permissions on generated_pngs directory..."
    chmod 777 /app/generated_pngs
    echo "✅ Permissions set to 777 for generated_pngs"
else
    echo "📁 Creating generated_pngs directory with proper permissions..."
    mkdir -p /app/generated_pngs
    chmod 777 /app/generated_pngs
    echo "✅ Created generated_pngs directory with 777 permissions"
fi

# Show current directory structure and permissions
echo "📋 Current directory structure:"
ls -la /app/generated_pngs

echo "🚀 Starting Flask application..."
exec python app.py
