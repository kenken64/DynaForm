#!/bin/bash

# Quick Let's Encrypt Setup for DynaForm
# This script helps you set up FREE SSL certificates in 5 minutes

echo "🔒 DynaForm Let's Encrypt SSL Setup"
echo "===================================="
echo
echo "✅ Benefits of Let's Encrypt (vs self-signed):"
echo "   • FREE SSL certificates (no cost!)"
echo "   • WebAuthn/Passkeys work perfectly"
echo "   • No browser security warnings"
echo "   • Automatic renewal every 90 days"
echo "   • Trusted by all browsers"
echo

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.letsencrypt.template .env
    echo
fi

echo "🛠️  REQUIRED: Configure your domain in .env file"
echo "==============================================="
echo
echo "1. Edit the .env file:"
echo "   nano .env"
echo
echo "2. Update these lines with YOUR domain and email:"
echo "   DOMAIN_NAME=yourdomain.com"
echo "   SSL_EMAIL=your-email@yourdomain.com"
echo
echo "3. Make sure your domain's A record points to this server"
echo
echo "4. Then run the full setup:"
echo "   ./setup-ssl.sh"
echo
echo "🎯 After setup, WebAuthn will work at: https://yourdomain.com"
echo "   (No more TLS certificate errors!)"
echo
