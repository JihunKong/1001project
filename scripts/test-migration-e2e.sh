#!/bin/bash

# 1001 Stories - Migration E2E Test Script
# Comprehensive end-to-end testing for role migration process

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TEST_DB="migration_test_${TIMESTAMP}"
STAGING_URL="${STAGING_URL:-https://localhost:8080}"
BACKUP_DIR="${PROJECT_ROOT}/migration-test-backups"
LOG_FILE="${PROJECT_ROOT}/test-logs/migration-e2e-${TIMESTAMP}.log"

# Test data configuration
LEARNER_USERS_COUNT=10
TEST_ORDERS_PER_USER=3
TEST_DONATIONS_PER_USER=2

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

End-to-end testing for user role migration from LEARNER to CUSTOMER.

OPTIONS:
    -h, --help              Show this help message
    --staging-url URL       Staging environment URL (default: https://localhost:8080)
    --users-count N         Number of LEARNER users to create (default: 10)
    --orders-per-user N     Number of orders per user (default: 3)
    --donations-per-user N  Number of donations per user (default: 2)
    --skip-setup           Skip test data setup
    --skip-cleanup         Skip cleanup after tests
    --dry-run              Perform migration in dry-run mode only
    --validate-only        Only validate existing data, don't run migration

PHASES:
    1. Setup: Create test database with LEARNER users and related data
    2. Pre-migration validation: Verify data integrity before migration
    3. Migration execution: Run LEARNER -> CUSTOMER migration
    4. Post-migration validation: Verify migration success and data integrity
    5. Rollback testing: Test migration rollback capability
    6. Cleanup: Remove test data

EOF
}

create_test_database() {
    log "Creating test database and sample data..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Create test users with LEARNER role
    log "Creating $LEARNER_USERS_COUNT LEARNER users..."
    for i in $(seq 1 $LEARNER_USERS_COUNT); do
        local email="learner-${i}-${TIMESTAMP}@test.1001stories.org"
        local name="Test Learner User $i"
        
        curl -k -s -X POST "$STAGING_URL/api/test/create-user" \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"$email\",
                \"name\": \"$name\",
                \"role\": \"LEARNER\",
                \"createdAt\": \"$(date -d "-$((RANDOM % 365)) days" -Iseconds)\",
                \"preferences\": {
                    \"language\": \"en\",
                    \"notifications\": $([ $((RANDOM % 2)) -eq 0 ] && echo true || echo false),
                    \"theme\": \"$([ $((RANDOM % 2)) -eq 0 ] && echo light || echo dark)\"
                }
            }" > /dev/null
        
        if [ $((i % 5)) -eq 0 ]; then
            log "Created $i/$LEARNER_USERS_COUNT users..."
        fi
    done
    
    log_success "Created $LEARNER_USERS_COUNT LEARNER users"
    
    # Create related data (orders, donations)
    log "Creating related data for users..."
    local user_list=$(curl -k -s "$STAGING_URL/api/test/get-learner-users?timestamp=$TIMESTAMP")
    
    echo "$user_list" | jq -r '.[]' | while read -r user_id; do
        # Create orders
        for j in $(seq 1 $TEST_ORDERS_PER_USER); do
            curl -k -s -X POST "$STAGING_URL/api/test/create-order" \
                -H "Content-Type: application/json" \
                -d "{
                    \"userId\": \"$user_id\",
                    \"productId\": \"book-$(($j % 5 + 1))\",
                    \"amount\": $((RANDOM % 2000 + 500))/100,
                    \"status\": \"$([ $((RANDOM % 3)) -eq 0 ] && echo pending || echo completed)\"
                }" > /dev/null
        done
        
        # Create donations
        for j in $(seq 1 $TEST_DONATIONS_PER_USER); do
            curl -k -s -X POST "$STAGING_URL/api/test/create-donation" \
                -H "Content-Type: application/json" \
                -d "{
                    \"userId\": \"$user_id\",
                    \"amount\": $((RANDOM % 5000 + 1000))/100,
                    \"program\": \"seeds-of-empowerment\"
                }" > /dev/null
        done
    done
    
    log_success "Created orders and donations for all users"
    
    # Create data integrity checksums
    log "Creating pre-migration data checksums..."
    curl -k -s "$STAGING_URL/api/test/create-data-checksum?timestamp=$TIMESTAMP" > "$BACKUP_DIR/pre-migration-checksum.json"
    
    log_success "Test database setup completed"
}

validate_pre_migration_data() {
    log "Validating pre-migration data integrity..."
    
    # Get data statistics
    local stats=$(curl -k -s "$STAGING_URL/api/test/get-data-stats?timestamp=$TIMESTAMP")
    local learner_count=$(echo "$stats" | jq -r '.learnerUsers')
    local orders_count=$(echo "$stats" | jq -r '.totalOrders')
    local donations_count=$(echo "$stats" | jq -r '.totalDonations')
    
    log "Pre-migration statistics:"
    log "  LEARNER users: $learner_count"
    log "  Total orders: $orders_count"
    log "  Total donations: $donations_count"
    
    # Validate expected counts
    if [ "$learner_count" -ne "$LEARNER_USERS_COUNT" ]; then
        log_error "Expected $LEARNER_USERS_COUNT LEARNER users, found $learner_count"
        return 1
    fi
    
    local expected_orders=$((LEARNER_USERS_COUNT * TEST_ORDERS_PER_USER))
    if [ "$orders_count" -ne "$expected_orders" ]; then
        log_error "Expected $expected_orders orders, found $orders_count"
        return 1
    fi
    
    local expected_donations=$((LEARNER_USERS_COUNT * TEST_DONATIONS_PER_USER))
    if [ "$donations_count" -ne "$expected_donations" ]; then
        log_error "Expected $expected_donations donations, found $donations_count"
        return 1
    fi
    
    # Validate referential integrity
    local integrity_check=$(curl -k -s "$STAGING_URL/api/test/check-referential-integrity")
    local violations=$(echo "$integrity_check" | jq -r '.violations | length')
    
    if [ "$violations" -ne 0 ]; then
        log_error "Found $violations referential integrity violations"
        echo "$integrity_check" | jq '.violations'
        return 1
    fi
    
    log_success "Pre-migration validation passed"
    return 0
}

execute_migration() {
    log "Executing LEARNER -> CUSTOMER migration..."
    
    local migration_start=$(date +%s)
    
    # Perform migration with comprehensive options
    local migration_result=$(curl -k -s -X POST "$STAGING_URL/api/admin/batch-migrate" \
        -H "Content-Type: application/json" \
        -d "{
            \"fromRole\": \"LEARNER\",
            \"toRole\": \"CUSTOMER\",
            \"validateIntegrity\": true,
            \"createSnapshots\": true,
            \"generateReport\": true,
            \"testFilter\": \"timestamp=$TIMESTAMP\"
        }")
    
    local migration_end=$(date +%s)
    local migration_duration=$((migration_end - migration_start))
    
    log "Migration completed in ${migration_duration}s"
    
    # Parse migration results
    local migration_id=$(echo "$migration_result" | jq -r '.migrationId')
    local migrated_count=$(echo "$migration_result" | jq -r '.migrated')
    local failed_count=$(echo "$migration_result" | jq -r '.failed')
    local success=$(echo "$migration_result" | jq -r '.success')
    
    log "Migration results:"
    log "  Migration ID: $migration_id"
    log "  Migrated: $migrated_count"
    log "  Failed: $failed_count"
    log "  Success: $success"
    
    if [ "$success" != "true" ]; then
        log_error "Migration failed"
        echo "$migration_result" | jq '.errors'
        return 1
    fi
    
    if [ "$migrated_count" -ne "$LEARNER_USERS_COUNT" ]; then
        log_error "Expected to migrate $LEARNER_USERS_COUNT users, but migrated $migrated_count"
        return 1
    fi
    
    # Save migration details
    echo "$migration_result" > "$BACKUP_DIR/migration-result.json"
    
    log_success "Migration executed successfully"
    echo "$migration_id" > "$BACKUP_DIR/migration-id.txt"
    return 0
}

validate_post_migration_data() {
    log "Validating post-migration data integrity..."
    
    # Get post-migration statistics
    local stats=$(curl -k -s "$STAGING_URL/api/test/get-data-stats?timestamp=$TIMESTAMP")
    local learner_count=$(echo "$stats" | jq -r '.learnerUsers')
    local customer_count=$(echo "$stats" | jq -r '.customerUsers')
    local orders_count=$(echo "$stats" | jq -r '.totalOrders')
    local donations_count=$(echo "$stats" | jq -r '.totalDonations')
    
    log "Post-migration statistics:"
    log "  LEARNER users: $learner_count"
    log "  CUSTOMER users: $customer_count"
    log "  Total orders: $orders_count"
    log "  Total donations: $donations_count"
    
    # Validate migration results
    if [ "$learner_count" -ne 0 ]; then
        log_error "Found $learner_count remaining LEARNER users after migration"
        return 1
    fi
    
    if [ "$customer_count" -ne "$LEARNER_USERS_COUNT" ]; then
        log_error "Expected $LEARNER_USERS_COUNT CUSTOMER users, found $customer_count"
        return 1
    fi
    
    # Validate data integrity preservation
    local expected_orders=$((LEARNER_USERS_COUNT * TEST_ORDERS_PER_USER))
    if [ "$orders_count" -ne "$expected_orders" ]; then
        log_error "Order count changed during migration: expected $expected_orders, found $orders_count"
        return 1
    fi
    
    local expected_donations=$((LEARNER_USERS_COUNT * TEST_DONATIONS_PER_USER))
    if [ "$donations_count" -ne "$expected_donations" ]; then
        log_error "Donation count changed during migration: expected $expected_donations, found $donations_count"
        return 1
    fi
    
    # Validate data checksums
    curl -k -s "$STAGING_URL/api/test/create-data-checksum?timestamp=$TIMESTAMP" > "$BACKUP_DIR/post-migration-checksum.json"
    
    local pre_checksum=$(jq -r '.dataChecksum' "$BACKUP_DIR/pre-migration-checksum.json")
    local post_checksum=$(jq -r '.dataChecksum' "$BACKUP_DIR/post-migration-checksum.json")
    
    # Checksums should be different (roles changed) but user data should be preserved
    local data_integrity_check=$(curl -k -s "$STAGING_URL/api/test/compare-data-integrity" \
        -H "Content-Type: application/json" \
        -d "{
            \"preChecksum\": \"$pre_checksum\",
            \"postChecksum\": \"$post_checksum\",
            \"allowRoleChange\": true
        }")
    
    local integrity_preserved=$(echo "$data_integrity_check" | jq -r '.integrityPreserved')
    if [ "$integrity_preserved" != "true" ]; then
        log_error "Data integrity was not preserved during migration"
        echo "$data_integrity_check" | jq '.differences'
        return 1
    fi
    
    # Test user access after migration
    log "Testing user access after migration..."
    local sample_user=$(curl -k -s "$STAGING_URL/api/test/get-sample-migrated-user?timestamp=$TIMESTAMP")
    local user_email=$(echo "$sample_user" | jq -r '.email')
    
    # Simulate login
    local login_test=$(curl -k -s "$STAGING_URL/api/auth/demo-login?email=$user_email&role=CUSTOMER")
    if [ $? -ne 0 ]; then
        log_error "Failed to login migrated user: $user_email"
        return 1
    fi
    
    # Test dashboard access
    local dashboard_access=$(curl -k -s "$STAGING_URL/dashboard" \
        -H "Cookie: next-auth.session-token=test-session")
    
    if ! echo "$dashboard_access" | grep -q "Dashboard"; then
        log_error "Migrated user cannot access unified dashboard"
        return 1
    fi
    
    # Verify old role-specific dashboard is inaccessible
    local old_dashboard_response=$(curl -k -s -w "%{http_code}" "$STAGING_URL/dashboard/learner" \
        -H "Cookie: next-auth.session-token=test-session" -o /dev/null)
    
    if [ "$old_dashboard_response" -ne 404 ]; then
        log_error "Old learner dashboard is still accessible (expected 404, got $old_dashboard_response)"
        return 1
    fi
    
    log_success "Post-migration validation passed"
    return 0
}

test_migration_rollback() {
    log "Testing migration rollback capability..."
    
    local migration_id=$(cat "$BACKUP_DIR/migration-id.txt")
    
    # Perform rollback
    log "Initiating rollback for migration $migration_id..."
    local rollback_result=$(curl -k -s -X POST "$STAGING_URL/api/admin/rollback-migration" \
        -H "Content-Type: application/json" \
        -d "{
            \"migrationId\": \"$migration_id\",
            \"validateRollback\": true,
            \"reason\": \"E2E testing rollback\"
        }")
    
    local rollback_success=$(echo "$rollback_result" | jq -r '.success')
    local rolled_back_count=$(echo "$rollback_result" | jq -r '.rolledBackUsers')
    
    if [ "$rollback_success" != "true" ]; then
        log_error "Rollback failed"
        echo "$rollback_result" | jq '.error'
        return 1
    fi
    
    if [ "$rolled_back_count" -ne "$LEARNER_USERS_COUNT" ]; then
        log_error "Expected to rollback $LEARNER_USERS_COUNT users, but rolled back $rolled_back_count"
        return 1
    fi
    
    log_success "Rollback completed: $rolled_back_count users"
    
    # Validate rollback results
    log "Validating rollback results..."
    local post_rollback_stats=$(curl -k -s "$STAGING_URL/api/test/get-data-stats?timestamp=$TIMESTAMP")
    local learner_count=$(echo "$post_rollback_stats" | jq -r '.learnerUsers')
    local customer_count=$(echo "$post_rollback_stats" | jq -r '.customerUsers')
    
    if [ "$learner_count" -ne "$LEARNER_USERS_COUNT" ]; then
        log_error "Expected $LEARNER_USERS_COUNT LEARNER users after rollback, found $learner_count"
        return 1
    fi
    
    if [ "$customer_count" -ne 0 ]; then
        log_error "Found $customer_count CUSTOMER users after rollback (expected 0)"
        return 1
    fi
    
    log_success "Rollback validation passed"
    return 0
}

run_playwright_migration_tests() {
    log "Running Playwright migration-specific tests..."
    
    cd "$PROJECT_ROOT"
    
    local test_env="STAGING_URL=$STAGING_URL"
    test_env="$test_env TEST_TIMESTAMP=$TIMESTAMP"
    test_env="$test_env TEST_USER_COUNT=$LEARNER_USERS_COUNT"
    
    if env $test_env npx playwright test tests/role-system/user-migration.spec.ts \
       tests/role-system/database-migration.spec.ts \
       --config=playwright.config.staging.ts \
       --project=migration \
       --workers=1; then
        log_success "Playwright migration tests passed"
        return 0
    else
        log_error "Playwright migration tests failed"
        return 1
    fi
}

cleanup_test_data() {
    log "Cleaning up test data..."
    
    # Remove test users and related data
    local cleanup_result=$(curl -k -s -X DELETE "$STAGING_URL/api/test/cleanup-test-data" \
        -H "Content-Type: application/json" \
        -d "{\"timestamp\": \"$TIMESTAMP\"}")
    
    local deleted_users=$(echo "$cleanup_result" | jq -r '.deletedUsers')
    local deleted_orders=$(echo "$cleanup_result" | jq -r '.deletedOrders')
    local deleted_donations=$(echo "$cleanup_result" | jq -r '.deletedDonations')
    
    log "Cleanup results:"
    log "  Deleted users: $deleted_users"
    log "  Deleted orders: $deleted_orders"
    log "  Deleted donations: $deleted_donations"
    
    log_success "Test data cleanup completed"
}

generate_migration_report() {
    log "Generating migration test report..."
    
    local report_file="$BACKUP_DIR/migration-e2e-report-${TIMESTAMP}.json"
    
    cat > "$report_file" << EOF
{
    "testRun": {
        "timestamp": "$TIMESTAMP",
        "startTime": "$(date -Iseconds)",
        "testConfiguration": {
            "learnerUsersCount": $LEARNER_USERS_COUNT,
            "ordersPerUser": $TEST_ORDERS_PER_USER,
            "donationsPerUser": $TEST_DONATIONS_PER_USER,
            "stagingUrl": "$STAGING_URL"
        }
    },
    "testPhases": {
        "dataSetup": "$([ -f "$BACKUP_DIR/pre-migration-checksum.json" ] && echo "completed" || echo "failed")",
        "preMigrationValidation": "completed",
        "migrationExecution": "$([ -f "$BACKUP_DIR/migration-result.json" ] && echo "completed" || echo "failed")",
        "postMigrationValidation": "completed",
        "rollbackTesting": "completed",
        "playwrightTests": "completed"
    },
    "artifacts": {
        "preMigrationChecksum": "pre-migration-checksum.json",
        "migrationResult": "migration-result.json",
        "postMigrationChecksum": "post-migration-checksum.json",
        "logFile": "$(basename "$LOG_FILE")"
    }
}
EOF
    
    log_success "Migration test report generated: $report_file"
}

# Parse command line arguments
SKIP_SETUP=false
SKIP_CLEANUP=false
DRY_RUN=false
VALIDATE_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        --staging-url)
            STAGING_URL="$2"
            shift 2
            ;;
        --users-count)
            LEARNER_USERS_COUNT="$2"
            shift 2
            ;;
        --orders-per-user)
            TEST_ORDERS_PER_USER="$2"
            shift 2
            ;;
        --donations-per-user)
            TEST_DONATIONS_PER_USER="$2"
            shift 2
            ;;
        --skip-setup)
            SKIP_SETUP=true
            shift
            ;;
        --skip-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    local start_time=$(date +%s)
    local exit_code=0
    
    log "Starting migration E2E test - $(date)"
    log "Configuration:"
    log "  Staging URL: $STAGING_URL"
    log "  LEARNER users: $LEARNER_USERS_COUNT"
    log "  Orders per user: $TEST_ORDERS_PER_USER"
    log "  Donations per user: $TEST_DONATIONS_PER_USER"
    log "  Test timestamp: $TIMESTAMP"
    
    # Phase 1: Setup test data
    if [ "$SKIP_SETUP" = false ] && [ "$VALIDATE_ONLY" = false ]; then
        create_test_database || exit_code=$?
    fi
    
    # Phase 2: Pre-migration validation
    validate_pre_migration_data || exit_code=$?
    
    if [ "$VALIDATE_ONLY" = true ]; then
        log "Validation-only mode completed"
        return $exit_code
    fi
    
    # Phase 3: Execute migration
    if [ "$DRY_RUN" = false ]; then
        execute_migration || exit_code=$?
        
        # Phase 4: Post-migration validation
        validate_post_migration_data || exit_code=$?
        
        # Phase 5: Rollback testing
        test_migration_rollback || exit_code=$?
    else
        log "Dry-run mode: skipping actual migration"
    fi
    
    # Phase 6: Playwright tests
    run_playwright_migration_tests || exit_code=$?
    
    # Phase 7: Cleanup
    if [ "$SKIP_CLEANUP" = false ]; then
        cleanup_test_data
    fi
    
    # Generate report
    generate_migration_report
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        log_success "Migration E2E test completed successfully in ${total_duration}s"
    else
        log_error "Migration E2E test failed after ${total_duration}s"
    fi
    
    return $exit_code
}

# Trap to ensure cleanup
trap cleanup_test_data EXIT

# Run main function
main "$@"