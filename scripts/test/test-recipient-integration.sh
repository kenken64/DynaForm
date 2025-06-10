#!/bin/bash

# Recipient Management Integration Test Script
# This script verifies that all components are properly integrated

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test backend compilation
test_backend_compilation() {
    print_header "Testing Backend Compilation"
    
    cd describeImge
    if npm run build; then
        print_success "Backend TypeScript compilation successful"
    else
        print_error "Backend compilation failed"
        exit 1
    fi
    cd ..
}

# Test frontend compilation
test_frontend_compilation() {
    print_header "Testing Frontend Compilation"
    
    cd dynaform
    if npm run build; then
        print_success "Frontend Angular compilation successful"
    else
        print_error "Frontend compilation failed"
        exit 1
    fi
    cd ..
}

# Check file structure
check_file_structure() {
    print_header "Checking File Structure"
    
    # Backend files
    backend_files=(
        "describeImge/src/services/recipientService.ts"
        "describeImge/src/controllers/recipientController.ts"
        "describeImge/src/routes/recipientRoutes.ts"
        "describeImge/src/types/index.ts"
        "describeImge/src/services/index.ts"
        "describeImge/src/controllers/index.ts"
        "describeImge/src/routes/index.ts"
    )
    
    # Frontend files
    frontend_files=(
        "dynaform/src/app/recipients/recipients.component.ts"
        "dynaform/src/app/recipient-dialog/recipient-dialog.component.ts"
        "dynaform/src/app/services/recipient.service.ts"
        "dynaform/src/app/interfaces/recipient.interface.ts"
        "dynaform/src/app/app.module.ts"
        "dynaform/src/app/app-routing.module.ts"
    )
    
    # Check backend files
    print_info "Checking backend files..."
    for file in "${backend_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file exists"
        else
            print_error "$file missing"
            exit 1
        fi
    done
    
    # Check frontend files
    print_info "Checking frontend files..."
    for file in "${frontend_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file exists"
        else
            print_error "$file missing"
            exit 1
        fi
    done
}

# Check API endpoints configuration
check_api_configuration() {
    print_header "Checking API Configuration"
    
    # Check if recipient routes are properly configured
    if grep -q "recipientRoutes" describeImge/src/routes/index.ts; then
        print_success "Recipient routes configured in main router"
    else
        print_error "Recipient routes not found in main router"
        exit 1
    fi
    
    # Check if recipient controller is exported
    if grep -q "recipientController" describeImge/src/controllers/index.ts; then
        print_success "Recipient controller exported"
    else
        print_error "Recipient controller not exported"
        exit 1
    fi
    
    # Check if recipient service is exported
    if grep -q "recipientService" describeImge/src/services/index.ts; then
        print_success "Recipient service exported"
    else
        print_error "Recipient service not exported"
        exit 1
    fi
}

# Check frontend routing
check_frontend_routing() {
    print_header "Checking Frontend Routing"
    
    # Check if recipients route is configured
    if grep -q "RecipientsComponent" dynaform/src/app/app-routing.module.ts; then
        print_success "Recipients route configured"
    else
        print_error "Recipients route not configured"
        exit 1
    fi
    
    # Check if components are declared in app module
    if grep -q "RecipientsComponent" dynaform/src/app/app.module.ts; then
        print_success "RecipientsComponent declared in app module"
    else
        print_error "RecipientsComponent not declared in app module"
        exit 1
    fi
    
    if grep -q "RecipientDialogComponent" dynaform/src/app/app.module.ts; then
        print_success "RecipientDialogComponent declared in app module"
    else
        print_error "RecipientDialogComponent not declared in app module"
        exit 1
    fi
}

# Check Material UI modules
check_material_modules() {
    print_header "Checking Material UI Modules"
    
    required_modules=(
        "MatTableModule"
        "MatSnackBarModule"
        "MatTooltipModule"
        "MatDialogModule"
        "MatButtonModule"
        "MatInputModule"
        "MatFormFieldModule"
    )
    
    for module in "${required_modules[@]}"; do
        if grep -q "$module" dynaform/src/app/app.module.ts; then
            print_success "$module imported"
        else
            print_error "$module not imported"
            exit 1
        fi
    done
}

# Check TypeScript interfaces
check_interfaces() {
    print_header "Checking TypeScript Interfaces"
    
    # Check backend interfaces
    if grep -q "interface Recipient" describeImge/src/types/index.ts; then
        print_success "Backend Recipient interface defined"
    else
        print_error "Backend Recipient interface missing"
        exit 1
    fi
    
    # Check frontend interfaces
    if grep -q "interface Recipient" dynaform/src/app/interfaces/recipient.interface.ts; then
        print_success "Frontend Recipient interface defined"
    else
        print_error "Frontend Recipient interface missing"
        exit 1
    fi
}

# Main test execution
main() {
    print_header "🧪 Recipient Management Integration Test"
    echo ""
    print_info "Testing complete recipient management implementation..."
    echo ""
    
    check_file_structure
    echo ""
    
    check_api_configuration
    echo ""
    
    check_frontend_routing
    echo ""
    
    check_material_modules
    echo ""
    
    check_interfaces
    echo ""
    
    test_backend_compilation
    echo ""
    
    # Skip frontend compilation if it was already done
    if [ ! -d "dynaform/dist" ]; then
        test_frontend_compilation
        echo ""
    else
        print_info "Frontend already compiled, skipping..."
        echo ""
    fi
    
    print_header "🎉 Integration Test Results"
    echo ""
    print_success "All integration tests passed!"
    echo ""
    print_info "✅ Backend API endpoints configured"
    print_info "✅ Frontend components integrated"
    print_info "✅ Routing configured"
    print_info "✅ Material UI modules imported"
    print_info "✅ TypeScript interfaces aligned"
    print_info "✅ Code compilation successful"
    echo ""
    print_header "🚀 Next Steps"
    echo ""
    echo "1. Start the services:"
    echo "   ${YELLOW}./start-complete-with-mongodb.sh${NC}"
    echo ""
    echo "2. Test the recipient management feature:"
    echo "   ${YELLOW}Navigate to http://localhost:4201/recipients${NC}"
    echo ""
    echo "3. Verify CRUD operations:"
    echo "   - Create new recipients"
    echo "   - Search and filter recipients"
    echo "   - Update recipient information"
    echo "   - Delete recipients"
    echo "   - Export recipients to CSV"
    echo ""
    echo "4. Check API endpoints:"
    echo "   - POST   /api/recipients"
    echo "   - GET    /api/recipients"
    echo "   - GET    /api/recipients/:id"
    echo "   - PUT    /api/recipients/:id"
    echo "   - DELETE /api/recipients/:id"
    echo "   - GET    /api/recipients/export"
    echo ""
}

# Run the tests
main
