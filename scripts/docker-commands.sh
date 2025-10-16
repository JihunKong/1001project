#!/bin/bash

# 1001 Stories - Docker Commands Reference and Quick Actions
# This script provides common Docker operations for the 1001 Stories platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.local.yml"
PROJECT_NAME="1001-stories"

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

log_command() {
    echo -e "${PURPLE}[CMD]${NC} $1"
}

# Function to show all available commands
show_commands() {
    echo "============================================"
    echo "1001 Stories - Docker Commands Reference"
    echo "============================================"
    echo ""
    echo "🚀 STARTUP COMMANDS:"
    echo "  start           - Start all services"
    echo "  build           - Build and start services"
    echo "  rebuild         - Force rebuild all images"
    echo "  up              - Start services in foreground"
    echo ""
    echo "🛑 SHUTDOWN COMMANDS:"
    echo "  stop            - Stop all services"
    echo "  down            - Stop and remove containers"
    echo "  clean           - Stop and remove containers + volumes"
    echo "  reset           - Complete reset (containers, volumes, images)"
    echo ""
    echo "🔍 MONITORING COMMANDS:"
    echo "  status          - Show service status"
    echo "  logs [service]  - Show logs (all or specific service)"
    echo "  stats           - Show resource usage"
    echo "  health          - Check service health"
    echo ""
    echo "🐛 DEBUGGING COMMANDS:"
    echo "  shell [service] - Open shell in container"
    echo "  exec [service]  - Execute command in container"
    echo "  inspect         - Inspect container configuration"
    echo ""
    echo "🗄️ DATABASE COMMANDS:"
    echo "  db-shell        - Open PostgreSQL shell"
    echo "  db-migrate      - Run database migrations"
    echo "  db-seed         - Seed database with demo data"
    echo "  db-reset        - Reset database (migrations + seed)"
    echo ""
    echo "🧪 TESTING COMMANDS:"
    echo "  test            - Run E2E tests"
    echo "  test-smoke      - Run smoke tests"
    echo "  test-headed     - Run tests with visible browser"
    echo ""
    echo "🔧 MAINTENANCE COMMANDS:"
    echo "  prune           - Clean unused Docker resources"
    echo "  update          - Pull latest images"
    echo "  backup          - Backup database"
    echo "  restore [file]  - Restore database from backup"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 logs app                 # Show app logs"
    echo "  $0 shell app                # Open shell in app container"
    echo "  $0 db-shell                 # Open PostgreSQL shell"
    echo "  $0 test                     # Run E2E tests"
}

# Startup commands
cmd_start() {
    log_info "Starting 1001 Stories services..."
    log_command "docker-compose -f $COMPOSE_FILE up -d"
    docker-compose -f "$COMPOSE_FILE" up -d
    sleep 5
    cmd_status
}

cmd_build() {
    log_info "Building and starting services..."
    log_command "docker-compose -f $COMPOSE_FILE up -d --build"
    docker-compose -f "$COMPOSE_FILE" up -d --build
    sleep 5
    cmd_status
}

cmd_rebuild() {
    log_info "Force rebuilding all images..."
    log_command "docker-compose -f $COMPOSE_FILE build --no-cache"
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    log_command "docker-compose -f $COMPOSE_FILE up -d"
    docker-compose -f "$COMPOSE_FILE" up -d
    sleep 5
    cmd_status
}

cmd_up() {
    log_info "Starting services in foreground..."
    log_command "docker-compose -f $COMPOSE_FILE up"
    docker-compose -f "$COMPOSE_FILE" up
}

# Shutdown commands
cmd_stop() {
    log_info "Stopping services..."
    log_command "docker-compose -f $COMPOSE_FILE stop"
    docker-compose -f "$COMPOSE_FILE" stop
    log_success "Services stopped"
}

cmd_down() {
    log_info "Stopping and removing containers..."
    log_command "docker-compose -f $COMPOSE_FILE down"
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Containers removed"
}

cmd_clean() {
    log_info "Stopping and removing containers + volumes..."
    log_command "docker-compose -f $COMPOSE_FILE down -v"
    docker-compose -f "$COMPOSE_FILE" down -v
    log_success "Containers and volumes removed"
}

cmd_reset() {
    log_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Performing complete reset..."
        docker-compose -f "$COMPOSE_FILE" down -v --rmi all
        docker system prune -f
        log_success "Complete reset performed"
    else
        log_info "Reset cancelled"
    fi
}

# Monitoring commands
cmd_status() {
    log_info "Service status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""

    # Check if services are healthy
    log_info "Health checks:"
    for container in "1001-stories-app-local" "1001-stories-postgres-local" "1001-stories-redis-local"; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
            if [ "$health" = "healthy" ]; then
                echo -e "  ${GREEN}✓${NC} $container: healthy"
            elif [ "$health" = "unhealthy" ]; then
                echo -e "  ${RED}✗${NC} $container: unhealthy"
            elif [ "$health" = "starting" ]; then
                echo -e "  ${YELLOW}⏳${NC} $container: starting"
            else
                echo -e "  ${BLUE}?${NC} $container: running (no health check)"
            fi
        else
            echo -e "  ${RED}✗${NC} $container: not running"
        fi
    done
    echo ""
}

cmd_logs() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        log_info "Showing logs for $service..."
        log_command "docker-compose -f $COMPOSE_FILE logs -f $service"
        docker-compose -f "$COMPOSE_FILE" logs -f "$service"
    else
        log_info "Showing logs for all services..."
        log_command "docker-compose -f $COMPOSE_FILE logs -f"
        docker-compose -f "$COMPOSE_FILE" logs -f
    fi
}

cmd_stats() {
    log_info "Container resource usage:"
    echo ""
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

cmd_health() {
    log_info "Running health checks..."

    # Test application endpoints
    local endpoints=("http://localhost:3000/api/health" "http://localhost:3000/")
    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
        if [ "$response" = "200" ]; then
            echo -e "  ${GREEN}✓${NC} $endpoint: HTTP $response"
        else
            echo -e "  ${RED}✗${NC} $endpoint: HTTP $response"
        fi
    done

    # Test database
    if docker exec 1001-stories-postgres-local pg_isready -U stories_user -d stories_db >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL: accessible"
    else
        echo -e "  ${RED}✗${NC} PostgreSQL: not accessible"
    fi

    # Test Redis
    if docker exec 1001-stories-redis-local redis-cli -a test_password ping >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Redis: accessible"
    else
        echo -e "  ${RED}✗${NC} Redis: not accessible"
    fi
}

# Debugging commands
cmd_shell() {
    local service="${1:-app}"
    log_info "Opening shell in $service container..."

    case "$service" in
        "app"|"application")
            log_command "docker exec -it 1001-stories-app-local /bin/sh"
            docker exec -it 1001-stories-app-local /bin/sh
            ;;
        "db"|"postgres"|"database")
            log_command "docker exec -it 1001-stories-postgres-local /bin/bash"
            docker exec -it 1001-stories-postgres-local /bin/bash
            ;;
        "redis")
            log_command "docker exec -it 1001-stories-redis-local /bin/sh"
            docker exec -it 1001-stories-redis-local /bin/sh
            ;;
        *)
            log_error "Unknown service: $service"
            log_info "Available services: app, db, redis"
            return 1
            ;;
    esac
}

cmd_exec() {
    local service="${1:-app}"
    shift
    local command="$*"

    if [ -z "$command" ]; then
        log_error "Please specify a command to execute"
        return 1
    fi

    log_info "Executing '$command' in $service container..."

    case "$service" in
        "app"|"application")
            log_command "docker exec -it 1001-stories-app-local $command"
            docker exec -it 1001-stories-app-local $command
            ;;
        "db"|"postgres"|"database")
            log_command "docker exec -it 1001-stories-postgres-local $command"
            docker exec -it 1001-stories-postgres-local $command
            ;;
        "redis")
            log_command "docker exec -it 1001-stories-redis-local $command"
            docker exec -it 1001-stories-redis-local $command
            ;;
        *)
            log_error "Unknown service: $service"
            return 1
            ;;
    esac
}

# Database commands
cmd_db_shell() {
    log_info "Opening PostgreSQL shell..."
    log_command "docker exec -it 1001-stories-postgres-local psql -U stories_user -d stories_db"
    docker exec -it 1001-stories-postgres-local psql -U stories_user -d stories_db
}

cmd_db_migrate() {
    log_info "Running database migrations..."
    log_command "docker exec 1001-stories-app-local npx prisma migrate deploy"
    docker exec 1001-stories-app-local npx prisma migrate deploy
    log_success "Migrations completed"
}

cmd_db_seed() {
    log_info "Seeding database with demo data..."
    log_command "docker exec 1001-stories-app-local npx prisma db seed"
    docker exec 1001-stories-app-local npx prisma db seed
    log_success "Database seeded"
}

cmd_db_reset() {
    log_info "Resetting database (migrations + seed)..."
    cmd_db_migrate
    cmd_db_seed
}

# Testing commands
cmd_test() {
    log_info "Running E2E tests..."
    if [ -f "scripts/test-docker-local.sh" ]; then
        ./scripts/test-docker-local.sh local
    else
        log_error "Test script not found"
        return 1
    fi
}

cmd_test_smoke() {
    log_info "Running smoke tests..."
    if [ -f "scripts/test-docker-local.sh" ]; then
        ./scripts/test-docker-local.sh smoke
    else
        log_error "Test script not found"
        return 1
    fi
}

cmd_test_headed() {
    log_info "Running tests with visible browser..."
    if [ -f "scripts/test-docker-local.sh" ]; then
        ./scripts/test-docker-local.sh local --headed
    else
        log_error "Test script not found"
        return 1
    fi
}

# Maintenance commands
cmd_prune() {
    log_info "Cleaning unused Docker resources..."
    log_command "docker system prune -f"
    docker system prune -f
    log_success "Cleanup completed"
}

cmd_update() {
    log_info "Pulling latest images..."
    log_command "docker-compose -f $COMPOSE_FILE pull"
    docker-compose -f "$COMPOSE_FILE" pull
    log_success "Images updated"
}

cmd_backup() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    log_info "Creating database backup: $backup_file"
    log_command "docker exec 1001-stories-postgres-local pg_dump -U stories_user stories_db > $backup_file"
    docker exec 1001-stories-postgres-local pg_dump -U stories_user stories_db > "$backup_file"
    log_success "Backup created: $backup_file"
}

cmd_restore() {
    local backup_file="$1"
    if [ -z "$backup_file" ]; then
        log_error "Please specify backup file"
        return 1
    fi

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    log_warning "This will overwrite the current database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restoring database from: $backup_file"
        cat "$backup_file" | docker exec -i 1001-stories-postgres-local psql -U stories_user -d stories_db
        log_success "Database restored"
    else
        log_info "Restore cancelled"
    fi
}

# Main function
main() {
    local command="${1:-help}"
    shift || true

    case "$command" in
        # Startup commands
        "start") cmd_start ;;
        "build") cmd_build ;;
        "rebuild") cmd_rebuild ;;
        "up") cmd_up ;;

        # Shutdown commands
        "stop") cmd_stop ;;
        "down") cmd_down ;;
        "clean") cmd_clean ;;
        "reset") cmd_reset ;;

        # Monitoring commands
        "status") cmd_status ;;
        "logs") cmd_logs "$@" ;;
        "stats") cmd_stats ;;
        "health") cmd_health ;;

        # Debugging commands
        "shell") cmd_shell "$@" ;;
        "exec") cmd_exec "$@" ;;

        # Database commands
        "db-shell") cmd_db_shell ;;
        "db-migrate") cmd_db_migrate ;;
        "db-seed") cmd_db_seed ;;
        "db-reset") cmd_db_reset ;;

        # Testing commands
        "test") cmd_test ;;
        "test-smoke") cmd_test_smoke ;;
        "test-headed") cmd_test_headed ;;

        # Maintenance commands
        "prune") cmd_prune ;;
        "update") cmd_update ;;
        "backup") cmd_backup ;;
        "restore") cmd_restore "$@" ;;

        # Help
        "help"|"-h"|"--help"|"commands")
            show_commands
            ;;

        *)
            log_error "Unknown command: $command"
            echo ""
            show_commands
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"