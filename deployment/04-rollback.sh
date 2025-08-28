#!/bin/bash

# 1001 Stories Emergency Rollback Script
# Rapid rollback to previous stable version with database restore

set -e

SERVER_IP="3.128.143.122"
PROJECT_DIR="/home/ubuntu/1001-stories"
ROLLBACK_TIMEOUT=300  # 5 minutes timeout for rollback operations

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

# Function to test service health
test_health() {
    local endpoint=$1
    local max_retries=${2:-3}
    
    for i in $(seq 1 $max_retries); do
        if curl -sf "$endpoint" >/dev/null 2>&1; then
            return 0
        fi
        sleep 5
    done
    return 1
}

# Function to wait for container to be healthy
wait_for_healthy() {
    local container_name=$1
    local max_retries=${2:-10}
    
    for i in $(seq 1 $max_retries); do
        HEALTH_STATUS=$(run_remote "docker inspect --format='{{.State.Health.Status}}' $container_name 2>/dev/null || echo 'unknown'")
        
        if [ "$HEALTH_STATUS" = "healthy" ]; then
            return 0
        fi
        
        log_info "Waiting for $container_name to be healthy (attempt $i/$max_retries)..."
        sleep 10
    done
    return 1
}

# Parse command line arguments
ROLLBACK_TYPE="application"  # Default to application rollback
DATABASE_ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --database)
            DATABASE_ROLLBACK=true
            ROLLBACK_TYPE="full"
            shift
            ;;
        --full)
            DATABASE_ROLLBACK=true
            ROLLBACK_TYPE="full"
            shift
            ;;
        --app-only)
            ROLLBACK_TYPE="application"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --app-only    Rollback application only (default)"
            echo "  --database    Rollback database and application"
            echo "  --full        Same as --database"
            echo "  -h, --help    Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "===================================================="
echo "1001 STORIES EMERGENCY ROLLBACK"
echo "Rollback Type: $ROLLBACK_TYPE"
echo "Database Rollback: $DATABASE_ROLLBACK"
echo "Server: $SERVER_IP"
echo "Timestamp: $(date)"
echo "===================================================="

if [ "$DATABASE_ROLLBACK" = true ]; then
    log_warning "DATABASE ROLLBACK REQUESTED - This will restore user data to pre-migration state"
    echo "This means:"
    echo "• 2 CUSTOMER users will become LEARNER users again"
    echo "• Any user activity since migration will be LOST"
    echo "• Role system will revert to old behavior"
    echo ""
    read -p "Are you sure you want to proceed? (type 'yes' to continue): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
fi

echo -e "\n${BLUE}=== STEP 1: ASSESSMENT AND PREPARATION ===${NC}"

# Check current deployment status
log_info "Assessing current deployment status..."

CURRENT_CONTAINERS=$(run_remote "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" || echo "ERROR")

echo "Current container status:"
echo "$CURRENT_CONTAINERS"

# Identify which environment is currently active
BLUE_STATUS=$(run_remote "docker ps -q -f name=1001-stories-app-blue" || echo "")
GREEN_STATUS=$(run_remote "docker ps -q -f name=1001-stories-app-green" || echo "")

if [ -n "$GREEN_STATUS" ]; then
    ACTIVE_ENV="green"
    ROLLBACK_TO="blue"
    log_info "Currently running GREEN environment, will rollback to BLUE"
elif [ -n "$BLUE_STATUS" ]; then
    ACTIVE_ENV="blue"
    ROLLBACK_TO="green"
    log_warning "Currently running BLUE environment - unusual for rollback scenario"
else
    log_error "Cannot determine active environment. Manual intervention required."
    exit 1
fi

# Check if target environment is available
TARGET_IMAGE=$(run_remote "docker images -q 1001stories:blue 2>/dev/null" || echo "")
if [ -z "$TARGET_IMAGE" ] && [ "$ROLLBACK_TO" = "blue" ]; then
    log_error "Blue environment image not found. Cannot rollback."
    echo "Available images:"
    run_remote "docker images 1001stories"
    exit 1
fi

echo -e "\n${BLUE}=== STEP 2: DATABASE ROLLBACK (if requested) ===${NC}"

if [ "$DATABASE_ROLLBACK" = true ]; then
    log_warning "Starting database rollback process..."
    
    # Find the most recent backup
    BACKUP_FILE=$(run_remote "ls -t /tmp/pre-migration-backup-*.sql 2>/dev/null | head -1" || echo "")
    
    if [ -z "$BACKUP_FILE" ]; then
        log_error "No database backup found for rollback"
        log_info "Available backups:"
        run_remote "ls -la /tmp/*backup*.sql" || echo "No backup files found"
        exit 1
    fi
    
    log_info "Using backup: $BACKUP_FILE"
    
    # Stop application containers to prevent database access during restore
    log_info "Stopping application containers for database restore..."
    run_remote "docker stop 1001-stories-app-green 1001-stories-app-blue" || true
    
    # Restore database from backup
    log_info "Restoring database from backup..."
    RESTORE_OUTPUT=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB < $BACKUP_FILE" 2>&1)
    
    if echo "$RESTORE_OUTPUT" | grep -q "ERROR"; then
        log_error "Database restore failed:"
        echo "$RESTORE_OUTPUT"
        exit 1
    fi
    
    log_success "Database restored from backup"
    
    # Verify database state
    log_info "Verifying database rollback..."
    USER_ROLES=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT role, COUNT(*) FROM \\\"User\\\" GROUP BY role;\"" 2>/dev/null)
    
    echo "Post-rollback user roles:"
    echo "$USER_ROLES"
    
    # Update migration log to indicate rollback
    run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"UPDATE migration_log SET status = 'ROLLED_BACK', completed_at = NOW(), notes = notes || ' | ROLLED BACK at $(date)' WHERE migration_name = 'role_system_redesign_learner_to_customer';\"" || log_warning "Could not update migration log"
fi

echo -e "\n${BLUE}=== STEP 3: APPLICATION ROLLBACK ===${NC}"

log_info "Starting application rollback to $ROLLBACK_TO environment..."

if [ "$ROLLBACK_TO" = "blue" ]; then
    # Start blue environment if not running
    BLUE_RUNNING=$(run_remote "docker ps -q -f name=1001-stories-app-blue" || echo "")
    
    if [ -z "$BLUE_RUNNING" ]; then
        log_info "Starting blue environment..."
        run_remote "cd $PROJECT_DIR && docker-compose up -d app" || {
            log_error "Failed to start blue environment using standard compose"
            # Try using blue-green compose
            run_remote "cd $PROJECT_DIR && docker-compose -f docker-compose.blue-green.yml up -d app-blue"
        }
        
        # Wait for blue environment to be healthy
        if ! wait_for_healthy "1001-stories-app-blue"; then
            log_error "Blue environment failed to start properly"
            run_remote "docker logs --tail=20 1001-stories-app-blue" || true
            exit 1
        fi
    fi
    
    log_success "Blue environment is running and healthy"
    
    # Switch nginx to blue environment
    log_info "Switching nginx traffic to blue environment..."
    
    # Restore original nginx configuration or create blue-focused config
    if run_remote "test -f $PROJECT_DIR/nginx/nginx.conf.backup-*"; then
        BACKUP_CONFIG=$(run_remote "ls -t $PROJECT_DIR/nginx/nginx.conf.backup-* | head -1")
        run_remote "cp $BACKUP_CONFIG $PROJECT_DIR/nginx/nginx.conf"
        log_info "Restored nginx configuration from backup"
    else
        # Create blue-focused configuration
        run_remote "cd $PROJECT_DIR && sed 's/server app-green:3000/server app-blue:3000/g' nginx/nginx-blue-green.conf > nginx/nginx-blue.conf && cp nginx/nginx-blue.conf nginx/nginx.conf"
        log_info "Created blue-focused nginx configuration"
    fi
    
    # Reload nginx
    run_remote "docker exec 1001-stories-nginx nginx -s reload"
    
    # Wait for nginx to process the reload
    sleep 5
    
    # Stop green environment
    log_info "Stopping green environment..."
    run_remote "docker stop 1001-stories-app-green && docker rm 1001-stories-app-green" || log_warning "Green environment may not be running"
    
else
    log_error "Rollback to green environment not implemented (unusual scenario)"
    exit 1
fi

echo -e "\n${BLUE}=== STEP 4: POST-ROLLBACK VALIDATION ===${NC}"

log_info "Validating rollback success..."

# Test main site
for i in {1..5}; do
    if test_health "https://1001stories.seedsofempowerment.org" 1; then
        log_success "Main site responding correctly (test $i/5)"
        break
    else
        log_warning "Main site test $i/5 failed, retrying..."
        if [ $i -eq 5 ]; then
            log_error "Main site validation failed after 5 attempts"
        fi
        sleep 5
    fi
done

# Test API health
API_HEALTH=$(curl -s "https://1001stories.seedsofempowerment.org/api/health" 2>/dev/null || echo "failed")

if echo "$API_HEALTH" | grep -q '"status":"ok"'; then
    log_success "API endpoints responding correctly"
else
    log_error "API health check failed: $API_HEALTH"
fi

# Test authentication endpoints
AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" "https://1001stories.seedsofempowerment.org/login" 2>/dev/null || echo "failed")

if [ "$AUTH_TEST" = "200" ]; then
    log_success "Authentication endpoints accessible"
else
    log_warning "Authentication endpoints test returned: $AUTH_TEST"
fi

echo -e "\n${BLUE}=== STEP 5: CLEANUP AND MONITORING ===${NC}"

# Clean up any failed containers or images
log_info "Cleaning up deployment artifacts..."

run_remote "docker system prune -f" || log_warning "Docker cleanup had issues"

# Start monitoring for the next few minutes
log_info "Monitoring system stability for 2 minutes..."

for i in {1..8}; do
    if test_health "https://1001stories.seedsofempowerment.org/api/health" 1; then
        echo -n "✓"
    else
        echo -n "✗"
        log_warning "Stability check $i/8 failed"
    fi
    sleep 15
done
echo ""

echo -e "\n${GREEN}=== ROLLBACK COMPLETED ===${NC}"

echo ""
echo "Rollback Summary:"
echo "================="
echo "• Active environment: $ROLLBACK_TO"
echo "• Database rollback: $DATABASE_ROLLBACK"
echo "• Service status: $(test_health "https://1001stories.seedsofempowerment.org/api/health" 1 && echo "Healthy" || echo "Check required")"
echo ""

if [ "$DATABASE_ROLLBACK" = true ]; then
    echo "Database Changes:"
    echo "=================="
    echo "• User roles restored to pre-migration state"
    echo "• CUSTOMER users reverted to LEARNER users"
    echo "• Any post-migration user data has been lost"
    echo ""
fi

echo "Current System State:"
echo "===================="
run_remote "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo ""
echo "Next Steps:"
echo "==========="
echo "1. Monitor application logs: ssh ubuntu@$SERVER_IP 'docker logs -f 1001-stories-app-blue'"
echo "2. Verify user access and functionality"
echo "3. Investigate root cause of deployment issues"
echo "4. Plan fixes before next deployment attempt"

echo ""
echo "Manual Verification Commands:"
echo "============================="
echo "• Health check: curl https://1001stories.seedsofempowerment.org/api/health"
echo "• Login page: curl -I https://1001stories.seedsofempowerment.org/login"
echo "• Container logs: docker logs 1001-stories-app-blue"

if [ "$DATABASE_ROLLBACK" = true ]; then
    echo ""
    echo "Database Verification:"
    echo "====================="
    echo "• Check user roles: SELECT role, COUNT(*) FROM \"User\" GROUP BY role;"
    echo "• Verify user sessions are still valid"
    echo "• Confirm no data corruption occurred"
fi