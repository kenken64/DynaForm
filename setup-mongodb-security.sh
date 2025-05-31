#!/bin/bash

# MongoDB Password Generator and Setup Script
# This script generates secure passwords and sets up the secrets files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Generate secure password
generate_password() {
    local length=${1:-32}
    # Generate password with alphanumeric characters and some special chars
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Create secrets directory
create_secrets_directory() {
    print_info "Creating secrets directory..."
    mkdir -p secrets
    chmod 700 secrets
    print_success "Secrets directory created with restricted permissions"
}

# Generate and save passwords
generate_passwords() {
    print_header "Generating Secure MongoDB Passwords"
    
    # Generate passwords
    local root_password=$(generate_password 24)
    local app_password=$(generate_password 32)
    local reader_password=$(generate_password 24)
    
    # Save to secret files
    echo "$root_password" > secrets/mongo_root_password.txt
    echo "$app_password" > secrets/mongo_app_password.txt
    echo "$reader_password" > secrets/mongo_reader_password.txt
    
    # Set restrictive permissions
    chmod 600 secrets/*.txt
    
    print_success "Generated root password: ${root_password:0:8}... (24 characters)"
    print_success "Generated app password: ${app_password:0:8}... (32 characters)"  
    print_success "Generated reader password: ${reader_password:0:8}... (24 characters)"
    
    # Create .env.secrets file
    create_env_secrets_file "$root_password" "$app_password" "$reader_password"
    
    return 0
}

# Create .env.secrets file
create_env_secrets_file() {
    local root_password="$1"
    local app_password="$2" 
    local reader_password="$3"
    
    print_info "Creating .env.secrets file..."
    
    cat > .env.secrets << EOF
# MongoDB Credentials - GENERATED AUTOMATICALLY
# DO NOT COMMIT TO VERSION CONTROL

# MongoDB Root Admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=$root_password

# MongoDB Application Database
MONGO_INITDB_DATABASE=doc2formjson

# MongoDB Application User (used by API)
MONGODB_APP_USERNAME=doc2formapp
MONGODB_APP_PASSWORD=$app_password

# MongoDB Read-only User (for analytics)
MONGODB_READER_USERNAME=doc2formreader
MONGODB_READER_PASSWORD=$reader_password

# Connection URIs
MONGODB_URI=mongodb://doc2formapp:$app_password@mongodb:27017/doc2formjson
MONGODB_ADMIN_URI=mongodb://admin:$root_password@mongodb:27017/admin

# Generation timestamp
GENERATED_AT=$(date)
EOF
    
    chmod 600 .env.secrets
    print_success ".env.secrets file created with secure permissions"
}

# Update API .env file
update_api_env() {
    print_info "Updating API .env file..."
    
    local app_password=$(cat secrets/mongo_app_password.txt)
    local env_file="describeImge/.env"
    
    if [ -f "$env_file" ]; then
        # Backup original
        cp "$env_file" "$env_file.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Update MongoDB URI in API .env file
        sed -i.tmp "s|MONGODB_URI=.*|MONGODB_URI=mongodb://doc2formapp:$app_password@mongodb:27017/doc2formjson|g" "$env_file"
        sed -i.tmp "s|MONGODB_PASSWORD=.*|MONGODB_PASSWORD=$app_password|g" "$env_file"
        rm "$env_file.tmp" 2>/dev/null || true
        
        print_success "API .env file updated with new MongoDB credentials"
    else
        print_warning "API .env file not found at $env_file"
    fi
}

# Create .gitignore entries
update_gitignore() {
    print_info "Updating .gitignore to protect secrets..."
    
    local gitignore_entries="
# MongoDB Secrets
secrets/
.env.secrets
*.env.secrets
*password*.txt

# Backup files
*.backup.*"
    
    if [ -f .gitignore ]; then
        # Check if entries already exist
        if ! grep -q "# MongoDB Secrets" .gitignore; then
            echo "$gitignore_entries" >> .gitignore
            print_success "Added security entries to .gitignore"
        else
            print_info ".gitignore already contains security entries"
        fi
    else
        echo "$gitignore_entries" > .gitignore
        print_success "Created .gitignore with security entries"
    fi
}

# Show security instructions
show_security_instructions() {
    print_header "🔐 Security Setup Complete"
    
    echo ""
    echo -e "${GREEN}✅ Secure passwords generated and stored${NC}"
    echo -e "${GREEN}✅ Docker secrets configured${NC}"
    echo -e "${GREEN}✅ Environment files updated${NC}"
    echo -e "${GREEN}✅ .gitignore configured${NC}"
    echo ""
    
    print_header "📋 Next Steps"
    echo ""
    echo "1. Use the secure Docker Compose file:"
    echo "   ${YELLOW}docker-compose -f docker-compose.secure.yml up -d${NC}"
    echo ""
    echo "2. Or update your existing docker-compose.yml to use secrets"
    echo ""
    echo "3. Verify secrets are not committed to version control:"
    echo "   ${YELLOW}git status${NC}"
    echo ""
    
    print_header "🗂️ Files Created"
    echo ""
    echo "• ${BLUE}secrets/mongo_root_password.txt${NC} - Root admin password"
    echo "• ${BLUE}secrets/mongo_app_password.txt${NC} - Application user password"  
    echo "• ${BLUE}secrets/mongo_reader_password.txt${NC} - Read-only user password"
    echo "• ${BLUE}.env.secrets${NC} - Environment variables with generated passwords"
    echo "• ${BLUE}docker-compose.secure.yml${NC} - Secure Docker Compose configuration"
    echo ""
    
    print_header "⚠️ Important Security Notes"
    echo ""
    echo "• ${RED}Never commit secret files to version control${NC}"
    echo "• ${YELLOW}Store passwords in a secure password manager${NC}"
    echo "• ${YELLOW}Rotate passwords regularly in production${NC}"
    echo "• ${YELLOW}Use proper backup procedures for secret files${NC}"
    echo "• ${YELLOW}Consider using external secret management in production${NC}"
    echo ""
}

# Main execution
main() {
    print_header "🔐 MongoDB Security Setup"
    echo ""
    
    # Check if secrets already exist
    if [ -d "secrets" ] && [ -f "secrets/mongo_root_password.txt" ]; then
        print_warning "Secrets directory already exists!"
        echo ""
        read -p "Do you want to regenerate passwords? This will invalidate existing containers. (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing passwords"
            exit 0
        fi
    fi
    
    # Run setup steps
    create_secrets_directory
    generate_passwords
    update_api_env
    update_gitignore
    show_security_instructions
    
    print_success "🎉 MongoDB security setup completed!"
}

# Check dependencies
check_dependencies() {
    if ! command -v openssl &> /dev/null; then
        print_error "openssl is required but not installed"
        exit 1
    fi
}

# Run main function
check_dependencies
main "$@"
