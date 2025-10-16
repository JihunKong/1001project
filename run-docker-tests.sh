#!/bin/bash

# Docker-based E2E Test Runner for 1001 Stories
# This script orchestrates the complete test environment setup and execution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.test.yml"
TEST_TIMEOUT=300 # 5 minutes timeout for tests

echo -e "${GREEN}🚀 1001 Stories - Docker E2E Test Runner${NC}"
echo "================================================"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up test environment...${NC}"
    docker compose -f $COMPOSE_FILE down -v --remove-orphans
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Trap exit signals for cleanup
trap cleanup EXIT INT TERM

# Parse command line arguments
TEST_FILTER=""
KEEP_RUNNING=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --test)
            TEST_FILTER="$2"
            shift 2
            ;;
        --keep-running)
            KEEP_RUNNING=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --test <pattern>    Run only tests matching pattern"
            echo "  --keep-running      Keep containers running after tests"
            echo "  --verbose           Show detailed output"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Step 1: Stop any existing test containers
echo -e "\n${YELLOW}📦 Stopping existing test containers...${NC}"
docker compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# Step 2: Build the test environment
echo -e "\n${YELLOW}🔨 Building test environment...${NC}"
if [ "$VERBOSE" = true ]; then
    docker compose -f $COMPOSE_FILE build
else
    docker compose -f $COMPOSE_FILE build --quiet
fi

# Step 3: Start the test infrastructure
echo -e "\n${YELLOW}🚀 Starting test infrastructure...${NC}"
docker compose -f $COMPOSE_FILE up -d postgres-test redis-test

# Wait for database to be ready
echo -e "\n${YELLOW}⏳ Waiting for database to be ready...${NC}"
for i in {1..30}; do
    if docker compose -f $COMPOSE_FILE exec -T postgres-test pg_isready -U stories_user -d stories_test_db > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        exit 1
    fi
    sleep 2
done

# Step 4: Start the application
echo -e "\n${YELLOW}🌐 Starting application...${NC}"
docker compose -f $COMPOSE_FILE up -d app-test

# Wait for application to be healthy
echo -e "\n${YELLOW}⏳ Waiting for application to be ready...${NC}"
for i in {1..60}; do
    if docker compose -f $COMPOSE_FILE exec -T app-test wget --spider http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is ready${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Application failed to start${NC}"
        echo -e "${YELLOW}📋 Application logs:${NC}"
        docker compose -f $COMPOSE_FILE logs app-test --tail=50
        exit 1
    fi
    sleep 2
done

# Step 5: Run database migrations and seed data
echo -e "\n${YELLOW}🔄 Running database migrations...${NC}"
docker compose -f $COMPOSE_FILE exec -T app-test npx prisma migrate deploy

echo -e "\n${YELLOW}🌱 Seeding test data...${NC}"
docker compose -f $COMPOSE_FILE exec -T app-test npx tsx prisma/seed-test.ts

# Step 6: Run Playwright tests
echo -e "\n${YELLOW}🎭 Running Playwright tests...${NC}"
echo "================================================"

# Prepare test command
TEST_CMD="npx playwright test"
if [ -n "$TEST_FILTER" ]; then
    TEST_CMD="$TEST_CMD --grep \"$TEST_FILTER\""
fi
if [ "$VERBOSE" = true ]; then
    TEST_CMD="$TEST_CMD --reporter=list"
else
    TEST_CMD="$TEST_CMD --reporter=dot"
fi

# Run tests in a new container
docker compose -f $COMPOSE_FILE run --rm \
    -e CI=true \
    -e HEADLESS=true \
    -e BASE_URL=http://app-test:3000 \
    -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    --no-deps \
    playwright-test \
    sh -c "
        npm ci --legacy-peer-deps
        npx playwright install chromium
        $TEST_CMD
    "

TEST_EXIT_CODE=$?

# Step 7: Collect test results
echo -e "\n${YELLOW}📊 Collecting test results...${NC}"

# Copy test results from container if they exist
CONTAINER_ID=$(docker compose -f $COMPOSE_FILE ps -q playwright-test 2>/dev/null || true)
if [ -n "$CONTAINER_ID" ]; then
    docker cp $CONTAINER_ID:/app/test-results ./test-results 2>/dev/null || true
    docker cp $CONTAINER_ID:/app/playwright-report ./playwright-report 2>/dev/null || true
fi

# Display test summary
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed successfully!${NC}"
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    echo -e "${YELLOW}Check the test results in:${NC}"
    echo "  - HTML Report: ./playwright-report/index.html"
    echo "  - Test Results: ./test-results/"
fi

# Step 8: Optional - Keep containers running for debugging
if [ "$KEEP_RUNNING" = true ]; then
    echo -e "\n${YELLOW}🔍 Containers are still running for debugging${NC}"
    echo "Access the application at: http://localhost:3001"
    echo "To stop containers, run: docker compose -f $COMPOSE_FILE down"
    trap - EXIT # Remove the cleanup trap
else
    cleanup
fi

exit $TEST_EXIT_CODE