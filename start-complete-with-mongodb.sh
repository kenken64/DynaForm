#!/bin/bash

# Complete Doc2FormJSON Startup Script with MongoDB
# This script starts all services including MongoDB

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="Doc2FormJSON"
COMPOSE_PROJECT_NAME="doc2formjson"

# Service ports
MONGODB_PORT=27017
API_PORT=3000
PDF_CONVERTER_PORT=5001
OLLAMA_PORT=11434
FRONTEND_PORT=4201

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
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if ports are available
check_ports() {
    print_info "Checking port availability..."
    
    local ports=($MONGODB_PORT $API_PORT $PDF_CONVERTER_PORT $OLLAMA_PORT $FRONTEND_PORT)
    local port_names=("MongoDB" "API" "PDF Converter" "Ollama" "Frontend")
    local blocked_ports=()
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port ($name) is already in use"
            blocked_ports+=("$port ($name)")
        else
            print_success "Port $port ($name) is available"
        fi
    done
    
    if [ ${#blocked_ports[@]} -gt 0 ]; then
        print_warning "Some ports are blocked. Consider stopping existing services:"
        for port in "${blocked_ports[@]}"; do
            echo "  - $port"
        done
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Clean up existing containers
cleanup_containers() {
    print_info "Cleaning up existing containers..."
    
    # Stop and remove containers
    docker-compose down 2>/dev/null || true
    
    # Remove orphaned containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Build and start services
start_services() {
    print_header "Starting $PROJECT_NAME Services"
    
    # Set build timestamp for cache busting
    export BUILD_TIMESTAMP=$(date +%s)
    
    # Start services in dependency order
    print_info "Starting MongoDB..."
    docker-compose up -d mongodb
    
    # Wait for MongoDB to be ready
    print_info "Waiting for MongoDB to be ready..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if docker exec doc2formjson-mongodb mongo --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            print_success "MongoDB is ready!"
            break
        fi
        
        echo "Waiting for MongoDB... (attempt $((attempts + 1))/$max_attempts)"
        sleep 2
        attempts=$((attempts + 1))
        
        if [ $attempts -eq $max_attempts ]; then
            print_error "MongoDB failed to start within expected time"
            docker logs doc2formjson-mongodb
            exit 1
        fi
    done
    
    print_info "Starting Ollama service..."
    docker-compose up -d ollama-gpu
    
    print_info "Starting PDF converter..."
    docker-compose up -d pdf-converter
    
    print_info "Starting API service..."
    docker-compose up -d doc2formjson-api
    
    print_info "Starting frontend..."
    docker-compose up -d dynaform-frontend
    
    print_success "All services started successfully!"
}

# Wait for all services to be healthy
wait_for_services() {
    print_header "Waiting for Services to be Ready"
    
    local services=("MongoDB:$MONGODB_PORT" "API:$API_PORT" "PDF Converter:$PDF_CONVERTER_PORT" "Ollama:$OLLAMA_PORT" "Frontend:$FRONTEND_PORT")
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        print_info "Checking $name..."
        
        local attempts=0
        local max_attempts=30
        
        while [ $attempts -lt $max_attempts ]; do
            if nc -z localhost $port 2>/dev/null; then
                print_success "$name is responding on port $port"
                break
            fi
            
            sleep 2
            attempts=$((attempts + 1))
            
            if [ $attempts -eq $max_attempts ]; then
                print_warning "$name may not be fully ready on port $port"
            fi
        done
    done
}

# Show service status
show_status() {
    print_header "Service Status"
    
    echo ""
    docker-compose ps
    echo ""
    
    print_header "Application URLs"
    echo ""
    echo -e "${PURPLE}🌐 Frontend (Angular):${NC}     http://localhost:$FRONTEND_PORT"
    echo -e "${PURPLE}🔧 API (Node.js):${NC}         http://localhost:$API_PORT"
    echo -e "${PURPLE}📄 PDF Converter (Flask):${NC} http://localhost:$PDF_CONVERTER_PORT"
    echo -e "${PURPLE}🤖 Ollama (LLM):${NC}          http://localhost:$OLLAMA_PORT"
    echo -e "${PURPLE}🗄️  MongoDB:${NC}              mongodb://localhost:$MONGODB_PORT"
    echo ""
    
    print_header "Useful Commands"
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f [service-name]"
    echo ""
    echo "MongoDB management:"
    echo "  ./mongodb-manager.sh status    # Check MongoDB status"
    echo "  ./mongodb-manager.sh connect   # Connect to MongoDB shell"
    echo "  ./mongodb-manager.sh stats     # Show database statistics"
    echo ""
    echo "Stop all services:"
    echo "  docker-compose down"
    echo ""
}

# Setup Ollama models
setup_ollama_models() {
    print_header "Setting up Ollama Models"
    
    print_info "Waiting for Ollama to be ready..."
    sleep 10
    
    # Check if qwen2.5vl model is available
    if docker exec -i ollama-gpu ollama list | grep -q "qwen2.5vl:latest"; then
        print_success "qwen2.5vl:latest model is already available"
    else
        print_info "Downloading qwen2.5vl:latest model (this may take several minutes)..."
        docker exec -i ollama-gpu ollama pull qwen2.5vl:latest
        print_success "qwen2.5vl:latest model downloaded successfully"
    fi
}

# Main execution
main() {
    clear
    print_header "🚀 Starting $PROJECT_NAME Application Stack"
    echo ""
    
    # Pre-flight checks
    check_docker
    check_ports
    
    # Cleanup and start
    cleanup_containers
    start_services
    
    # Wait for services
    wait_for_services
    
    # Setup models
    setup_ollama_models
    
    # Show final status
    show_status
    
    print_success "🎉 $PROJECT_NAME is now running!"
    print_info "Press Ctrl+C to stop all services"
    
    # Keep script running and show logs
    echo ""
    echo "Following logs (Ctrl+C to stop):"
    echo ""
    
    trap 'echo ""; print_info "Stopping services..."; docker-compose down; print_success "All services stopped"; exit 0' INT
    
    docker-compose logs -f
}

# Run main function
main "$@"
