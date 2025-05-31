#!/bin/bash

# MongoDB Quick Start Script for Doc2FormJSON
# This script provides easy commands to manage MongoDB

set -e

CONTAINER_NAME="doc2formjson-mongodb"
DB_NAME="doc2formjson"
APP_USER="doc2formapp"
APP_PASSWORD="apppassword123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if MongoDB container is running
check_mongodb_status() {
    if docker ps | grep -q $CONTAINER_NAME; then
        print_success "MongoDB container is running"
        return 0
    else
        print_error "MongoDB container is not running"
        return 1
    fi
}

# Start MongoDB container
start_mongodb() {
    print_header "Starting MongoDB Container"
    
    if check_mongodb_status; then
        print_warning "MongoDB is already running"
        return 0
    fi
    
    echo "Starting MongoDB container..."
    docker-compose up -d mongodb
    
    echo "Waiting for MongoDB to be ready..."
    sleep 10
    
    # Wait for health check
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if docker exec $CONTAINER_NAME mongo --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            print_success "MongoDB is ready!"
            return 0
        fi
        
        echo "Waiting for MongoDB... (attempt $((attempts + 1))/$max_attempts)"
        sleep 2
        attempts=$((attempts + 1))
    done
    
    print_error "MongoDB failed to start within expected time"
    return 1
}

# Stop MongoDB container
stop_mongodb() {
    print_header "Stopping MongoDB Container"
    docker-compose down mongodb
    print_success "MongoDB container stopped"
}

# Connect to MongoDB shell
connect_mongodb() {
    print_header "Connecting to MongoDB"
    
    if ! check_mongodb_status; then
        print_error "MongoDB is not running. Start it first with: $0 start"
        return 1
    fi
    
    echo "Connecting to MongoDB as application user..."
    echo "Use 'exit' to disconnect"
    echo ""
    
    docker exec -it $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME"
}

# Show MongoDB logs
show_logs() {
    print_header "MongoDB Logs"
    
    if ! check_mongodb_status; then
        print_error "MongoDB is not running"
        return 1
    fi
    
    docker logs -f $CONTAINER_NAME
}

# Show database stats
show_stats() {
    print_header "Database Statistics"
    
    if ! check_mongodb_status; then
        print_error "MongoDB is not running"
        return 1
    fi
    
    echo "Fetching database statistics..."
    docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --eval "
            print('=== Database Info ===');
            print('Database: ' + db.getName());
            print('Collections: ' + db.getCollectionNames().join(', '));
            print('');
            
            print('=== Collection Stats ===');
            db.getCollectionNames().forEach(function(collection) {
                var stats = db[collection].stats();
                print(collection + ': ' + stats.count + ' documents, ' + 
                      (stats.storageSize / 1024).toFixed(2) + ' KB');
            });
            
            print('');
            print('=== Recent Form Submissions ===');
            db.form_submissions.find({}, {formTitle: 1, 'userInfo.submittedBy': 1, 'submissionMetadata.submittedAt': 1})
                .sort({'submissionMetadata.submittedAt': -1})
                .limit(5)
                .forEach(function(doc) {
                    print('• ' + (doc.formTitle || 'Untitled') + ' by ' + 
                          doc.userInfo.submittedBy + ' on ' + 
                          new Date(doc.submissionMetadata.submittedAt).toDateString());
                });
        "
}

# Backup database
backup_database() {
    print_header "Creating Database Backup"
    
    if ! check_mongodb_status; then
        print_error "MongoDB is not running"
        return 1
    fi
    
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    echo "Creating backup in: $backup_dir"
    
    docker exec $CONTAINER_NAME mongodump \
        --db $DB_NAME \
        --out /tmp/backup
    
    docker cp "$CONTAINER_NAME:/tmp/backup/$DB_NAME" "$backup_dir/"
    
    print_success "Backup created: $backup_dir"
}

# Reset database
reset_database() {
    print_header "Resetting Database"
    
    print_warning "This will delete ALL data in the database!"
    read -p "Are you sure? (type 'yes' to confirm): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "Operation cancelled"
        return 0
    fi
    
    if ! check_mongodb_status; then
        print_error "MongoDB is not running"
        return 1
    fi
    
    echo "Dropping database..."
    docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --eval "db.dropDatabase()"
    
    echo "Re-running initialization scripts..."
    docker exec $CONTAINER_NAME mongo $DB_NAME < mongodb/init-scripts/01-init-database.js
    
    print_success "Database reset complete"
}

# Show help
show_help() {
    print_header "MongoDB Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start        Start MongoDB container"
    echo "  stop         Stop MongoDB container"
    echo "  status       Check MongoDB status"
    echo "  connect      Connect to MongoDB shell"
    echo "  logs         Show MongoDB logs"
    echo "  stats        Show database statistics"
    echo "  backup       Create database backup"
    echo "  reset        Reset database (WARNING: deletes all data)"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start     # Start MongoDB"
    echo "  $0 connect   # Open MongoDB shell"
    echo "  $0 stats     # Show database info"
    echo ""
}

# Main script logic
case "${1:-help}" in
    start)
        start_mongodb
        ;;
    stop)
        stop_mongodb
        ;;
    status)
        check_mongodb_status
        ;;
    connect)
        connect_mongodb
        ;;
    logs)
        show_logs
        ;;
    stats)
        show_stats
        ;;
    backup)
        backup_database
        ;;
    reset)
        reset_database
        ;;
    help|*)
        show_help
        ;;
esac
