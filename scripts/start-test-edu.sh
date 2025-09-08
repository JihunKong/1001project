#!/bin/bash

# Test Education Environment Management Script
# Usage: ./scripts/start-test-edu.sh [start|stop|restart|logs|status|init]

set -e

COMPOSE_FILE="docker-compose.test-edu.yml"
ENV_FILE=".env.test-edu"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Initialize database with Prisma and seed data
init_database() {
    print_info "Initializing test database..."
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    sleep 5
    
    # Run Prisma migrations
    print_info "Running Prisma migrations..."
    DATABASE_URL="postgresql://test_user:test_pass_2024@localhost:5433/stories_test_db" npx prisma migrate deploy
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    DATABASE_URL="postgresql://test_user:test_pass_2024@localhost:5433/stories_test_db" npx prisma generate
    
    # Create test users
    print_info "Creating test users..."
    docker exec -i 1001-stories-test-db psql -U test_user -d stories_test_db < scripts/init-test-db.sql
    
    print_info "Database initialization complete!"
    echo ""
    print_info "Test Users Created:"
    echo "  Teacher: teacher@test.edu / Test123!"
    echo "  Student1: student1@test.edu / Student123!"
    echo "  Student2: student2@test.edu / Student123!"
    echo "  Admin: admin@test.edu / Admin123!"
}

# Start the test environment
start() {
    print_info "Starting test education environment..."
    
    # Check if containers already exist
    if docker ps -a --format '{{.Names}}' | grep -q "1001-stories-test-db"; then
        print_warning "Test containers already exist. Removing old containers..."
        docker-compose -f $COMPOSE_FILE down -v
    fi
    
    # Build and start containers
    print_info "Building Docker images..."
    docker-compose -f $COMPOSE_FILE build
    
    print_info "Starting Docker containers..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Initialize database
    init_database
    
    print_info "Test environment started successfully!"
    echo ""
    print_info "Access the application at: http://localhost:3001"
    print_info "Database: PostgreSQL on port 5433"
    print_info "Redis: on port 6380"
}

# Stop the test environment
stop() {
    print_info "Stopping test education environment..."
    docker-compose -f $COMPOSE_FILE down
    print_info "Test environment stopped."
}

# Restart the test environment
restart() {
    stop
    sleep 2
    start
}

# Show logs
logs() {
    docker-compose -f $COMPOSE_FILE logs -f
}

# Show status
status() {
    print_info "Test Environment Status:"
    echo ""
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    
    # Check if app is accessible
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|302"; then
        print_info "Application is running at: http://localhost:3001"
    else
        print_warning "Application is not responding at http://localhost:3001"
    fi
}

# Main script logic
check_docker

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    init)
        init_database
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|init}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the test environment"
        echo "  stop    - Stop the test environment"
        echo "  restart - Restart the test environment"
        echo "  logs    - Show container logs"
        echo "  status  - Show environment status"
        echo "  init    - Initialize database with test users"
        exit 1
        ;;
esac