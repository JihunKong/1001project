#!/bin/bash

# Docker E2E Test Runner for 1001 Stories
# This script runs Playwright tests in a containerized environment

set -e

PROJECT_ROOT="/Users/jihunkong/1001project/1001-stories"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 1001 Stories Docker E2E Test Runner ===${NC}"
echo ""

# Function to clean up Docker containers
cleanup() {
    echo -e "${YELLOW}Cleaning up Docker containers...${NC}"
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Parse command line arguments
TEST_FILTER=""
HEADLESS="true"
BROWSER="chromium"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --filter) TEST_FILTER="$2"; shift ;;
        --headed) HEADLESS="false" ;;
        --browser) BROWSER="$2"; shift ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --filter <pattern>  Run only tests matching pattern"
            echo "  --headed           Run tests in headed mode"
            echo "  --browser <name>   Browser to use (chromium|firefox|webkit)"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Step 1: Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker daemon is not running${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites check passed${NC}"
echo ""

# Step 2: Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f docker-compose.test.yml build --no-cache playwright

echo -e "${GREEN}Docker images built successfully${NC}"
echo ""

# Step 3: Start test infrastructure
echo -e "${YELLOW}Starting test infrastructure...${NC}"
docker-compose -f docker-compose.test.yml up -d postgres-test redis-test

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database...${NC}"
sleep 5

# Start application
echo -e "${YELLOW}Starting application...${NC}"
docker-compose -f docker-compose.test.yml up -d app-test

# Wait for app to be ready
echo -e "${YELLOW}Waiting for application to be ready...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        echo -e "${GREEN}Application is ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Step 4: Run tests
echo -e "${YELLOW}Running E2E tests...${NC}"
echo ""

# Prepare test command
TEST_CMD="npx playwright test --project=$BROWSER"
if [ -n "$TEST_FILTER" ]; then
    TEST_CMD="$TEST_CMD --grep '$TEST_FILTER'"
fi

# Run tests in Docker
docker-compose -f docker-compose.test.yml run \
    -e HEADLESS="$HEADLESS" \
    -e BASE_URL="http://app-test:3000" \
    --rm \
    playwright \
    sh -c "$TEST_CMD --reporter=list,html,json"

# Step 5: Copy test results
echo ""
echo -e "${YELLOW}Copying test results...${NC}"

# Create results directory
mkdir -p "$PROJECT_ROOT/test-results"
mkdir -p "$PROJECT_ROOT/playwright-report"

# Copy results from container (if still running)
CONTAINER_ID=$(docker-compose -f docker-compose.test.yml ps -q playwright 2>/dev/null || echo "")
if [ -n "$CONTAINER_ID" ]; then
    docker cp "$CONTAINER_ID:/app/test-results/." "$PROJECT_ROOT/test-results/" 2>/dev/null || true
    docker cp "$CONTAINER_ID:/app/playwright-report/." "$PROJECT_ROOT/playwright-report/" 2>/dev/null || true
fi

# Step 6: Display summary
echo ""
echo -e "${GREEN}=== Test Execution Complete ===${NC}"
echo ""

# Check if JSON results exist
if [ -f "$PROJECT_ROOT/test-results/results.json" ]; then
    echo "Test results available at:"
    echo "  - HTML Report: $PROJECT_ROOT/playwright-report/index.html"
    echo "  - JSON Report: $PROJECT_ROOT/test-results/results.json"
    echo "  - JUnit Report: $PROJECT_ROOT/test-results/results.xml"
    echo ""
    echo "To view HTML report, run:"
    echo "  npx playwright show-report playwright-report"
else
    echo -e "${YELLOW}No test results found. Tests may have failed to run.${NC}"
fi

echo ""
echo -e "${GREEN}=== Done ===${NC}"