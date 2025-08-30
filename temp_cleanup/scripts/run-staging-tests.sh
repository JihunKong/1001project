#!/bin/bash

# 1001 Stories - Staging E2E Tests Runner
# Comprehensive script for running role system validation tests

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="${PROJECT_ROOT}/test-logs"
RESULTS_DIR="${PROJECT_ROOT}/test-results"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
RUN_SETUP=true
RUN_TEARDOWN=true
PARALLEL_WORKERS=2
TIMEOUT=300000  # 5 minutes
RETRIES=2
HEADLESS=true
GENERATE_REPORT=true
SEND_NOTIFICATIONS=false
DOCKER_COMPOSE_FILE="docker-compose.staging.yml"

# Test categories
TEST_AUTH=false
TEST_MIGRATION=false
TEST_ADMIN=false
TEST_DASHBOARD=false
TEST_ALL=false

# Function definitions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "${LOG_DIR}/test-run-${TIMESTAMP}.log"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "${LOG_DIR}/test-run-${TIMESTAMP}.log"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "${LOG_DIR}/test-run-${TIMESTAMP}.log"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "${LOG_DIR}/test-run-${TIMESTAMP}.log"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Run 1001 Stories staging E2E tests for role system validation.

OPTIONS:
    -h, --help              Show this help message
    -a, --all              Run all test suites
    --auth                 Run authentication flow tests
    --migration            Run user migration tests
    --admin                Run admin panel tests
    --dashboard            Run dashboard tests
    
    --no-setup             Skip environment setup
    --no-teardown          Skip environment teardown
    --headed               Run tests in headed mode (visible browser)
    --workers N            Set number of parallel workers (default: 2)
    --timeout N            Set test timeout in ms (default: 300000)
    --retries N            Set number of retries (default: 2)
    --no-report            Skip HTML report generation
    --notify               Send notifications on completion
    
    --staging-url URL      Override staging URL (default: https://localhost:8080)
    --compose-file FILE    Override docker-compose file (default: docker-compose.staging.yml)

EXAMPLES:
    $0 --all                           Run all test suites
    $0 --auth --migration             Run auth and migration tests
    $0 --admin --headed --workers 1   Run admin tests in headed mode
    $0 --all --no-setup --no-teardown Run tests without environment setup

EOF
}

check_dependencies() {
    log "Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    log_success "All dependencies are available"
}

setup_environment() {
    if [ "$RUN_SETUP" = false ]; then
        log "Skipping environment setup"
        return 0
    fi
    
    log "Setting up test environment..."
    
    # Create required directories
    mkdir -p "${LOG_DIR}" "${RESULTS_DIR}"
    
    # Stop any existing containers
    log "Stopping existing containers..."
    docker-compose -f "${DOCKER_COMPOSE_FILE}" down -v || true
    
    # Start staging environment
    log "Starting staging environment..."
    if ! docker-compose -f "${DOCKER_COMPOSE_FILE}" up -d; then
        log_error "Failed to start staging environment"
        exit 1
    fi
    
    # Wait for services to be healthy
    log "Waiting for services to become healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "${DOCKER_COMPOSE_FILE}" ps | grep -q "healthy"; then
            break
        fi
        
        attempt=$((attempt + 1))
        log "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Services failed to become healthy within timeout"
        docker-compose -f "${DOCKER_COMPOSE_FILE}" logs
        exit 1
    fi
    
    # Verify staging URL is accessible
    log "Verifying staging environment accessibility..."
    local staging_url="${STAGING_URL:-https://localhost:8080}"
    
    for i in {1..10}; do
        if curl -k -s --connect-timeout 5 "${staging_url}/api/health" > /dev/null; then
            log_success "Staging environment is accessible"
            break
        fi
        
        if [ $i -eq 10 ]; then
            log_error "Staging environment is not accessible after 10 attempts"
            exit 1
        fi
        
        log "Attempt $i/10 - waiting for staging URL to respond..."
        sleep 5
    done
}

run_test_suite() {
    local test_pattern="$1"
    local test_name="$2"
    local project_name="$3"
    
    log "Running $test_name tests..."
    
    local test_cmd="npx playwright test"
    test_cmd="${test_cmd} --config=playwright.config.staging.ts"
    test_cmd="${test_cmd} --project=${project_name}"
    
    if [ "$test_pattern" != "all" ]; then
        test_cmd="${test_cmd} ${test_pattern}"
    fi
    
    # Add configuration options
    if [ "$HEADLESS" = false ]; then
        test_cmd="${test_cmd} --headed"
    fi
    
    test_cmd="${test_cmd} --workers=${PARALLEL_WORKERS}"
    test_cmd="${test_cmd} --timeout=${TIMEOUT}"
    test_cmd="${test_cmd} --retries=${RETRIES}"
    
    # Set environment variables
    export STAGING_URL="${STAGING_URL:-https://localhost:8080}"
    export HEADLESS="$HEADLESS"
    export WORKERS="$PARALLEL_WORKERS"
    
    # Run the tests
    local test_start_time=$(date +%s)
    if eval "$test_cmd"; then
        local test_end_time=$(date +%s)
        local test_duration=$((test_end_time - test_start_time))
        log_success "$test_name tests completed in ${test_duration}s"
        return 0
    else
        local test_end_time=$(date +%s)
        local test_duration=$((test_end_time - test_start_time))
        log_error "$test_name tests failed after ${test_duration}s"
        return 1
    fi
}

generate_reports() {
    if [ "$GENERATE_REPORT" = false ]; then
        log "Skipping report generation"
        return 0
    fi
    
    log "Generating test reports..."
    
    # Generate HTML report
    if npx playwright show-report --port=0 > /dev/null 2>&1; then
        log_success "HTML report generated successfully"
    else
        log_warning "Failed to generate HTML report"
    fi
    
    # Generate JUnit XML report
    if [ -f "${RESULTS_DIR}/junit.xml" ]; then
        log_success "JUnit XML report available"
    fi
    
    # Generate JSON results summary
    if [ -f "${RESULTS_DIR}/results.json" ]; then
        local total_tests=$(jq '.stats.total' "${RESULTS_DIR}/results.json" 2>/dev/null || echo "unknown")
        local passed_tests=$(jq '.stats.passed' "${RESULTS_DIR}/results.json" 2>/dev/null || echo "unknown")
        local failed_tests=$(jq '.stats.failed' "${RESULTS_DIR}/results.json" 2>/dev/null || echo "unknown")
        
        log "Test Results Summary:"
        log "  Total: $total_tests"
        log "  Passed: $passed_tests"
        log "  Failed: $failed_tests"
    fi
    
    # Archive results
    local archive_name="test-results-${TIMESTAMP}.tar.gz"
    if tar -czf "${LOG_DIR}/${archive_name}" -C "${PROJECT_ROOT}" test-results playwright-report; then
        log_success "Results archived as ${archive_name}"
    fi
}

send_notifications() {
    if [ "$SEND_NOTIFICATIONS" = false ]; then
        return 0
    fi
    
    log "Sending test completion notifications..."
    
    # Determine test status
    local test_status="success"
    if [ -f "${RESULTS_DIR}/results.json" ]; then
        local failed_tests=$(jq '.stats.failed' "${RESULTS_DIR}/results.json" 2>/dev/null || echo "0")
        if [ "$failed_tests" != "0" ]; then
            test_status="failure"
        fi
    fi
    
    # Send Slack notification if webhook is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local emoji="✅"
        local color="good"
        local status_text="PASSED"
        
        if [ "$test_status" = "failure" ]; then
            emoji="❌"
            color="danger"
            status_text="FAILED"
        fi
        
        local message="{
            \"text\": \"$emoji 1001 Stories E2E Tests $status_text\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"fields\": [{
                    \"title\": \"Environment\",
                    \"value\": \"Staging\",
                    \"short\": true
                }, {
                    \"title\": \"Timestamp\",
                    \"value\": \"$(date)\",
                    \"short\": true
                }]
            }]
        }"
        
        if curl -X POST -H 'Content-type: application/json' \
           --data "$message" "$SLACK_WEBHOOK_URL" > /dev/null 2>&1; then
            log_success "Slack notification sent"
        else
            log_warning "Failed to send Slack notification"
        fi
    fi
    
    # Send email notification if configured
    if [ -n "$EMAIL_NOTIFICATION_RECIPIENT" ]; then
        local subject="1001 Stories E2E Tests $status_text - $(date)"
        local body="Test execution completed at $(date)\nStatus: $status_text\nCheck logs for details."
        
        echo "$body" | mail -s "$subject" "$EMAIL_NOTIFICATION_RECIPIENT" || \
            log_warning "Failed to send email notification"
    fi
}

cleanup_environment() {
    if [ "$RUN_TEARDOWN" = false ]; then
        log "Skipping environment cleanup"
        return 0
    fi
    
    log "Cleaning up test environment..."
    
    # Stop and remove containers
    docker-compose -f "${DOCKER_COMPOSE_FILE}" down -v || true
    
    # Clean up Docker resources
    docker system prune -f || true
    
    log_success "Environment cleanup completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -a|--all)
            TEST_ALL=true
            shift
            ;;
        --auth)
            TEST_AUTH=true
            shift
            ;;
        --migration)
            TEST_MIGRATION=true
            shift
            ;;
        --admin)
            TEST_ADMIN=true
            shift
            ;;
        --dashboard)
            TEST_DASHBOARD=true
            shift
            ;;
        --no-setup)
            RUN_SETUP=false
            shift
            ;;
        --no-teardown)
            RUN_TEARDOWN=false
            shift
            ;;
        --headed)
            HEADLESS=false
            shift
            ;;
        --workers)
            PARALLEL_WORKERS="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --retries)
            RETRIES="$2"
            shift 2
            ;;
        --no-report)
            GENERATE_REPORT=false
            shift
            ;;
        --notify)
            SEND_NOTIFICATIONS=true
            shift
            ;;
        --staging-url)
            STAGING_URL="$2"
            shift 2
            ;;
        --compose-file)
            DOCKER_COMPOSE_FILE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    local start_time=$(date +%s)
    local exit_code=0
    
    log "Starting 1001 Stories staging E2E tests - $(date)"
    log "Configuration:"
    log "  Staging URL: ${STAGING_URL:-https://localhost:8080}"
    log "  Workers: $PARALLEL_WORKERS"
    log "  Timeout: $TIMEOUT ms"
    log "  Retries: $RETRIES"
    log "  Headless: $HEADLESS"
    log "  Generate Report: $GENERATE_REPORT"
    
    # Trap to ensure cleanup on exit
    trap cleanup_environment EXIT
    
    # Check dependencies
    check_dependencies
    
    # Setup environment
    setup_environment
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Run test suites based on options
    if [ "$TEST_ALL" = true ]; then
        run_test_suite "tests/role-system" "Role System" "role-system" || exit_code=$?
    else
        if [ "$TEST_AUTH" = true ]; then
            run_test_suite "tests/role-system/auth-flow.spec.ts" "Authentication Flow" "auth-flow" || exit_code=$?
        fi
        
        if [ "$TEST_MIGRATION" = true ]; then
            run_test_suite "tests/role-system/*migration*.spec.ts" "User Migration" "migration" || exit_code=$?
        fi
        
        if [ "$TEST_ADMIN" = true ]; then
            run_test_suite "tests/role-system/admin-panel.spec.ts" "Admin Panel" "admin-panel" || exit_code=$?
        fi
        
        if [ "$TEST_DASHBOARD" = true ]; then
            run_test_suite "tests/role-system/dashboard.spec.ts" "Unified Dashboard" "dashboard" || exit_code=$?
        fi
        
        # If no specific tests were selected, show usage
        if [ "$TEST_AUTH" = false ] && [ "$TEST_MIGRATION" = false ] && \
           [ "$TEST_ADMIN" = false ] && [ "$TEST_DASHBOARD" = false ]; then
            log_warning "No test suites selected. Use --all or specify individual test types."
            show_usage
            exit 1
        fi
    fi
    
    # Generate reports
    generate_reports
    
    # Send notifications
    send_notifications
    
    # Calculate total execution time
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        log_success "All tests completed successfully in ${total_duration}s"
    else
        log_error "Some tests failed. Total execution time: ${total_duration}s"
    fi
    
    return $exit_code
}

# Run main function
main "$@"