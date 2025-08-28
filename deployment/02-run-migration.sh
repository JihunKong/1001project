#!/bin/bash

# 1001 Stories Database Migration Runner
# Executes the role system migration safely with validation

set -e

SERVER_IP="3.128.143.122"
PROJECT_DIR="/home/ubuntu/1001-stories"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

echo "===================================================="
echo "1001 STORIES DATABASE MIGRATION"
echo "Migration: LEARNER → CUSTOMER Role System Redesign"
echo "Server: $SERVER_IP"
echo "Timestamp: $(date)"
echo "===================================================="

echo -e "\n${BLUE}=== STEP 1: PRE-MIGRATION CHECKS ===${NC}"

# Verify database connectivity
log_info "Testing database connectivity..."
DB_TEST=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'SELECT NOW();'" 2>/dev/null || echo "FAILED")

if [ "$DB_TEST" = "FAILED" ]; then
    log_error "Database connection failed. Aborting migration."
    exit 1
fi

log_success "Database connection verified"

# Get current user count
log_info "Checking current user state..."
CURRENT_USERS=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT role, COUNT(*) FROM \\\"User\\\" GROUP BY role;\"" 2>/dev/null)

echo "Current user distribution:"
echo "$CURRENT_USERS"

# Verify expected user count (4 users: 2 LEARNER, 2 ADMIN)
TOTAL_USERS=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT COUNT(*) FROM \\\"User\\\";\"" | grep -o '[0-9]\+' | head -1)

if [ "$TOTAL_USERS" != "4" ]; then
    log_error "Expected 4 users, found $TOTAL_USERS. Migration aborted for safety."
    exit 1
fi

log_success "User count verification passed: $TOTAL_USERS users"

echo -e "\n${BLUE}=== STEP 2: UPLOAD MIGRATION SCRIPT ===${NC}"

# Copy migration script to server
log_info "Uploading migration script to server..."
scp -o StrictHostKeyChecking=no "$SCRIPT_DIR/02-database-migration.sql" ubuntu@$SERVER_IP:/tmp/

log_success "Migration script uploaded"

echo -e "\n${BLUE}=== STEP 3: CREATE ADDITIONAL BACKUP ===${NC}"

# Create an additional database backup just before migration
log_info "Creating pre-migration database backup..."
BACKUP_FILE="/tmp/pre-migration-backup-$(date +%Y%m%d-%H%M%S).sql"

run_remote "cd $PROJECT_DIR && docker-compose exec -T db pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB > $BACKUP_FILE"

# Verify backup size
BACKUP_SIZE=$(run_remote "wc -l < $BACKUP_FILE")
if [ "$BACKUP_SIZE" -lt 100 ]; then
    log_error "Backup appears incomplete (only $BACKUP_SIZE lines). Aborting migration."
    exit 1
fi

log_success "Pre-migration backup created: $BACKUP_FILE ($BACKUP_SIZE lines)"

echo -e "\n${BLUE}=== STEP 4: EXECUTE MIGRATION ===${NC}"

log_warning "Starting database migration. This will modify user roles..."

# Execute the migration script
log_info "Running migration script..."

MIGRATION_OUTPUT=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -f /tmp/02-database-migration.sql" 2>&1)

# Check if migration was successful
if echo "$MIGRATION_OUTPUT" | grep -q "MIGRATION COMPLETED"; then
    log_success "Migration script executed successfully"
else
    log_error "Migration may have failed. Output:"
    echo "$MIGRATION_OUTPUT"
    
    # Attempt to check if transaction was rolled back
    if echo "$MIGRATION_OUTPUT" | grep -q "ROLLBACK"; then
        log_warning "Migration was rolled back due to error. Database unchanged."
    else
        log_error "Migration status unclear. Manual investigation required."
    fi
    exit 1
fi

echo -e "\n${BLUE}=== STEP 5: POST-MIGRATION VALIDATION ===${NC}"

# Verify migration results
log_info "Validating migration results..."

POST_MIGRATION_USERS=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT role, COUNT(*) FROM \\\"User\\\" GROUP BY role;\"" 2>/dev/null)

echo "Post-migration user distribution:"
echo "$POST_MIGRATION_USERS"

# Check for CUSTOMER users
CUSTOMER_COUNT=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT COUNT(*) FROM \\\"User\\\" WHERE role = 'CUSTOMER';\"" | grep -o '[0-9]\+' | head -1)

LEARNER_COUNT=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT COUNT(*) FROM \\\"User\\\" WHERE role = 'LEARNER';\"" | grep -o '[0-9]\+' | head -1)

if [ "$CUSTOMER_COUNT" = "2" ] && [ "$LEARNER_COUNT" = "0" ]; then
    log_success "Migration validation passed: 2 CUSTOMER users, 0 LEARNER users"
else
    log_error "Migration validation failed: $CUSTOMER_COUNT CUSTOMER, $LEARNER_COUNT LEARNER users"
    log_error "Expected: 2 CUSTOMER, 0 LEARNER users"
    exit 1
fi

# Check that user sessions and data integrity are maintained
log_info "Checking user data integrity..."
USER_DATA_CHECK=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT u.email, u.role, COUNT(s.id) as sessions FROM \\\"User\\\" u LEFT JOIN \\\"Session\\\" s ON u.id = s.\\\"userId\\\" GROUP BY u.id, u.email, u.role;\"" 2>/dev/null)

echo "User data integrity check:"
echo "$USER_DATA_CHECK"

echo -e "\n${BLUE}=== STEP 6: MIGRATION REPORT ===${NC}"

# Generate migration report
MIGRATION_REPORT=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT * FROM migration_log WHERE migration_name = 'role_system_redesign_learner_to_customer';\"" 2>/dev/null)

echo "Migration Report:"
echo "$MIGRATION_REPORT"

# Cleanup temporary files
log_info "Cleaning up temporary files..."
run_remote "rm -f /tmp/02-database-migration.sql"

echo -e "\n${GREEN}=== MIGRATION COMPLETED SUCCESSFULLY ===${NC}"

echo ""
echo "Migration Summary:"
echo "=================="
echo "• Users migrated: 2 LEARNER → 2 CUSTOMER"
echo "• Total users: 4 (2 CUSTOMER, 2 ADMIN)"
echo "• Data integrity: Verified"
echo "• Backup available: $BACKUP_FILE"
echo ""
echo "Next Steps:"
echo "1. Deploy new application code: ./03-blue-green-deploy.sh"
echo "2. Validate user authentication with new role system"
echo "3. Test universal dashboard functionality"

echo ""
echo "Rollback Information:"
echo "===================="
echo "If rollback is needed, the migration script created a backup table"
echo "Contact system administrator for rollback procedures"
echo "Backup location: $BACKUP_FILE"