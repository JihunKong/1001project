#!/bin/bash

# Admin Upload Functionality Test Runner
# This script sets up and runs comprehensive tests for the admin dashboard upload functionality

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"
UPLOAD_ARTIFACTS_DIR="$TEST_RESULTS_DIR/upload-artifacts"
SCREENSHOTS_DIR="$TEST_RESULTS_DIR/screenshots"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up test environment..."
    if [ "$USE_DOCKER" = "true" ]; then
        docker-compose -f docker-compose.upload-test.yml down -v --remove-orphans || true
    fi
    
    # Kill any remaining processes
    pkill -f "npm run dev" || true
    pkill -f "next dev" || true
}

# Set cleanup trap
trap cleanup EXIT

# Parse command line arguments
USE_DOCKER=false
HEADLESS=true
BROWSER="chromium"
PARALLEL=false
SPECIFIC_TEST=""
GENERATE_REPORT=true
DEBUG_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --docker)
            USE_DOCKER=true
            shift
            ;;
        --headed)
            HEADLESS=false
            shift
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --test)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --no-report)
            GENERATE_REPORT=false
            shift
            ;;
        --debug)
            DEBUG_MODE=true
            HEADLESS=false
            shift
            ;;
        --help)
            echo "Admin Upload Tests Runner"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --docker          Run tests in Docker containers"
            echo "  --headed          Run tests in headed mode (visible browser)"
            echo "  --browser BROWSER Specify browser (chromium, firefox, webkit)"
            echo "  --parallel        Run tests in parallel"
            echo "  --test PATTERN    Run specific test pattern"
            echo "  --no-report       Skip HTML report generation"
            echo "  --debug           Enable debug mode with headed browser"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Run all tests with defaults"
            echo "  $0 --docker --parallel               # Run in Docker with parallel execution"
            echo "  $0 --headed --browser firefox        # Run in Firefox with visible browser"
            echo "  $0 --test \"*book-upload*\"          # Run only book upload tests"
            echo "  $0 --debug                           # Run in debug mode"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Starting Admin Upload Functionality Tests"
print_status "Project Root: $PROJECT_ROOT"
print_status "Use Docker: $USE_DOCKER"
print_status "Headless: $HEADLESS"
print_status "Browser: $BROWSER"

# Create necessary directories
mkdir -p "$TEST_RESULTS_DIR"
mkdir -p "$UPLOAD_ARTIFACTS_DIR"
mkdir -p "$SCREENSHOTS_DIR"

# Check if required files exist
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    print_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

if [ ! -f "$PROJECT_ROOT/tests/admin-upload-functionality.spec.ts" ]; then
    print_error "Admin upload test file not found!"
    exit 1
fi

# Environment validation
print_status "Validating environment..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi

# Check if Playwright is installed
if [ ! -d "$PROJECT_ROOT/node_modules/@playwright/test" ]; then
    print_status "Installing Playwright..."
    npm install @playwright/test
fi

# Install Playwright browsers if needed
print_status "Ensuring Playwright browsers are installed..."
npx playwright install --with-deps

if [ "$USE_DOCKER" = "true" ]; then
    print_status "Running tests with Docker..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Build and start services
    print_status "Building and starting Docker services..."
    docker-compose -f docker-compose.upload-test.yml up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    timeout 300 bash -c 'until docker-compose -f docker-compose.upload-test.yml exec test-app curl -f http://localhost:3000/api/health; do sleep 5; done'
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose -f docker-compose.upload-test.yml exec test-app npx prisma migrate deploy
    
    # Seed test data
    print_status "Seeding test database..."
    docker-compose -f docker-compose.upload-test.yml exec test-app npx tsx prisma/seed-demo.ts
    
    # Run tests in container
    print_status "Running upload functionality tests in Docker..."
    
    TEST_COMMAND="npx playwright test --config=playwright.config.upload.ts"
    
    if [ ! "$HEADLESS" = "true" ]; then
        print_warning "Headed mode not supported in Docker. Running headless."
    fi
    
    if [ "$PARALLEL" = "true" ]; then
        TEST_COMMAND="$TEST_COMMAND --workers=2"
    else
        TEST_COMMAND="$TEST_COMMAND --workers=1"
    fi
    
    if [ -n "$SPECIFIC_TEST" ]; then
        TEST_COMMAND="$TEST_COMMAND --grep=\"$SPECIFIC_TEST\""
    fi
    
    if [ "$DEBUG_MODE" = "true" ]; then
        TEST_COMMAND="$TEST_COMMAND --debug"
    fi
    
    docker-compose -f docker-compose.upload-test.yml exec playwright $TEST_COMMAND
    
    # Copy test results out of container
    print_status "Copying test results from container..."
    docker-compose -f docker-compose.upload-test.yml cp playwright:/app/test-results/ ./test-results/
    docker-compose -f docker-compose.upload-test.yml cp playwright:/app/playwright-report-upload/ ./playwright-report-upload/
    
else
    print_status "Running tests locally..."
    
    # Check if the app is running
    if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Starting Next.js development server..."
        npm run dev &
        APP_PID=$!
        
        # Wait for the app to be ready
        print_status "Waiting for application to be ready..."
        timeout 120 bash -c 'until curl -f http://localhost:3000/api/health; do sleep 2; done'
        
        if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            print_error "Application failed to start"
            kill $APP_PID 2>/dev/null || true
            exit 1
        fi
        
        print_success "Application is ready"
    else
        print_success "Application is already running"
        APP_PID=""
    fi
    
    # Build test command
    TEST_COMMAND="npx playwright test --config=playwright.config.upload.ts"
    
    # Add browser selection
    TEST_COMMAND="$TEST_COMMAND --project=$BROWSER-upload"
    
    # Add headless/headed mode
    if [ ! "$HEADLESS" = "true" ]; then
        export HEADLESS=false
        TEST_COMMAND="$TEST_COMMAND --headed"
    fi
    
    # Add parallel execution
    if [ "$PARALLEL" = "true" ]; then
        TEST_COMMAND="$TEST_COMMAND --workers=2"
    else
        TEST_COMMAND="$TEST_COMMAND --workers=1"
    fi
    
    # Add specific test pattern
    if [ -n "$SPECIFIC_TEST" ]; then
        TEST_COMMAND="$TEST_COMMAND --grep=\"$SPECIFIC_TEST\""
    fi
    
    # Add debug mode
    if [ "$DEBUG_MODE" = "true" ]; then
        TEST_COMMAND="$TEST_COMMAND --debug"
        export PWDEBUG=1
    fi
    
    # Run the tests
    print_status "Running command: $TEST_COMMAND"
    eval $TEST_COMMAND
    TEST_EXIT_CODE=$?
    
    # Clean up local server if we started it
    if [ -n "$APP_PID" ]; then
        print_status "Stopping development server..."
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
    fi
fi

# Generate comprehensive test report
if [ "$GENERATE_REPORT" = "true" ]; then
    print_status "Generating comprehensive test report..."
    
    # Show Playwright HTML report
    if [ -f "$PROJECT_ROOT/playwright-report-upload/index.html" ]; then
        print_success "HTML report generated: playwright-report-upload/index.html"
        
        # Try to open report in browser (macOS/Linux)
        if command -v open &> /dev/null; then
            open "$PROJECT_ROOT/playwright-report-upload/index.html" 2>/dev/null || true
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$PROJECT_ROOT/playwright-report-upload/index.html" 2>/dev/null || true
        fi
    fi
    
    # Show test results summary
    if [ -f "$TEST_RESULTS_DIR/upload-test-results.json" ]; then
        print_status "Parsing test results..."
        
        # Extract key metrics (requires jq if available)
        if command -v jq &> /dev/null; then
            TOTAL_TESTS=$(jq '.suites[].tests | length' "$TEST_RESULTS_DIR/upload-test-results.json" | awk '{sum += $1} END {print sum}')
            PASSED_TESTS=$(jq '.suites[].tests[] | select(.results[].status == "passed")' "$TEST_RESULTS_DIR/upload-test-results.json" | wc -l)
            FAILED_TESTS=$(jq '.suites[].tests[] | select(.results[].status == "failed")' "$TEST_RESULTS_DIR/upload-test-results.json" | wc -l)
            
            print_status "Test Summary:"
            echo "  Total Tests: $TOTAL_TESTS"
            echo "  Passed: $PASSED_TESTS"
            echo "  Failed: $FAILED_TESTS"
        fi
    fi
    
    # List generated artifacts
    if [ -d "$SCREENSHOTS_DIR" ] && [ "$(ls -A $SCREENSHOTS_DIR)" ]; then
        print_status "Screenshots saved to: $SCREENSHOTS_DIR"
        ls -la "$SCREENSHOTS_DIR"
    fi
    
    if [ -d "$TEST_RESULTS_DIR/upload-videos" ] && [ "$(ls -A $TEST_RESULTS_DIR/upload-videos)" ]; then
        print_status "Videos saved to: $TEST_RESULTS_DIR/upload-videos"
    fi
fi

# Final status
if [ "${TEST_EXIT_CODE:-0}" -eq 0 ]; then
    print_success "All admin upload functionality tests completed successfully!"
    
    print_status "Next steps:"
    echo "  1. Review the HTML report: playwright-report-upload/index.html"
    echo "  2. Check screenshots for visual verification: test-results/screenshots/"
    echo "  3. Examine any test videos if failures occurred"
    echo "  4. Run specific browser tests: $0 --browser firefox"
    echo "  5. Debug failing tests: $0 --debug --test \"specific test name\""
    
else
    print_error "Some tests failed. Please check the report for details."
    
    print_status "Debugging tips:"
    echo "  1. Run in headed mode: $0 --headed"
    echo "  2. Run specific failing test: $0 --debug --test \"test name\""
    echo "  3. Check screenshots in test-results/screenshots/"
    echo "  4. Review application logs if running locally"
    echo "  5. Verify file upload permissions and disk space"
fi

print_status "Test run completed."
exit ${TEST_EXIT_CODE:-0}