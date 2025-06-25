#!/bin/bash

# SSL Certificate Management Script for DynaForm
set -e

COMPOSE_FILE="docker-compose.ssl.yml"

show_help() {
    echo "DynaForm SSL Certificate Management"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  obtain <domain> <email>    - Obtain SSL certificates for domain"
    echo "  renew                      - Renew existing certificates"
    echo "  status                     - Check certificate status"
    echo "  restart-nginx              - Restart nginx service"
    echo "  setup <domain> <email>     - Complete SSL setup for domain"
    echo ""
    echo "Examples:"
    echo "  $0 obtain example.com admin@example.com"
    echo "  $0 setup mydomain.com ssl@mydomain.com"
    echo "  $0 renew"
    echo "  $0 status"
}

obtain_certificates() {
    local domain=$1
    local email=$2
    
    if [ -z "$domain" ] || [ -z "$email" ]; then
        echo "❌ Error: Domain and email are required"
        echo "Usage: $0 obtain <domain> <email>"
        exit 1
    fi
    
    echo "🔐 Obtaining SSL certificates for $domain..."
    
    # Make sure certbot service is running
    docker compose -f "$COMPOSE_FILE" up -d certbot
    
    # Obtain certificates
    docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
        --webroot --webroot-path=/var/www/certbot \
        --email "$email" --agree-tos --no-eff-email \
        --domains "$domain"
    
    if [ $? -eq 0 ]; then
        echo "✅ Certificates obtained successfully!"
        echo "🔄 Restarting nginx to use new certificates..."
        docker compose -f "$COMPOSE_FILE" restart dynaform-nginx
        echo "✅ Nginx restarted successfully!"
    else
        echo "❌ Failed to obtain certificates"
        exit 1
    fi
}

renew_certificates() {
    echo "🔄 Renewing SSL certificates..."
    
    docker compose -f "$COMPOSE_FILE" run --rm certbot renew
    
    if [ $? -eq 0 ]; then
        echo "✅ Certificates renewed successfully!"
        echo "🔄 Restarting nginx..."
        docker compose -f "$COMPOSE_FILE" restart dynaform-nginx
        echo "✅ Nginx restarted successfully!"
    else
        echo "❌ Failed to renew certificates"
        exit 1
    fi
}

check_status() {
    echo "📊 SSL Certificate Status:"
    echo ""
    
    # Check if certbot container exists
    if docker compose -f "$COMPOSE_FILE" ps | grep -q certbot; then
        echo "🐳 Certbot service: Running"
    else
        echo "🐳 Certbot service: Not running"
    fi
    
    # Check for certificate files
    echo ""
    echo "📁 Certificate files:"
    docker compose -f "$COMPOSE_FILE" exec dynaform-nginx ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "  No Let's Encrypt certificates found"
    
    echo ""
    echo "🔒 Self-signed certificates:"
    docker compose -f "$COMPOSE_FILE" exec dynaform-nginx ls -la /etc/ssl/certs/nginx-selfsigned.crt /etc/ssl/private/nginx-selfsigned.key 2>/dev/null || echo "  Self-signed certificates not found"
    
    # Check nginx status
    echo ""
    echo "🌐 Nginx status:"
    if docker compose -f "$COMPOSE_FILE" ps | grep -q nginx; then
        echo "  Service: Running"
        echo "  Configuration test:"
        docker compose -f "$COMPOSE_FILE" exec dynaform-nginx nginx -t
    else
        echo "  Service: Not running"
    fi
}

restart_nginx() {
    echo "🔄 Restarting nginx service..."
    docker compose -f "$COMPOSE_FILE" restart dynaform-nginx
    echo "✅ Nginx restarted successfully!"
}

setup_ssl() {
    local domain=$1
    local email=$2
    
    if [ -z "$domain" ] || [ -z "$email" ]; then
        echo "❌ Error: Domain and email are required"
        echo "Usage: $0 setup <domain> <email>"
        exit 1
    fi
    
    echo "🚀 Setting up SSL for $domain..."
    
    # Set environment variables
    export DOMAIN_NAME="$domain"
    export SSL_EMAIL="$email"
    
    echo "📋 Configuration:"
    echo "  Domain: $DOMAIN_NAME"
    echo "  Email: $SSL_EMAIL"
    
    # Check if domain resolves to this server
    echo ""
    echo "🔍 Checking domain resolution..."
    if command -v dig >/dev/null 2>&1; then
        PUBLIC_IP=$(curl -s https://api.ipify.org)
        DOMAIN_IP=$(dig +short "$domain" | tail -1)
        
        if [ "$PUBLIC_IP" = "$DOMAIN_IP" ]; then
            echo "✅ Domain $domain resolves to this server ($PUBLIC_IP)"
        else
            echo "⚠️  Warning: Domain $domain resolves to $DOMAIN_IP, but this server's IP is $PUBLIC_IP"
            echo "   Please ensure your domain points to this server before continuing."
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        echo "⚠️  Cannot check domain resolution (dig not available)"
    fi
    
    # Start services if not running
    echo ""
    echo "🏗️ Ensuring services are running..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    # Wait a moment for services to start
    sleep 10
    
    # Obtain certificates
    obtain_certificates "$domain" "$email"
    
    echo ""
    echo "✅ SSL setup complete for $domain!"
    echo "🌐 Your site should now be accessible at: https://$domain"
}

# Main script logic
case "$1" in
    "obtain")
        obtain_certificates "$2" "$3"
        ;;
    "renew")
        renew_certificates
        ;;
    "status")
        check_status
        ;;
    "restart-nginx")
        restart_nginx
        ;;
    "setup")
        setup_ssl "$2" "$3"
        ;;
    *)
        show_help
        exit 1
        ;;
esac
