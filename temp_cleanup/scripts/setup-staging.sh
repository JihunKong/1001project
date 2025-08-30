#!/bin/bash

# 1001 Stories - Staging Environment Setup Script
# ===============================================
# Comprehensive staging environment setup for safe role system testing
# Part of Week 1 infrastructure preparation for Option 2 deployment strategy

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAGING_ENV_FILE="$PROJECT_ROOT/.env.staging"
COMPOSE_STAGING_FILE="$PROJECT_ROOT/docker-compose.staging.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Function to print banner
print_banner() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  1001 Stories - Staging Setup (Week 1)"
    echo "  Safe Role System Testing Environment"
    echo "=============================================="
    echo -e "${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        if ! docker compose version >/dev/null 2>&1; then
            log_error "Neither 'docker-compose' nor 'docker compose' is available."
            exit 1
        fi
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    log_success "Docker Compose is available: $DOCKER_COMPOSE_CMD"
    
    # Check if required files exist
    local required_files=(
        "$STAGING_ENV_FILE"
        "$COMPOSE_STAGING_FILE"
        "$PROJECT_ROOT/nginx/staging.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done
    log_success "All required files are present"
    
    # Check port availability
    local ports=(3001 5434 6380 8080 8081 5051 9091)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Port $port is already in use. This may cause conflicts."
        fi
    done
}

# Function to create necessary directories
create_directories() {
    log_info "Creating staging directories..."
    
    local directories=(
        "$PROJECT_ROOT/staging-data"
        "$PROJECT_ROOT/staging-backups"
        "$PROJECT_ROOT/nginx/ssl-staging"
        "$PROJECT_ROOT/nginx/logs-staging"
        "$PROJECT_ROOT/staging-assets"
        "$PROJECT_ROOT/staging-pgadmin-config"
        "$PROJECT_ROOT/staging-redis-config"
        "$PROJECT_ROOT/staging-monitoring"
        "$PROJECT_ROOT/scripts/staging-init"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_success "Created directory: $dir"
        else
            log_info "Directory already exists: $dir"
        fi
    done
    
    # Set proper permissions
    chmod 755 "$PROJECT_ROOT/staging-data"
    chmod 755 "$PROJECT_ROOT/staging-backups"
    chmod 700 "$PROJECT_ROOT/nginx/ssl-staging"
    
    log_success "All staging directories created and configured"
}

# Function to generate SSL certificates
generate_ssl_certificates() {
    log_info "Generating self-signed SSL certificates for staging..."
    
    local ssl_dir="$PROJECT_ROOT/nginx/ssl-staging"
    local cert_file="$ssl_dir/staging.crt"
    local key_file="$ssl_dir/staging.key"
    
    if [[ -f "$cert_file" && -f "$key_file" ]]; then
        log_info "SSL certificates already exist. Checking validity..."
        
        # Check if certificate is still valid (not expired)
        if openssl x509 -in "$cert_file" -noout -checkend 86400 >/dev/null 2>&1; then
            log_success "Existing SSL certificates are valid"
            return 0
        else
            log_warning "Existing SSL certificates are expired. Regenerating..."
        fi
    fi
    
    # Generate new SSL certificates
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$key_file" \
        -out "$cert_file" \
        -subj "/C=US/ST=California/L=San Francisco/O=1001 Stories/CN=localhost" \
        -extensions v3_req \
        -config <(cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = California
L = San Francisco
O = 1001 Stories
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
    )
    
    # Set proper permissions
    chmod 600 "$key_file"
    chmod 644 "$cert_file"
    
    log_success "SSL certificates generated successfully"
}

# Function to create monitoring configuration
create_monitoring_config() {
    log_info "Creating monitoring configuration..."
    
    # Prometheus configuration
    cat > "$PROJECT_ROOT/staging-monitoring/prometheus.yml" <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: '1001-stories-staging'
    static_configs:
      - targets: ['app-staging:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'postgres-staging'
    static_configs:
      - targets: ['postgres-staging:5432']
    scrape_interval: 30s

  - job_name: 'nginx-staging'
    static_configs:
      - targets: ['nginx-staging:443']
    scrape_interval: 30s
EOF
    
    # Grafana provisioning directory
    mkdir -p "$PROJECT_ROOT/staging-monitoring/grafana/datasources"
    mkdir -p "$PROJECT_ROOT/staging-monitoring/grafana/dashboards"
    
    # Grafana datasource configuration
    cat > "$PROJECT_ROOT/staging-monitoring/grafana/datasources/prometheus.yml" <<EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus-staging:9090
    isDefault: true
    editable: true
EOF
    
    log_success "Monitoring configuration created"
}

# Function to create database initialization scripts
create_database_init_scripts() {
    log_info "Creating database initialization scripts..."
    
    local init_dir="$PROJECT_ROOT/scripts/staging-init"
    
    # Script to set up staging database with proper permissions
    cat > "$init_dir/01-staging-setup.sql" <<EOF
-- 1001 Stories Staging Database Initialization
-- ============================================
-- Sets up staging database with proper permissions for role system testing

-- Ensure the database exists
SELECT 'CREATE DATABASE staging_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'staging_db');

-- Connect to the staging database
\c staging_db;

-- Create extensions if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set proper timezone
SET timezone = 'UTC';

-- Create staging-specific schemas if needed
CREATE SCHEMA IF NOT EXISTS staging_logs;
CREATE SCHEMA IF NOT EXISTS staging_migrations;

-- Log the initialization
INSERT INTO staging_logs.init_log (timestamp, message) 
VALUES (NOW(), 'Staging database initialized successfully')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE staging_db TO staging_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO staging_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO staging_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO staging_user;

-- Create a log table for staging operations
CREATE TABLE IF NOT EXISTS staging_logs.init_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message TEXT NOT NULL
);

COMMENT ON TABLE staging_logs.init_log IS 'Staging environment initialization and operation logs';
EOF
    
    # Script to create test data structure
    cat > "$init_dir/02-test-structure.sql" <<EOF
-- Create staging-specific tables for role system testing
CREATE TABLE IF NOT EXISTS staging_migrations.role_migration_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    old_role VARCHAR(50),
    new_role VARCHAR(50),
    migration_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    migration_status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    rollback_data JSONB
);

CREATE TABLE IF NOT EXISTS staging_migrations.test_results (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL,
    test_category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    result_data JSONB,
    execution_time INTERVAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE staging_migrations.role_migration_log IS 'Tracks all role system migrations in staging';
COMMENT ON TABLE staging_migrations.test_results IS 'Stores test execution results for validation';
EOF
    
    # Make scripts executable
    chmod +x "$init_dir"/*.sql
    
    log_success "Database initialization scripts created"
}

# Function to validate environment configuration
validate_environment() {
    log_info "Validating staging environment configuration..."
    
    # Check if .env.staging has required variables
    local required_vars=(
        "NODE_ENV"
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "DB_USER"
        "DB_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$STAGING_ENV_FILE"; then
            log_error "Required environment variable '$var' not found in .env.staging"
            exit 1
        fi
    done
    
    log_success "Environment configuration is valid"
}

# Function to pull required Docker images
pull_docker_images() {
    log_info "Pulling required Docker images..."
    
    local images=(
        "postgres:15-alpine"
        "nginx:alpine"
        "redis:7-alpine"
        "dpage/pgadmin4:latest"
        "prom/prometheus:latest"
        "grafana/grafana:latest"
    )
    
    for image in "${images[@]}"; do
        log_info "Pulling $image..."
        docker pull "$image"
    done
    
    log_success "All Docker images pulled successfully"
}

# Function to build the application image
build_application() {
    log_info "Building 1001 Stories application for staging..."
    
    cd "$PROJECT_ROOT"
    
    # Build the application with staging tag
    docker build -t 1001-stories:staging .
    
    if [[ $? -eq 0 ]]; then
        log_success "Application built successfully for staging"
    else
        log_error "Failed to build application for staging"
        exit 1
    fi
}

# Function to start staging services
start_staging_services() {
    log_info "Starting staging services..."
    
    cd "$PROJECT_ROOT"
    
    # Stop any existing staging containers
    $DOCKER_COMPOSE_CMD -f docker-compose.staging.yml down --remove-orphans >/dev/null 2>&1 || true
    
    # Start core services first (database, cache)
    log_info "Starting core services (database, cache)..."
    $DOCKER_COMPOSE_CMD -f docker-compose.staging.yml up -d postgres-staging redis-staging
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker exec 1001-stories-db-staging pg_isready -U staging_user -d staging_db >/dev/null 2>&1; then
            log_success "Database is ready"
            break
        fi
        
        ((attempt++))
        log_info "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 2
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Database failed to become ready within expected time"
        exit 1
    fi
    
    # Start application and proxy
    log_info "Starting application and proxy..."
    $DOCKER_COMPOSE_CMD -f docker-compose.staging.yml up -d app-staging nginx-staging
    
    # Start admin tools if requested
    if [[ "${START_ADMIN_TOOLS:-false}" == "true" ]]; then
        log_info "Starting admin tools (pgAdmin)..."
        $DOCKER_COMPOSE_CMD -f docker-compose.staging.yml --profile admin up -d
    fi
    
    # Start monitoring if requested
    if [[ "${START_MONITORING:-false}" == "true" ]]; then
        log_info "Starting monitoring services..."
        $DOCKER_COMPOSE_CMD -f docker-compose.staging.yml --profile monitoring up -d
    fi
    
    log_success "Staging services started successfully"
}

# Function to verify staging deployment
verify_staging_deployment() {
    log_info "Verifying staging deployment..."
    
    # Wait for application to be ready
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -k -f https://localhost:8080/api/health >/dev/null 2>&1; then
            log_success "Application health check passed"
            break
        fi
        
        ((attempt++))
        log_info "Waiting for application... (attempt $attempt/$max_attempts)"
        sleep 2
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Application health check failed"
        exit 1
    fi
    
    # Test database connection
    if docker exec 1001-stories-db-staging psql -U staging_user -d staging_db -c "SELECT version();" >/dev/null 2>&1; then
        log_success "Database connection test passed"
    else
        log_error "Database connection test failed"
        exit 1
    fi
    
    # Test Redis connection
    if docker exec 1001-stories-redis-staging redis-cli -a staging_redis_123 ping | grep -q "PONG"; then
        log_success "Redis connection test passed"
    else
        log_error "Redis connection test failed"
        exit 1
    fi
    
    log_success "All staging deployment verification tests passed"
}

# Function to display staging information
display_staging_info() {
    echo -e "\n${GREEN}=============================================="
    echo "  Staging Environment Ready!"
    echo -e "==============================================\n${NC}"
    
    echo -e "${BLUE}Access URLs:${NC}"
    echo "  • Application: https://localhost:8080"
    echo "  • HTTP Redirect: http://localhost:8081"
    echo "  • Database: localhost:5434"
    echo "  • Redis: localhost:6380"
    
    if [[ "${START_ADMIN_TOOLS:-false}" == "true" ]]; then
        echo "  • pgAdmin: http://localhost:5051"
    fi
    
    if [[ "${START_MONITORING:-false}" == "true" ]]; then
        echo "  • Prometheus: http://localhost:9091"
        echo "  • Grafana: http://localhost:3002"
    fi
    
    echo -e "\n${BLUE}Useful Commands:${NC}"
    echo "  • View logs: docker-compose -f docker-compose.staging.yml logs -f"
    echo "  • Stop staging: docker-compose -f docker-compose.staging.yml down"
    echo "  • Restart app: docker-compose -f docker-compose.staging.yml restart app-staging"
    echo "  • Database shell: docker exec -it 1001-stories-db-staging psql -U staging_user -d staging_db"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo "  1. Run migration tests: ./scripts/test-migration.sh"
    echo "  2. Copy production data: ./scripts/copy-production-data.sh"
    echo "  3. Validate staging: ./scripts/validate-staging.sh"
    
    echo -e "\n${YELLOW}Note:${NC} SSL certificate is self-signed. Accept the certificate warning in your browser."
}

# Function to handle cleanup on script exit
cleanup_on_exit() {
    if [[ $? -ne 0 ]]; then
        log_error "Setup failed. Cleaning up..."
        cd "$PROJECT_ROOT"
        $DOCKER_COMPOSE_CMD -f docker-compose.staging.yml down --remove-orphans >/dev/null 2>&1 || true
    fi
}

# Main execution
main() {
    # Set up cleanup on exit
    trap cleanup_on_exit EXIT
    
    print_banner
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --admin)
                export START_ADMIN_TOOLS=true
                shift
                ;;
            --monitoring)
                export START_MONITORING=true
                shift
                ;;
            --all)
                export START_ADMIN_TOOLS=true
                export START_MONITORING=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --admin       Start admin tools (pgAdmin)"
                echo "  --monitoring  Start monitoring services (Prometheus, Grafana)"
                echo "  --all         Start all optional services"
                echo "  --help, -h    Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Execute setup steps
    check_prerequisites
    create_directories
    generate_ssl_certificates
    create_monitoring_config
    create_database_init_scripts
    validate_environment
    pull_docker_images
    build_application
    start_staging_services
    verify_staging_deployment
    display_staging_info
    
    log_success "Staging environment setup completed successfully!"
    
    # Disable cleanup on successful exit
    trap - EXIT
}

# Execute main function with all arguments
main "$@"