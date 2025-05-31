#!/bin/bash

# Test MongoDB Integration for Doc2FormJSON
# This script tests the MongoDB setup and data operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

CONTAINER_NAME="doc2formjson-mongodb"
DB_NAME="doc2formjson"
APP_USER="doc2formapp"
APP_PASSWORD="apppassword123"
API_URL="http://localhost:3000"

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

# Test MongoDB connection
test_mongodb_connection() {
    print_header "Testing MongoDB Connection"
    
    if ! docker ps | grep -q $CONTAINER_NAME; then
        print_error "MongoDB container is not running"
        return 1
    fi
    
    # Test admin connection
    print_info "Testing admin connection..."
    if docker exec $CONTAINER_NAME mongo --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "Admin connection successful"
    else
        print_error "Admin connection failed"
        return 1
    fi
    
    # Test application user connection
    print_info "Testing application user connection..."
    if docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --eval "db.runCommand({ping: 1})" > /dev/null 2>&1; then
        print_success "Application user connection successful"
    else
        print_error "Application user connection failed"
        return 1
    fi
}

# Test database schema
test_database_schema() {
    print_header "Testing Database Schema"
    
    print_info "Checking collections..."
    local collections=$(docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --quiet --eval "db.getCollectionNames().join(', ')")
    
    echo "Collections found: $collections"
    
    # Check required collections
    local required_collections=("form_submissions" "forms" "users" "form_templates")
    
    for collection in "${required_collections[@]}"; do
        if echo "$collections" | grep -q "$collection"; then
            print_success "Collection '$collection' exists"
        else
            print_warning "Collection '$collection' not found"
        fi
    done
}

# Test indexes
test_indexes() {
    print_header "Testing Database Indexes"
    
    print_info "Checking indexes on form_submissions collection..."
    docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --eval "
            db.form_submissions.getIndexes().forEach(function(index) {
                print('Index: ' + JSON.stringify(index.key) + ' - ' + (index.name || 'unnamed'));
            });
        "
}

# Insert test data
insert_test_data() {
    print_header "Inserting Test Data"
    
    print_info "Inserting test form submission..."
    
    local test_data=$(cat << 'EOF'
{
    formId: "test-form-001",
    formTitle: "Test Form Submission",
    formData: {
        fullName: "John Doe",
        email: "john.doe@example.com",
        age: 30,
        comments: "This is a test submission from the integration test"
    },
    userInfo: {
        userId: "test-user-001",
        username: "johndoe",
        submittedBy: "John Doe"
    },
    submissionMetadata: {
        submittedAt: new Date(),
        formVersion: "1.0",
        totalFields: 4,
        filledFields: 4,
        source: "integration-test"
    },
    updatedAt: new Date()
}
EOF
)
    
    docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --eval "
            var result = db.form_submissions.insertOne($test_data);
            print('Test data inserted with ID: ' + result.insertedId);
        "
    
    print_success "Test data inserted successfully"
}

# Test search functionality
test_search_functionality() {
    print_header "Testing Search Functionality"
    
    print_info "Testing text search..."
    
    # Search by form title
    print_info "Searching by form title..."
    local title_results=$(docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --quiet --eval "db.form_submissions.find({formTitle: /Test/i}).count()")
    
    echo "Found $title_results submissions with 'Test' in title"
    
    # Search by user
    print_info "Searching by user..."
    local user_results=$(docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --quiet --eval "db.form_submissions.find({'userInfo.submittedBy': /John/i}).count()")
    
    echo "Found $user_results submissions by users with 'John' in name"
    
    # Full text search
    print_info "Testing full text search..."
    local text_results=$(docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --quiet --eval "db.form_submissions.find({\$text: {\$search: 'test'}}).count()")
    
    echo "Found $text_results submissions containing 'test'"
}

# Test API integration
test_api_integration() {
    print_header "Testing API Integration"
    
    # Check if API is running
    if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
        print_warning "API is not running at $API_URL"
        print_info "Start the API service first: docker-compose up -d doc2formjson-api"
        return 0
    fi
    
    print_success "API is responding"
    
    # Test form data retrieval
    print_info "Testing form data retrieval..."
    local api_response=$(curl -s "$API_URL/api/forms-data?page=1&pageSize=5")
    
    if echo "$api_response" | grep -q "success"; then
        print_success "API form data retrieval working"
        echo "Response preview: $(echo "$api_response" | head -c 200)..."
    else
        print_error "API form data retrieval failed"
        echo "Response: $api_response"
    fi
    
    # Test search endpoint
    print_info "Testing search endpoint..."
    local search_response=$(curl -s "$API_URL/api/forms-data/search?search=test&page=1&pageSize=5")
    
    if echo "$search_response" | grep -q "success"; then
        print_success "API search functionality working"
        echo "Search response preview: $(echo "$search_response" | head -c 200)..."
    else
        print_error "API search functionality failed"
        echo "Response: $search_response"
    fi
}

# Show database statistics
show_statistics() {
    print_header "Database Statistics"
    
    docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --eval "
            print('=== Database Statistics ===');
            print('Database: ' + db.getName());
            print('Collections: ' + db.getCollectionNames().join(', '));
            print('');
            
            print('=== Collection Document Counts ===');
            db.getCollectionNames().forEach(function(collection) {
                var count = db[collection].countDocuments();
                print(collection + ': ' + count + ' documents');
            });
            
            print('');
            print('=== Recent Form Submissions ===');
            var submissions = db.form_submissions.find({}, {
                formTitle: 1, 
                'userInfo.submittedBy': 1, 
                'submissionMetadata.submittedAt': 1
            }).sort({'submissionMetadata.submittedAt': -1}).limit(5);
            
            submissions.forEach(function(doc) {
                print('• ' + (doc.formTitle || 'Untitled') + ' by ' + 
                      doc.userInfo.submittedBy + ' on ' + 
                      new Date(doc.submissionMetadata.submittedAt).toDateString());
            });
        "
}

# Cleanup test data
cleanup_test_data() {
    print_header "Cleaning Up Test Data"
    
    print_info "Removing test submissions..."
    docker exec $CONTAINER_NAME mongo \
        "mongodb://$APP_USER:$APP_PASSWORD@localhost:27017/$DB_NAME" \
        --eval "
            var result = db.form_submissions.deleteMany({'submissionMetadata.source': 'integration-test'});
            print('Removed ' + result.deletedCount + ' test submissions');
        "
    
    print_success "Test data cleanup completed"
}

# Main test execution
main() {
    print_header "🧪 MongoDB Integration Test Suite"
    echo ""
    
    local failed_tests=0
    
    # Run tests
    test_mongodb_connection || ((failed_tests++))
    echo ""
    
    test_database_schema || ((failed_tests++))
    echo ""
    
    test_indexes || ((failed_tests++))
    echo ""
    
    insert_test_data || ((failed_tests++))
    echo ""
    
    test_search_functionality || ((failed_tests++))
    echo ""
    
    test_api_integration || ((failed_tests++))
    echo ""
    
    show_statistics
    echo ""
    
    # Ask about cleanup
    read -p "Clean up test data? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        cleanup_test_data
        echo ""
    fi
    
    # Summary
    print_header "Test Summary"
    
    if [ $failed_tests -eq 0 ]; then
        print_success "🎉 All tests passed! MongoDB integration is working correctly."
    else
        print_error "⚠️  $failed_tests test(s) failed. Check the output above for details."
    fi
    
    echo ""
    print_info "For more MongoDB operations, use: ./mongodb-manager.sh"
}

# Run tests
main "$@"
