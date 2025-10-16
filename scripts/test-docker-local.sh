#!/bin/bash

# 1001 Stories - Docker Local Testing Script
# This script runs E2E tests in Docker containers with proper setup and cleanup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.local.yml"
TEST_COMPOSE_FILE="docker-compose.test.yml"
MAX_WAIT_TIME=300

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required files exist
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_files=()

    if [ ! -f "Dockerfile" ]; then
        missing_files+=("Dockerfile")
    fi

    if [ ! -f "playwright.config.ts" ]; then
        missing_files+=("playwright.config.ts")
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        missing_files+=("$COMPOSE_FILE")
    fi

    if [ ! -f ".env.docker" ]; then
        missing_files+=(".env.docker")
    fi

    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "Missing required files: ${missing_files[*]}"
        return 1
    fi

    log_success "All prerequisite files found"
}

# Function to verify Docker setup
verify_docker_setup() {
    log_info "Verifying Docker local setup..."

    # Run the verification script
    if [ -f "scripts/verify-docker-local.sh" ]; then
        if ./scripts/verify-docker-local.sh verify; then
            log_success "Docker local environment verified"
        else
            log_error "Docker local environment verification failed"
            return 1
        fi
    else
        log_warning "Verification script not found, continuing..."
    fi
}

# Function to run tests with local Docker setup
run_local_tests() {
    local test_pattern="${1:-}"
    local headed="${2:-false}"

    log_info "Running E2E tests against local Docker environment..."

    # Ensure services are running
    if ! docker ps | grep -q "1001-stories-app-local"; then
        log_info "Starting local Docker services..."
        docker-compose -f "$COMPOSE_FILE" up -d
        sleep 30
    fi

    # Set environment variables for tests
    export BASE_URL="http://localhost:3000"
    export HEADLESS=$([ "$headed" = "true" ] && echo "false" || echo "true")

    # Install Playwright browsers if needed
    if ! npx playwright --version >/dev/null 2>&1; then
        log_info "Installing Playwright..."
        npm install @playwright/test
    fi

    # Install browsers
    log_info "Installing Playwright browsers..."
    npx playwright install

    # Run tests
    if [ -n "$test_pattern" ]; then
        log_info "Running tests matching: $test_pattern"
        npx playwright test "$test_pattern" --reporter=html
    else
        log_info "Running all tests..."
        npx playwright test --reporter=html
    fi

    local test_exit_code=$?

    # Generate report
    if [ -d "playwright-report" ]; then
        log_info "Test report generated at: playwright-report/index.html"
        log_info "View report with: npx playwright show-report"
    fi

    return $test_exit_code
}

# Function to run quick smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."

    # Just test basic connectivity
    if curl -s -f http://localhost:3000/api/health >/dev/null; then
        log_success "Application health check passed"
    else
        log_error "Application health check failed"
        return 1
    fi

    # Run a minimal test
    npx playwright test tests/landing-page.spec.ts --reporter=line
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  local     - Run tests against local Docker environment (default)"
    echo "  smoke     - Run quick smoke tests"
    echo "  verify    - Verify Docker setup only"
    echo ""
    echo "Options:"
    echo "  --headed  - Run tests in headed mode (visible browser)"
    echo "  --pattern PATTERN - Run tests matching pattern"
    echo ""
    echo "Examples:"
    echo "  $0 local                        # Run all tests locally"
    echo "  $0 local --headed               # Run tests with visible browser"
    echo "  $0 local --pattern landing      # Run landing page tests"
    echo "  $0 smoke                        # Quick smoke test"
}

# Main function
main() {
    local command="${1:-local}"
    local headed="false"
    local test_pattern=""

    # Parse arguments
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --headed)
                headed="true"
                shift
                ;;
            --pattern)
                test_pattern="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    echo "============================================"
    echo "1001 Stories - Docker Testing"
    echo "============================================"
    echo ""

    # Check prerequisites
    check_prerequisites

    case "$command" in
        "local")
            verify_docker_setup
            run_local_tests "$test_pattern" "$headed"
            ;;
        "smoke")
            verify_docker_setup
            run_smoke_tests
            ;;
        "verify")
            verify_docker_setup
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac

    local exit_code=$?

    echo ""
    echo "============================================"
    if [ $exit_code -eq 0 ]; then
        log_success "Testing completed successfully!"
    else
        log_error "Testing failed with exit code $exit_code"
    fi
    echo "============================================"

    exit $exit_code
}

# Run main function with all arguments
main "$@"