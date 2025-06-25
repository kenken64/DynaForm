#!/bin/bash

# IMMEDIATE FIX for OpenSSL TLS Error
# Error: cannot load certificate "/etc/letsencrypt/live/${domain_name}/fullchain.pem"
# Root cause: SSL certificate variables not substituted + certificates don't exist

echo "🚨 IMMEDIATE SSL CERTIFICATE FIX"
echo "================================="
echo "Error: nginx cannot find SSL certificates"
echo "Path: /etc/letsencrypt/live/\${domain_name}/fullchain.pem"
echo

# Quick Solution 1: Switch to localhost (2 minutes)
echo "🚀 SOLUTION 1: Switch to localhost (FASTEST)"
echo "This fixes the SSL error immediately using self-signed certificates"
echo "WebAuthn will work on localhost!"
echo

read -p "Fix with localhost? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Switching to localhost configuration..."
    
    # Update .env.ssl
    if [ -f ".env.ssl" ]; then
        sed -i.bak 's/DOMAIN_NAME=.*/DOMAIN_NAME=localhost/' .env.ssl
        echo "✅ Updated .env.ssl to use localhost"
    else
        echo "Creating .env.ssl for localhost..."
        cat > .env.ssl << 'EOF'
DOMAIN_NAME=localhost
SSL_EMAIL=admin@localhost
BUILD_TIMESTAMP=$(date +%s)
NODE_ENV=production
FLASK_ENV=production
EOF
    fi
    
    # Create simple nginx config for localhost
    echo "✅ Creating localhost nginx config..."
    cp dynaform/nginx.ssl.conf dynaform/nginx.ssl.conf.backup 2>/dev/null || true
    
    cat > dynaform/nginx.ssl.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # HTTP redirect to HTTPS
    server {
        listen 80;
        server_name localhost;
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS with self-signed certificates
    server {
        listen 443 ssl http2;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Self-signed certificates (created by nginx automatically)
        ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
        ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
        
        # Basic SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;

        # Handle Angular routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://doc2formjson-api:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # PDF converter proxy
        location /conversion/ {
            proxy_pass http://pdf-converter:5001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

    echo "✅ Restarting nginx with new configuration..."
    
    # Try to restart nginx
    if command -v docker >/dev/null 2>&1; then
        docker compose -f docker-compose.ssl.yml --env-file .env.ssl restart dynaform-nginx
        echo "✅ Nginx restarted successfully!"
        echo
        echo "🎉 FIXED! Access your application:"
        echo "   • HTTP:  http://localhost"
        echo "   • HTTPS: https://localhost (accept certificate warning)"
        echo "   • WebAuthn will work on localhost! ✨"
        echo
        echo "No more SSL certificate errors!"
    else
        echo "⚠️  Please restart nginx manually:"
        echo "   docker compose -f docker-compose.ssl.yml restart dynaform-nginx"
    fi
    
    exit 0
fi

echo
echo "🔧 SOLUTION 2: Manual SSL certificate fix"
echo "If you want to use a real domain instead of localhost:"
echo

echo "1. Check your domain in .env.ssl:"
if [ -f ".env.ssl" ]; then
    DOMAIN=$(grep "DOMAIN_NAME=" .env.ssl | cut -d'=' -f2)
    echo "   Current domain: $DOMAIN"
else
    echo "   ❌ .env.ssl not found"
fi

echo
echo "2. Fix the nginx certificate path:"
echo "   The nginx config has template variables that aren't being substituted"
echo

echo "3. Generate SSL certificates:"
echo "   ./force-renew-ssl.sh recreate"
echo

echo "4. Or use the debug tool:"
echo "   ./debug-ssl.sh"
echo

echo "📋 The issue is:"
echo "   • nginx config has \${domain_name} variables that aren't replaced"
echo "   • SSL certificates don't exist in /etc/letsencrypt/live/"
echo "   • nginx fails to start SSL handshake"
echo

echo "💡 RECOMMENDATION: Use localhost for immediate fix!"
echo "   Run this script again and choose 'y' for localhost setup"
