#!/bin/bash

# Certificate renewal script for DynaForm SSL setup
# This script should be run periodically (e.g., via cron) to renew SSL certificates

set -e

# Configuration
COMPOSE_FILE="docker-compose.ssl.yml"
ENV_FILE=".env.ssl"
LOG_FILE="./certificate-renewal.log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if required files exist
check_requirements() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Check if services are running
check_services() {
    log_info "Checking service status..."
    
    if ! docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps | grep -q "Up"; then
        log_warning "Some services are not running. Starting services..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
        sleep 30
    fi
}

# Renew certificates
renew_certificates() {
    log_info "Starting certificate renewal process..."
    
    # Run certbot renewal
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm certbot renew; then
        log_info "Certificate renewal completed successfully"
        return 0
    else
        log_error "Certificate renewal failed"
        return 1
    fi
}

# Reload nginx
reload_nginx() {
    log_info "Reloading nginx configuration..."
    
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T dynaform-nginx nginx -s reload; then
        log_info "Nginx reloaded successfully"
        return 0
    else
        log_error "Failed to reload nginx"
        return 1
    fi
}

# Check certificate expiry
check_certificate_expiry() {
    log_info "Checking certificate expiry dates..."
    
    # Get domain from environment file
    DOMAIN=$(grep DOMAIN_NAME "$ENV_FILE" | cut -d'=' -f2)
    
    if [ "$DOMAIN" != "localhost" ]; then
        # Check certificate expiry
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm certbot certificates
    else
        log_info "Using localhost/self-signed certificates - no expiry check needed"
    fi
}

# Send notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    # You can implement notification logic here (email, Slack, etc.)
    # For now, just log the message
    log_info "Notification: $status - $message"
}

# Cleanup old logs
cleanup_logs() {
    # Keep only last 30 days of logs
    if [ -f "$LOG_FILE" ]; then
        tail -1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
}

# Main execution
main() {
    log_info "=== Certificate Renewal Process Started ==="
    
    # Check requirements
    check_requirements
    
    # Cleanup old logs
    cleanup_logs
    
    # Check services
    check_services
    
    # Check current certificate status
    check_certificate_expiry
    
    # Attempt renewal
    if renew_certificates; then
        # Reload nginx if renewal was successful
        if reload_nginx; then
            log_info "Certificate renewal and nginx reload completed successfully"
            send_notification "SUCCESS" "SSL certificates renewed successfully"
        else
            log_error "Certificate renewed but nginx reload failed"
            send_notification "WARNING" "SSL certificates renewed but nginx reload failed"
            exit 1
        fi
    else
        log_error "Certificate renewal failed"
        send_notification "ERROR" "SSL certificate renewal failed"
        exit 1
    fi
    
    log_info "=== Certificate Renewal Process Completed ==="
}

# Handle script interruption
trap 'log_error "Certificate renewal interrupted!"; exit 1' INT TERM

# Change to script directory
cd "$(dirname "$0")"

# Run main function
main "$@"
