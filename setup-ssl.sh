#!/bin/bash

# DynaForm Let's Encrypt SSL Setup Script
# This script sets up DynaForm with Let's Encrypt SSL certificates (FREE & AUTOMATIC)

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_DOMAIN="dynaform.xyz"
DEFAULT_EMAIL="bunnyppl@gmail.com"
COMPOSE_FILE="docker-compose.ssl.yml"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "         DynaForm SSL Setup Script"
    echo "=================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if domain is provided
check_domain() {
    if [ -z "$1" ]; then
        print_warning "No domain provided. Using localhost (self-signed certificates)"
        echo "For production use: ./setup-ssl.sh yourdomain.com your-email@domain.com"
        return 1
    fi
    return 0
}

# Check prerequisites
check_prerequisites() {
    local domain=$1
    
    # Check if Docker is running
    if ! docker ps > /dev/null 2>&1; then
        print_error "Docker is not running! Please start Docker first."
        return 1
    fi
    
    # Check if domain resolves to this server (for non-localhost)
    if [ "$domain" != "localhost" ]; then
        print_info "Checking DNS resolution for $domain..."
        
        # Get domain IP
        DOMAIN_IP=$(dig +short "$domain" | tail -n1)
        if [ -z "$DOMAIN_IP" ]; then
            print_warning "Domain $domain does not resolve to any IP address"
            print_info "Make sure your domain's A record is set correctly"
            return 1
        fi
        
        print_info "Domain $domain resolves to: $DOMAIN_IP"
        
        # Try to get public IP
        PUBLIC_IP=$(curl -s --max-time 10 ifconfig.me 2>/dev/null || curl -s --max-time 10 ipinfo.io/ip 2>/dev/null || echo "unknown")
        if [ "$PUBLIC_IP" != "unknown" ]; then
            print_info "Server public IP: $PUBLIC_IP"
            if [ "$DOMAIN_IP" != "$PUBLIC_IP" ]; then
                print_warning "Domain IP ($DOMAIN_IP) doesn't match server IP ($PUBLIC_IP)"
                print_info "This might cause certificate validation to fail"
            fi
        fi
    fi
    
    return 0
}

# Validate email format
validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Create environment file
create_env_file() {
    local domain=$1
    local email=$2
    
    print_step "Creating environment configuration..."
    
    cat > .env.ssl << EOF
# DynaForm SSL Configuration
DOMAIN_NAME=$domain
SSL_EMAIL=$email
BUILD_TIMESTAMP=$(date +%s)

# Database Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password123
MONGO_INITDB_DATABASE=doc2formjson
MONGODB_APP_USERNAME=doc2formapp
MONGODB_APP_PASSWORD=apppassword123

# Ollama Configuration
OLLAMA_MODELS=qwen2.5vl:latest
OLLAMA_GPU_MEMORY_FRACTION=0.3

# Development/Production Mode
NODE_ENV=production
FLASK_ENV=production
EOF

    print_info "Environment file created: .env.ssl"
}

# Initial certificate setup
setup_initial_certificates() {
    local domain=$1
    local email=$2
    
    if [ "$domain" = "localhost" ]; then
        print_step "Setting up self-signed certificates for localhost..."
        return 0
    fi
    
    print_step "Setting up Let's Encrypt certificates for $domain..."
    
    # Clean up any existing failed attempts
    print_info "Cleaning up any previous certificate attempts..."
    docker compose -f $COMPOSE_FILE --env-file .env.ssl run --rm certbot \
        delete --cert-name $domain --non-interactive 2>/dev/null || true
    
    # Create directory for ACME challenge
    mkdir -p ./certbot-www
    
    # Start nginx temporarily for ACME challenge
    print_info "Starting temporary nginx for certificate verification..."
    docker compose -f $COMPOSE_FILE --env-file .env.ssl up -d dynaform-nginx
    
    # Wait for nginx to be ready
    sleep 10
    
    # Obtain certificates
    print_info "Requesting SSL certificate from Let's Encrypt..."
    
    # First, try to obtain the certificate
    if docker compose -f $COMPOSE_FILE --env-file .env.ssl run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email $email --agree-tos --no-eff-email \
        --force-renewal -d $domain; then
        print_info "SSL certificate obtained successfully!"
    else
        print_error "Failed to obtain SSL certificate!"
        print_info "This might be due to:"
        print_info "1. Domain DNS not pointing to this server"
        print_info "2. Port 80 not accessible from internet"
        print_info "3. Domain not properly configured"
        print_info ""
        print_info "Please check your domain configuration and try again."
        return 1
    fi
    
    # Stop temporary nginx
    docker compose -f $COMPOSE_FILE --env-file .env.ssl stop dynaform-nginx
}

# Setup automatic certificate renewal
setup_certificate_renewal() {
    print_step "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > renew-certificates.sh << 'EOF'
#!/bin/bash
# Certificate renewal script for DynaForm

echo "Starting certificate renewal process..."
docker compose -f docker-compose.ssl.yml --env-file .env.ssl run --rm certbot renew

# Reload nginx to use new certificates
echo "Reloading nginx..."
docker compose -f docker-compose.ssl.yml --env-file .env.ssl exec dynaform-nginx nginx -s reload

echo "Certificate renewal completed!"
EOF

    chmod +x renew-certificates.sh
    
    print_info "Certificate renewal script created: renew-certificates.sh"
    print_info "Add this to your crontab to run daily:"
    print_info "0 3 * * * /path/to/your/project/renew-certificates.sh"
}

# Build and start services
start_services() {
    print_step "Building and starting DynaForm services..."
    
    # Build images
    print_info "Building Docker images..."
    docker compose -f $COMPOSE_FILE --env-file .env.ssl build --no-cache
    
    # Start services
    print_info "Starting services..."
    docker compose -f $COMPOSE_FILE --env-file .env.ssl up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 30
    
    # Check service health
    print_step "Checking service health..."
    docker compose -f $COMPOSE_FILE --env-file .env.ssl ps
}

# Display completion message
display_completion() {
    local domain=$1
    
    print_header
    echo -e "${GREEN}✅ DynaForm SSL setup completed successfully!${NC}"
    echo
    echo "🌐 Application URL:"
    if [ "$domain" = "localhost" ]; then
        echo "   https://localhost (with self-signed certificate)"
        echo "   Note: You'll need to accept the security warning in your browser"
    else
        echo "   https://$domain"
    fi
    echo
    echo "📋 Service URLs:"
    echo "   - Frontend: https://$domain"
    echo "   - API: https://$domain/api/"
    echo "   - PDF Converter: https://$domain/conversion/"
    echo "   - Health Check: https://$domain/health"
    echo
    echo "🔧 Management Commands:"
    echo "   - View logs: docker compose -f $COMPOSE_FILE --env-file .env.ssl logs -f"
    echo "   - Stop services: docker compose -f $COMPOSE_FILE --env-file .env.ssl down"
    echo "   - Restart services: docker compose -f $COMPOSE_FILE --env-file .env.ssl restart"
    echo "   - Renew certificates: ./renew-certificates.sh"
    echo
    echo "📁 Important files:"
    echo "   - Docker Compose: $COMPOSE_FILE"
    echo "   - Environment: .env.ssl"
    echo "   - Nginx Config: dynaform/nginx.ssl.conf"
    echo "   - Certificate Renewal: renew-certificates.sh"
    echo
}

# Main execution
main() {
    print_header
    
    # Parse arguments
    DOMAIN=${1:-$DEFAULT_DOMAIN}
    EMAIL=${2:-$DEFAULT_EMAIL}
    
    # Validate inputs
    if [ "$DOMAIN" != "localhost" ]; then
        if ! validate_email "$EMAIL"; then
            print_error "Invalid email format: $EMAIL"
            exit 1
        fi
    fi
    
    print_info "Domain: $DOMAIN"
    print_info "Email: $EMAIL"
    echo
    
    # Check prerequisites
    if ! check_prerequisites "$DOMAIN"; then
        print_error "Prerequisites check failed!"
        exit 1
    fi
    echo
    
    # Create environment file
    create_env_file "$DOMAIN" "$EMAIL"
    
    # Setup certificates
    if [ "$DOMAIN" != "localhost" ]; then
        setup_initial_certificates "$DOMAIN" "$EMAIL"
        setup_certificate_renewal
    fi
    
    # Start services
    start_services
    
    # Display completion message
    display_completion "$DOMAIN"
}

# Handle script interruption
trap 'print_error "Setup interrupted!"; exit 1' INT TERM

# Check if running as root (for port 443)
if [ "$(id -u)" -eq 0 ] || groups | grep -q docker; then
    main "$@"
else
    print_error "This script requires root privileges or Docker group membership to bind to port 443"
    print_info "Try running with sudo or add your user to the docker group"
    exit 1
fi
