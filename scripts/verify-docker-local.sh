#!/bin/bash

# 1001 Stories - Local Docker Environment Verification Script
# This script verifies that all Docker services are healthy and accessible

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.local.yml"
MAX_WAIT_TIME=300  # 5 minutes
CHECK_INTERVAL=10  # 10 seconds

# Helper functions
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

# Function to check if Docker is running
check_docker() {
    log_info "Checking Docker daemon..."
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    log_success "Docker daemon is running"
}

# Function to check if docker-compose file exists
check_compose_file() {
    log_info "Checking Docker Compose file..."
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file '$COMPOSE_FILE' not found"
        exit 1
    fi
    log_success "Docker Compose file found"
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local container_name=$2

    log_info "Checking health of $service_name..."

    local elapsed_time=0
    while [ $elapsed_time -lt $MAX_WAIT_TIME ]; do
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-health-check")

        if [ "$health_status" = "healthy" ]; then
            log_success "$service_name is healthy"
            return 0
        elif [ "$health_status" = "unhealthy" ]; then
            log_error "$service_name is unhealthy"
            docker logs "$container_name" --tail 20
            return 1
        elif [ "$health_status" = "no-health-check" ]; then
            # For services without health checks, check if container is running
            if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
                log_success "$service_name is running (no health check defined)"
                return 0
            else
                log_error "$service_name container is not running"
                return 1
            fi
        fi

        log_info "$service_name health status: $health_status (waiting...)"
        sleep $CHECK_INTERVAL
        elapsed_time=$((elapsed_time + CHECK_INTERVAL))
    done

    log_error "$service_name failed to become healthy within $MAX_WAIT_TIME seconds"
    return 1
}

# Function to test database connectivity
test_database_connection() {
    log_info "Testing PostgreSQL database connection..."

    if docker exec 1001-stories-postgres-local pg_isready -U stories_user -d stories_db >/dev/null 2>&1; then
        log_success "PostgreSQL database is accessible"

        # Test database query
        local db_test_result=$(docker exec 1001-stories-postgres-local psql -U stories_user -d stories_db -t -c "SELECT 1;" 2>/dev/null | tr -d '[:space:]')
        if [ "$db_test_result" = "1" ]; then
            log_success "Database query test passed"
        else
            log_warning "Database is accessible but query test failed"
        fi
    else
        log_error "PostgreSQL database is not accessible"
        return 1
    fi
}

# Function to test Redis connectivity
test_redis_connection() {
    log_info "Testing Redis connection..."

    if docker exec 1001-stories-redis-local redis-cli -a test_password ping >/dev/null 2>&1; then
        log_success "Redis is accessible"

        # Test Redis operations
        docker exec 1001-stories-redis-local redis-cli -a test_password set test_key "test_value" >/dev/null 2>&1
        local redis_test_result=$(docker exec 1001-stories-redis-local redis-cli -a test_password get test_key 2>/dev/null)
        if [ "$redis_test_result" = "test_value" ]; then
            log_success "Redis read/write test passed"
            docker exec 1001-stories-redis-local redis-cli -a test_password del test_key >/dev/null 2>&1
        else
            log_warning "Redis is accessible but read/write test failed"
        fi
    else
        log_error "Redis is not accessible"
        return 1
    fi
}

# Function to test application endpoints
test_app_endpoints() {
    log_info "Testing application endpoints..."

    # Test health endpoint
    local health_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
    if [ "$health_response" = "200" ]; then
        log_success "Health endpoint is accessible (HTTP 200)"
    else
        log_error "Health endpoint failed (HTTP $health_response)"
        return 1
    fi

    # Test main page
    local main_page_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")
    if [ "$main_page_response" = "200" ]; then
        log_success "Main page is accessible (HTTP 200)"
    else
        log_warning "Main page returned HTTP $main_page_response"
    fi

    # Test demo endpoint if available
    local demo_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/demo || echo "000")
    if [ "$demo_response" = "200" ]; then
        log_success "Demo endpoint is accessible (HTTP 200)"
    else
        log_info "Demo endpoint returned HTTP $demo_response (may be expected)"
    fi
}

# Function to check port availability
check_port_conflicts() {
    log_info "Checking for port conflicts..."

    local ports=("3000" "5432" "6379" "5050")
    local conflicts=0

    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            local process=$(lsof -i :$port | tail -n +2 | awk '{print $1}' | head -1)
            if [ "$process" != "docker-pr" ] && [ "$process" != "com.docke" ]; then
                log_warning "Port $port is in use by $process (potential conflict)"
                conflicts=$((conflicts + 1))
            fi
        fi
    done

    if [ $conflicts -eq 0 ]; then
        log_success "No port conflicts detected"
    else
        log_warning "$conflicts potential port conflicts detected"
    fi
}

# Function to display service status
show_service_status() {
    log_info "Docker service status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
}

# Function to show resource usage
show_resource_usage() {
    log_info "Container resource usage:"
    echo ""
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo ""
}

# Main verification function
main() {
    echo "============================================"
    echo "1001 Stories - Docker Local Verification"
    echo "============================================"
    echo ""

    # Pre-checks
    check_docker
    check_compose_file
    check_port_conflicts

    echo ""
    log_info "Starting Docker services..."
    docker-compose -f "$COMPOSE_FILE" up -d

    echo ""
    log_info "Waiting for services to start..."
    sleep 15

    # Show initial status
    show_service_status

    # Health checks
    echo ""
    log_info "Running health checks..."

    local all_healthy=true

    if ! check_service_health "PostgreSQL" "1001-stories-postgres-local"; then
        all_healthy=false
    fi

    if ! check_service_health "Redis" "1001-stories-redis-local"; then
        all_healthy=false
    fi

    if ! check_service_health "Application" "1001-stories-app-local"; then
        all_healthy=false
    fi

    # Connectivity tests
    echo ""
    log_info "Running connectivity tests..."

    if ! test_database_connection; then
        all_healthy=false
    fi

    if ! test_redis_connection; then
        all_healthy=false
    fi

    # Wait a bit more for app to fully start
    sleep 10

    if ! test_app_endpoints; then
        all_healthy=false
    fi

    # Resource usage
    echo ""
    show_resource_usage

    # Final status
    echo ""
    echo "============================================"
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy and accessible!"
        echo ""
        log_info "Access points:"
        echo "  • Application: http://localhost:3000"
        echo "  • PgAdmin: http://localhost:5050"
        echo "  • PostgreSQL: localhost:5432"
        echo "  • Redis: localhost:6379"
        echo ""
        log_info "To run tests: npm run test:e2e:local"
        log_info "To stop services: docker-compose -f $COMPOSE_FILE down"
        echo "============================================"
        exit 0
    else
        log_error "Some services are not healthy. Check the logs above."
        echo ""
        log_info "To view service logs:"
        echo "  docker-compose -f $COMPOSE_FILE logs [service_name]"
        echo ""
        log_info "To stop services: docker-compose -f $COMPOSE_FILE down"
        echo "============================================"
        exit 1
    fi
}

# Handle script arguments
case "${1:-verify}" in
    "verify")
        main
        ;;
    "start")
        log_info "Starting Docker services..."
        docker-compose -f "$COMPOSE_FILE" up -d
        show_service_status
        ;;
    "stop")
        log_info "Stopping Docker services..."
        docker-compose -f "$COMPOSE_FILE" down
        ;;
    "restart")
        log_info "Restarting Docker services..."
        docker-compose -f "$COMPOSE_FILE" down
        docker-compose -f "$COMPOSE_FILE" up -d
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
        ;;
    "status")
        show_service_status
        show_resource_usage
        ;;
    "clean")
        log_info "Cleaning Docker resources..."
        docker-compose -f "$COMPOSE_FILE" down -v
        docker system prune -f
        ;;
    *)
        echo "Usage: $0 {verify|start|stop|restart|logs [service]|status|clean}"
        echo ""
        echo "Commands:"
        echo "  verify  - Run full verification (default)"
        echo "  start   - Start services"
        echo "  stop    - Stop services"
        echo "  restart - Restart services"
        echo "  logs    - Show logs (optionally for specific service)"
        echo "  status  - Show service status and resource usage"
        echo "  clean   - Stop services and clean volumes"
        exit 1
        ;;
esac