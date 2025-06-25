#!/bin/bash

# Force Renew Let's Encrypt Certificates
# This script provides multiple ways to force renew SSL certificates

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.ssl.yml"
ENV_FILE=".env.ssl"

print_header() {
    echo -e "${BLUE}"
    echo "============================================"
    echo "     Let's Encrypt Force Renewal Tool"
    echo "============================================"
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment file exists
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found!"
        print_info "Run ./setup-ssl.sh first to create environment"
        exit 1
    fi
    
    # Load domain from env file
    DOMAIN=$(grep "DOMAIN_NAME=" "$ENV_FILE" | cut -d'=' -f2)
    EMAIL=$(grep "SSL_EMAIL=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
        print_error "DOMAIN_NAME or SSL_EMAIL not found in $ENV_FILE"
        exit 1
    fi
    
    print_info "Domain: $DOMAIN"
    print_info "Email: $EMAIL"
}

# Method 1: Force renewal of existing certificate
force_renew_existing() {
    print_step "Method 1: Force renewing existing certificate..."
    
    if docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm certbot \
        renew --force-renewal --cert-name "$DOMAIN"; then
        print_info "✅ Certificate force renewed successfully!"
        return 0
    else
        print_warning "❌ Force renewal failed - certificate might not exist"
        return 1
    fi
}

# Method 2: Delete and recreate certificate
delete_and_recreate() {
    print_step "Method 2: Delete and recreate certificate..."
    
    # Delete existing certificate
    print_info "Deleting existing certificate..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm certbot \
        delete --cert-name "$DOMAIN" --non-interactive 2>/dev/null || true
    
    # Start nginx for ACME challenge
    print_info "Starting nginx for verification..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d dynaform-nginx
    sleep 10
    
    # Create new certificate
    print_info "Creating new certificate..."
    if docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email "$EMAIL" --agree-tos --no-eff-email \
        --force-renewal -d "$DOMAIN"; then
        print_info "✅ New certificate created successfully!"
        return 0
    else
        print_error "❌ Failed to create new certificate"
        return 1
    fi
}

# Method 3: Force renewal with staging (for testing)
force_renew_staging() {
    print_step "Method 3: Force renewal with staging (testing)..."
    
    print_info "Using Let's Encrypt staging environment (for testing)"
    
    # Start nginx
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d dynaform-nginx
    sleep 10
    
    if docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email "$EMAIL" --agree-tos --no-eff-email \
        --staging --force-renewal -d "$DOMAIN"; then
        print_info "✅ Staging certificate created successfully!"
        print_warning "This is a staging certificate - not trusted by browsers"
        return 0
    else
        print_error "❌ Staging certificate failed"
        return 1
    fi
}

# Method 4: Manual certificate with verbose output
manual_verbose() {
    print_step "Method 4: Manual certificate with verbose debugging..."
    
    # Start nginx
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d dynaform-nginx
    sleep 10
    
    print_info "Running with maximum verbosity for debugging..."
    
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email "$EMAIL" --agree-tos --no-eff-email \
        --verbose --debug --force-renewal \
        -d "$DOMAIN"
}

# Method 5: Clean slate approach
clean_slate() {
    print_step "Method 5: Clean slate approach..."
    
    print_warning "This will remove ALL certificates and start fresh"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cancelled"
        return 1
    fi
    
    # Stop all services
    print_info "Stopping all services..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down
    
    # Remove certificate volumes
    print_info "Removing certificate volumes..."
    docker volume rm doc2formjson_certbot_certs 2>/dev/null || true
    docker volume rm doc2formjson_certbot_www 2>/dev/null || true
    docker volume rm doc2formjson_certbot_logs 2>/dev/null || true
    
    # Start fresh
    print_info "Starting nginx..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d dynaform-nginx
    sleep 15
    
    # Create new certificate
    print_info "Creating fresh certificate..."
    if docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email "$EMAIL" --agree-tos --no-eff-email \
        --force-renewal -d "$DOMAIN"; then
        print_info "✅ Fresh certificate created successfully!"
        return 0
    else
        print_error "❌ Fresh certificate creation failed"
        return 1
    fi
}

# List current certificates
list_certificates() {
    print_step "Current certificates:"
    
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE run --rm certbot certificates || {
        print_info "No certificates found or certbot not accessible"
    }
}

# Restart nginx after certificate renewal
restart_nginx() {
    print_step "Restarting nginx to use new certificates..."
    
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE restart dynaform-nginx
    sleep 5
    
    # Test if nginx is working
    if docker compose -f $COMPOSE_FILE --env-file $ENV_FILE exec dynaform-nginx nginx -t 2>/dev/null; then
        print_info "✅ Nginx configuration is valid"
    else
        print_warning "⚠️  Nginx configuration might have issues"
    fi
}

# Show usage
show_usage() {
    echo "Let's Encrypt Force Renewal Tool"
    echo
    echo "Usage: $0 [METHOD]"
    echo
    echo "Methods:"
    echo "  1, force      - Force renew existing certificate"
    echo "  2, recreate   - Delete and recreate certificate"
    echo "  3, staging    - Force renew with staging (testing)"
    echo "  4, verbose    - Manual with verbose debugging"
    echo "  5, clean      - Clean slate (remove all, start fresh)"
    echo "  list          - List current certificates"
    echo "  help          - Show this help"
    echo
    echo "Examples:"
    echo "  $0 force      # Quick force renewal"
    echo "  $0 recreate   # If certificate is corrupted"
    echo "  $0 staging    # Test with staging environment"
    echo "  $0 clean      # Nuclear option - start completely fresh"
}

# Main execution
main() {
    print_header
    
    # Check environment
    check_env
    echo
    
    # Handle arguments
    METHOD=${1:-""}
    
    case "$METHOD" in
        "1"|"force")
            list_certificates
            echo
            if force_renew_existing; then
                restart_nginx
            else
                print_info "Trying method 2 (recreate)..."
                delete_and_recreate && restart_nginx
            fi
            ;;
        "2"|"recreate")
            list_certificates
            echo
            delete_and_recreate && restart_nginx
            ;;
        "3"|"staging")
            force_renew_staging
            ;;
        "4"|"verbose")
            manual_verbose
            ;;
        "5"|"clean")
            clean_slate && restart_nginx
            ;;
        "list")
            list_certificates
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        "")
            print_info "No method specified, trying force renewal..."
            list_certificates
            echo
            if force_renew_existing; then
                restart_nginx
            else
                print_info "Force renewal failed, trying recreate method..."
                delete_and_recreate && restart_nginx
            fi
            ;;
        *)
            print_error "Unknown method: $METHOD"
            echo
            show_usage
            exit 1
            ;;
    esac
    
    echo
    print_info "Certificate renewal process completed!"
    print_info "Access your site: https://$DOMAIN"
}

# Run main function
main "$@"
