#!/bin/bash

# 1001 Stories Infrastructure Assessment Script
# Phase 1: Pre-deployment assessment, backup, and health diagnosis

set -e

SERVER_IP="3.128.143.122"
BACKUP_DIR="/tmp/1001-stories-backup-$(date +%Y%m%d-%H%M%S)"
PROJECT_DIR="/home/ubuntu/1001-stories"

echo "===================================================="
echo "1001 STORIES INFRASTRUCTURE ASSESSMENT"
echo "Server: $SERVER_IP"
echo "Timestamp: $(date)"
echo "===================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to run remote commands via SSH
run_remote() {
    ssh -o StrictHostKeyChecking=no ubuntu@$SERVER_IP "$1"
}

# Function to copy files from remote server
copy_from_remote() {
    scp -o StrictHostKeyChecking=no ubuntu@$SERVER_IP:"$1" "$2"
}

echo -e "\n${BLUE}=== STEP 1: CONTAINER STATUS ASSESSMENT ===${NC}"
log_info "Checking current container status..."

CONTAINER_STATUS=$(run_remote "cd $PROJECT_DIR && docker-compose ps --format='table {{.Name}}\t{{.Status}}\t{{.Ports}}'")
echo "$CONTAINER_STATUS"

# Parse container health
UNHEALTHY_CONTAINERS=$(run_remote "cd $PROJECT_DIR && docker-compose ps --filter health=unhealthy --format='{{.Names}}'")
HEALTHY_CONTAINERS=$(run_remote "cd $PROJECT_DIR && docker-compose ps --filter health=healthy --format='{{.Names}}'")

if [ -n "$UNHEALTHY_CONTAINERS" ]; then
    log_warning "Found unhealthy containers:"
    echo "$UNHEALTHY_CONTAINERS"
else
    log_success "All containers report healthy status"
fi

echo -e "\n${BLUE}=== STEP 2: CONTAINER LOGS ANALYSIS ===${NC}"
log_info "Analyzing container logs for health issues..."

# Check app container logs
log_info "Checking app container logs (last 50 lines)..."
run_remote "cd $PROJECT_DIR && docker-compose logs --tail=50 app" || log_warning "Could not retrieve app logs"

# Check nginx container logs
log_info "Checking nginx container logs (last 50 lines)..."
run_remote "cd $PROJECT_DIR && docker-compose logs --tail=50 nginx" || log_warning "Could not retrieve nginx logs"

# Check database container logs
log_info "Checking database container logs (last 20 lines)..."
run_remote "cd $PROJECT_DIR && docker-compose logs --tail=20 db" || log_warning "Could not retrieve db logs"

echo -e "\n${BLUE}=== STEP 3: SYSTEM RESOURCES CHECK ===${NC}"
log_info "Checking system resources..."

DISK_USAGE=$(run_remote "df -h / | tail -1")
MEMORY_USAGE=$(run_remote "free -h")
CPU_LOAD=$(run_remote "uptime")

echo "Disk Usage: $DISK_USAGE"
echo "Memory Usage:"
echo "$MEMORY_USAGE"
echo "CPU Load: $CPU_LOAD"

# Check for disk space issues
DISK_PERCENT=$(echo "$DISK_USAGE" | awk '{print $5}' | sed 's/%//')
if [ "$DISK_PERCENT" -gt 80 ]; then
    log_warning "Disk usage is above 80%: ${DISK_PERCENT}%"
else
    log_success "Disk usage is acceptable: ${DISK_PERCENT}%"
fi

echo -e "\n${BLUE}=== STEP 4: DATABASE CONNECTIVITY TEST ===${NC}"
log_info "Testing database connectivity and user count..."

# Test database connection
DB_CONNECTION_TEST=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'SELECT NOW();'" 2>/dev/null || echo "FAILED")

if [ "$DB_CONNECTION_TEST" != "FAILED" ]; then
    log_success "Database connection successful"
    
    # Get current user count and roles
    USER_COUNT=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT COUNT(*) FROM \\\"User\\\";\"" | grep -o '[0-9]\+' | head -1)
    log_info "Current user count: $USER_COUNT"
    
    # Get role distribution
    ROLE_DISTRIBUTION=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT role, COUNT(*) FROM \\\"User\\\" GROUP BY role;\"")
    echo "Current role distribution:"
    echo "$ROLE_DISTRIBUTION"
    
else
    log_error "Database connection failed"
fi

echo -e "\n${BLUE}=== STEP 5: BACKUP CREATION ===${NC}"
log_info "Creating comprehensive backup before deployment..."

mkdir -p "$BACKUP_DIR"

# Database backup
log_info "Creating database backup..."
run_remote "cd $PROJECT_DIR && docker-compose exec -T db pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB" > "$BACKUP_DIR/database_backup.sql"

if [ -s "$BACKUP_DIR/database_backup.sql" ]; then
    log_success "Database backup created: $(wc -l < "$BACKUP_DIR/database_backup.sql") lines"
else
    log_error "Database backup failed or empty"
    exit 1
fi

# Docker compose configuration backup
log_info "Backing up Docker Compose configuration..."
copy_from_remote "$PROJECT_DIR/docker-compose.yml" "$BACKUP_DIR/"
copy_from_remote "$PROJECT_DIR/.env.production" "$BACKUP_DIR/" 2>/dev/null || log_warning "No .env.production found"

# Current container images backup
log_info "Documenting current container images..."
run_remote "docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}'" > "$BACKUP_DIR/current_images.txt"

log_success "Backup created in: $BACKUP_DIR"

echo -e "\n${BLUE}=== STEP 6: HEALTH CHECK ENDPOINT TESTING ===${NC}"
log_info "Testing application health endpoints..."

# Test health endpoint
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://1001stories.seedsofempowerment.org/api/health" || echo "FAILED")

if [ "$HEALTH_CHECK" = "200" ]; then
    log_success "Health endpoint responding: HTTP 200"
else
    log_warning "Health endpoint issue: HTTP $HEALTH_CHECK"
fi

# Test main page
MAIN_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "https://1001stories.seedsofempowerment.org" || echo "FAILED")

if [ "$MAIN_PAGE" = "200" ]; then
    log_success "Main page responding: HTTP 200"
else
    log_warning "Main page issue: HTTP $MAIN_PAGE"
fi

echo -e "\n${BLUE}=== STEP 7: ASSESSMENT SUMMARY ===${NC}"

# Create assessment report
ASSESSMENT_REPORT="$BACKUP_DIR/assessment_report.txt"
{
    echo "1001 Stories Infrastructure Assessment Report"
    echo "=============================================="
    echo "Assessment Time: $(date)"
    echo "Server: $SERVER_IP"
    echo ""
    echo "Container Status:"
    echo "$CONTAINER_STATUS"
    echo ""
    echo "Unhealthy Containers:"
    echo "${UNHEALTHY_CONTAINERS:-None}"
    echo ""
    echo "System Resources:"
    echo "Disk Usage: $DISK_USAGE"
    echo "CPU Load: $CPU_LOAD"
    echo ""
    echo "Database:"
    echo "Connection: $([ "$DB_CONNECTION_TEST" != "FAILED" ] && echo "OK" || echo "FAILED")"
    echo "User Count: ${USER_COUNT:-Unknown}"
    echo ""
    echo "Health Checks:"
    echo "API Health: HTTP $HEALTH_CHECK"
    echo "Main Page: HTTP $MAIN_PAGE"
    echo ""
    echo "Backup Location: $BACKUP_DIR"
} > "$ASSESSMENT_REPORT"

echo "Assessment Summary:"
echo "=================="
echo "• Backup created in: $BACKUP_DIR"
echo "• Database users: ${USER_COUNT:-Unknown}"
echo "• Unhealthy containers: $(echo "$UNHEALTHY_CONTAINERS" | wc -w)"
echo "• System health: $([ "$HEALTH_CHECK" = "200" ] && echo "OK" || echo "NEEDS ATTENTION")"

if [ -n "$UNHEALTHY_CONTAINERS" ] || [ "$HEALTH_CHECK" != "200" ]; then
    log_warning "Infrastructure issues detected. Review logs and fix before proceeding with deployment."
    echo ""
    echo "Next Steps:"
    echo "1. Review container logs above"
    echo "2. Fix unhealthy containers"
    echo "3. Verify health endpoints"
    echo "4. Re-run this assessment"
    exit 1
else
    log_success "Infrastructure assessment complete. System ready for deployment."
    echo ""
    echo "Next Steps:"
    echo "1. Run database migration: ./02-database-migration.sh"
    echo "2. Deploy new version: ./03-blue-green-deploy.sh"
fi

echo ""
echo "Backup and assessment files saved to: $BACKUP_DIR"