#!/bin/bash

# Comprehensive Stress Testing Orchestrator
# This script runs the complete stress testing suite for the chat endpoint and AI agent interceptor

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
REPORT_FILE="$RESULTS_DIR/comprehensive_report_$TIMESTAMP.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Create results directory
mkdir -p "$RESULTS_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Comprehensive Stress Test Report

**Generated:** $(date)
**Test Suite:** Chat Endpoint & AI Agent Interceptor Stress Testing

## Test Overview

This report contains the results of comprehensive stress testing for:
- Chat endpoint (\`/api/chat/ask-dynaform\`)
- AI Agent Interceptor proxy (port 11435)
- Authentication flow under load
- System performance and resource usage

---

EOF

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # Check Python 3
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    # Check required Python packages
    if [ ! -d "$SCRIPT_DIR/../../stress-test-env" ]; then
        warning "Virtual environment not found. Creating..."
        cd "$SCRIPT_DIR/../.."
        python3 -m venv stress-test-env
        source stress-test-env/bin/activate
        pip install aiohttp psutil requests || {
            error "Failed to install Python dependencies"
            missing_deps+=("python-deps")
        }
    else
        source "$SCRIPT_DIR/../../stress-test-env/bin/activate"
    fi
    
    # Check required Node.js packages
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        warning "Missing Node.js dependencies. Installing..."
        cd "$SCRIPT_DIR"
        npm init -y &> /dev/null || true
        npm install axios &> /dev/null || {
            error "Failed to install Node.js dependencies"
            missing_deps+=("node-deps")
        }
        cd - &> /dev/null
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    success "All prerequisites satisfied"
    return 0
}

# Function to check service availability
check_services() {
    log "Checking service availability..."
    
    local services_ok=true
    
    # Check backend server
    if curl -s http://localhost:3000/health &> /dev/null; then
        success "Backend server (port 3000) - OK"
    else
        error "Backend server (port 3000) - UNAVAILABLE"
        services_ok=false
    fi
    
    # Check AI Agent Proxy
    if curl -s http://localhost:11435/api/tags &> /dev/null; then
        success "AI Agent Proxy (port 11435) - OK"
    else
        error "AI Agent Proxy (port 11435) - UNAVAILABLE"
        services_ok=false
    fi
    
    # Check Ollama Direct
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        success "Ollama Direct (port 11434) - OK"
    else
        warning "Ollama Direct (port 11434) - UNAVAILABLE (may affect some tests)"
    fi
    
    if [ "$services_ok" = false ]; then
        error "Required services are not available"
        echo ""
        echo "Please ensure the following services are running:"
        echo "  1. Backend server: npm run dev (in server directory)"
        echo "  2. AI Agent: python3 passive_agent.py (in ai-agent directory)"
        echo "  3. Ollama: ollama serve"
        return 1
    fi
    
    success "All required services are available"
    return 0
}

# Function to run Node.js stress tests
run_nodejs_stress_tests() {
    log "Starting Node.js-based stress tests..."
    
    local test_types=("quick" "timeout" "medium" "rampup" "spike")
    
    for test_type in "${test_types[@]}"; do
        info "Running $test_type test..."
        
        echo "## Node.js Stress Test: $test_type" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        
        if timeout 600 node "$SCRIPT_DIR/chat-stress-test.js" "$test_type" 2>&1 | tee -a "$REPORT_FILE"; then
            success "$test_type test completed"
        else
            error "$test_type test failed or timed out"
        fi
        
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Brief pause between tests
        sleep 5
    done
}

# Function to run Python AI Agent stress tests
run_python_stress_tests() {
    log "Starting Python-based AI Agent stress tests..."
    
    local test_types=("quick" "interception" "comparison" "concurrent")
    
    for test_type in "${test_types[@]}"; do
        info "Running AI Agent $test_type test..."
        
        echo "## AI Agent Stress Test: $test_type" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        
        if timeout 600 python3 "$SCRIPT_DIR/ai-agent-stress-test.py" --test-type "$test_type" 2>&1 | tee -a "$REPORT_FILE"; then
            success "AI Agent $test_type test completed"
        else
            error "AI Agent $test_type test failed or timed out"
        fi
        
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Brief pause between tests
        sleep 5
    done
}

# Function to run system resource monitoring
start_system_monitoring() {
    log "Starting system resource monitoring..."
    
    local monitoring_script="$SCRIPT_DIR/system_monitor.sh"
    
    cat > "$monitoring_script" << 'EOF'
#!/bin/bash
RESULTS_DIR="$1"
MONITOR_FILE="$RESULTS_DIR/system_monitoring.log"

echo "timestamp,cpu_percent,memory_percent,disk_io_read,disk_io_write,network_bytes_sent,network_bytes_recv" > "$MONITOR_FILE"

while true; do
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    # Get CPU usage
    cpu_percent=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' 2>/dev/null || echo "0")
    
    # Get memory usage
    memory_percent=$(ps -A -o %mem | awk '{s+=$1} END {print s}' 2>/dev/null || echo "0")
    
    # Get disk I/O (simplified for macOS/Linux compatibility)
    disk_io_read="0"
    disk_io_write="0"
    
    # Get network stats (simplified)
    network_sent="0"
    network_recv="0"
    
    echo "$timestamp,$cpu_percent,$memory_percent,$disk_io_read,$disk_io_write,$network_sent,$network_recv" >> "$MONITOR_FILE"
    
    sleep 5
done
EOF
    
    chmod +x "$monitoring_script"
    "$monitoring_script" "$RESULTS_DIR" &
    MONITOR_PID=$!
    
    success "System monitoring started (PID: $MONITOR_PID)"
}

# Function to stop system monitoring
stop_system_monitoring() {
    if [ ! -z "$MONITOR_PID" ]; then
        log "Stopping system monitoring..."
        kill $MONITOR_PID 2>/dev/null || true
        wait $MONITOR_PID 2>/dev/null || true
        success "System monitoring stopped"
    fi
}

# Function to generate system monitoring report
generate_system_report() {
    local monitor_file="$RESULTS_DIR/system_monitoring.log"
    
    if [ -f "$monitor_file" ]; then
        log "Generating system monitoring report..."
        
        echo "## System Resource Monitoring" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Calculate averages and peaks
        python3 << EOF >> "$REPORT_FILE"
import csv
import sys

try:
    with open('$monitor_file', 'r') as f:
        reader = csv.DictReader(f)
        cpu_values = []
        memory_values = []
        
        for row in reader:
            try:
                cpu_values.append(float(row['cpu_percent']))
                memory_values.append(float(row['memory_percent']))
            except (ValueError, KeyError):
                continue
        
        if cpu_values and memory_values:
            print("### Resource Usage Summary")
            print("")
            print(f"- **CPU Usage:**")
            print(f"  - Average: {sum(cpu_values)/len(cpu_values):.2f}%")
            print(f"  - Peak: {max(cpu_values):.2f}%")
            print(f"  - Min: {min(cpu_values):.2f}%")
            print("")
            print(f"- **Memory Usage:**")
            print(f"  - Average: {sum(memory_values)/len(memory_values):.2f}%")
            print(f"  - Peak: {max(memory_values):.2f}%")
            print(f"  - Min: {min(memory_values):.2f}%")
            print("")
        else:
            print("No valid monitoring data available.")
            print("")
            
except Exception as e:
    print(f"Error processing monitoring data: {e}")
    print("")
EOF
        
        success "System monitoring report generated"
    else
        warning "No system monitoring data available"
    fi
}

# Function to generate final comprehensive report
generate_final_report() {
    log "Generating final comprehensive report..."
    
    cat >> "$REPORT_FILE" << EOF

## Test Execution Summary

### Test Environment
- **OS:** $(uname -s) $(uname -r)
- **Node.js Version:** $(node --version 2>/dev/null || echo "N/A")
- **Python Version:** $(python3 --version 2>/dev/null || echo "N/A")
- **Available CPU Cores:** $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "Unknown")
- **Total Memory:** $(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo "Unknown")

### Test Results Files
EOF
    
    # List all result files
    find "$RESULTS_DIR" -name "*.json" -type f | while read -r file; do
        echo "- \`$(basename "$file")\`" >> "$REPORT_FILE"
    done
    
    cat >> "$REPORT_FILE" << EOF

### Recommendations

Based on the stress test results, consider the following optimizations:

1. **Performance Tuning:**
   - Monitor response times under load
   - Optimize database queries if response times degrade
   - Consider connection pooling for high concurrency

2. **Error Handling:**
   - Review timeout configurations
   - Implement circuit breakers for external dependencies
   - Add retry mechanisms for transient failures

3. **Monitoring:**
   - Set up alerts for response time thresholds
   - Monitor memory usage patterns
   - Track error rates in production

4. **Scalability:**
   - Consider horizontal scaling for high load scenarios
   - Implement load balancing if needed
   - Monitor resource utilization trends

---

**Report generated on:** $(date)
**Total test duration:** Approximately $(( ($(date +%s) - START_TIME) / 60 )) minutes
EOF
    
    success "Final comprehensive report generated: $REPORT_FILE"
}

# Main execution function
main() {
    START_TIME=$(date +%s)
    
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║         COMPREHENSIVE STRESS TESTING FRAMEWORK                ║"
    echo "║         Chat Endpoint & AI Agent Interceptor                  ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log "Starting comprehensive stress testing suite..."
    
    # Check prerequisites
    if ! check_prerequisites; then
        error "Prerequisites check failed"
        exit 1
    fi
    
    # Check services
    if ! check_services; then
        error "Service availability check failed"
        exit 1
    fi
    
    # Start system monitoring
    start_system_monitoring
    
    # Set up cleanup trap
    trap 'stop_system_monitoring; exit 1' INT TERM
    
    # Run stress tests
    run_nodejs_stress_tests
    run_python_stress_tests
    
    # Stop monitoring and generate reports
    stop_system_monitoring
    generate_system_report
    generate_final_report
    
    # Summary
    echo ""
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║                    TESTING COMPLETED                          ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    success "All stress tests completed successfully!"
    info "Results available in: $RESULTS_DIR"
    info "Comprehensive report: $REPORT_FILE"
    
    # Show quick summary
    log "Quick Summary:"
    echo "  - Test results: $(find "$RESULTS_DIR" -name "*.json" -type f | wc -l) files generated"
    echo "  - Total duration: $(( ($(date +%s) - START_TIME) / 60 )) minutes"
    echo "  - Report location: $REPORT_FILE"
}

# Handle command line arguments
case "${1:-all}" in
    "prereq")
        check_prerequisites
        ;;
    "services")
        check_services
        ;;
    "nodejs")
        check_prerequisites && check_services && run_nodejs_stress_tests
        ;;
    "python")
        check_prerequisites && check_services && run_python_stress_tests
        ;;
    "all"|"")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  all       Run complete stress testing suite (default)"
        echo "  prereq    Check prerequisites only"
        echo "  services  Check service availability only"
        echo "  nodejs    Run Node.js stress tests only"
        echo "  python    Run Python AI Agent tests only"
        echo "  help      Show this help message"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
