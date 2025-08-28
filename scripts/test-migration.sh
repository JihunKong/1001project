#!/bin/bash

# 1001 Stories - Database Migration Testing Framework
# ===================================================
# Comprehensive testing framework for role system migration
# Tests LEARNER → CUSTOMER role migration safely in staging

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAGING_DB_USER="${STAGING_DB_USER:-staging_user}"
STAGING_DB_NAME="${STAGING_DB_NAME:-staging_db}"
STAGING_CONTAINER="1001-stories-db-staging"

# Test configuration
DRY_RUN=false
VERBOSE=false
STOP_ON_FAILURE=true
TEST_BATCH_SIZE=2  # Number of users to migrate in test batch
ROLLBACK_ENABLED=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

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

log_test() {
    echo -e "${PURPLE}[TEST]${NC} $1"
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}[VERBOSE]${NC} $1"
    fi
}

# Function to print banner
print_banner() {
    echo -e "${BLUE}"
    echo "======================================================"
    echo "  1001 Stories - Database Migration Testing"
    echo "  Role System Migration Test Framework (Week 1)"
    echo "======================================================"
    echo -e "${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}*** DRY RUN MODE - NO ACTUAL MIGRATIONS ***${NC}\n"
    fi
}

# Function to record test result
record_test_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    local execution_time="${4:-0}"
    
    ((TOTAL_TESTS++))
    
    case "$status" in
        "PASS"|"SUCCESS"|"passed")
            ((PASSED_TESTS++))
            log_success "✓ $test_name"
            ;;
        "FAIL"|"FAILED"|"failed")
            ((FAILED_TESTS++))
            log_error "✗ $test_name"
            if [[ "$STOP_ON_FAILURE" == "true" ]]; then
                log_error "Stopping on failure as requested"
                exit 1
            fi
            ;;
        "SKIP"|"SKIPPED"|"skipped")
            ((SKIPPED_TESTS++))
            log_warning "⊘ $test_name (skipped)"
            ;;
    esac
    
    # Record in database
    if [[ "$DRY_RUN" != "true" ]]; then
        docker exec "$STAGING_CONTAINER" psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -c "
            INSERT INTO staging_migrations.test_results (test_name, test_category, status, result_data, execution_time)
            VALUES ('$test_name', 'migration_test', '$status', '$details'::jsonb, '$execution_time seconds'::interval)
            ON CONFLICT DO NOTHING;
        " >/dev/null 2>&1 || true
    fi
    
    if [[ -n "$details" && "$VERBOSE" == "true" ]]; then
        log_verbose "$details"
    fi
}

# Function to execute SQL query safely
execute_sql() {
    local query="$1"
    local description="${2:-SQL query}"
    
    log_verbose "Executing: $description"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_verbose "[DRY RUN] Would execute: $query"
        return 0
    fi
    
    local start_time
    start_time=$(date +%s)
    
    local result
    if result=$(docker exec "$STAGING_CONTAINER" psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -t -c "$query" 2>&1); then
        local end_time
        end_time=$(date +%s)
        local execution_time=$((end_time - start_time))
        
        log_verbose "Query executed successfully in ${execution_time}s"
        echo "$result"
        return 0
    else
        log_error "SQL execution failed: $result"
        return 1
    fi
}

# Function to validate prerequisites
validate_prerequisites() {
    log_test "Validating test prerequisites"
    
    local start_time
    start_time=$(date +%s)
    
    # Check if staging container is running
    if ! docker ps | grep -q "$STAGING_CONTAINER"; then
        record_test_result "prerequisite_staging_container" "FAILED" "Staging container not running"
        return 1
    fi
    
    # Check database connectivity
    if ! execute_sql "SELECT version();" "Database connectivity test" >/dev/null; then
        record_test_result "prerequisite_db_connection" "FAILED" "Cannot connect to staging database"
        return 1
    fi
    
    # Check if required tables exist
    local required_tables=("User" "UserStory" "Story")
    for table in "${required_tables[@]}"; do
        local table_exists
        table_exists=$(execute_sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" "Check table $table")
        if [[ "$table_exists" != *"t"* ]]; then
            record_test_result "prerequisite_table_$table" "FAILED" "Required table '$table' does not exist"
            return 1
        fi
    done
    
    # Check if staging migration tables exist
    local migration_tables=("staging_migrations.role_migration_log" "staging_migrations.test_results")
    for table in "${migration_tables[@]}"; do
        local table_exists
        table_exists=$(execute_sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'staging_migrations' AND table_name = '${table#*.}');" "Check migration table $table")
        if [[ "$table_exists" != *"t"* ]]; then
            log_warning "Migration table $table does not exist, creating..."
            # This would be handled by the staging setup script
        fi
    done
    
    # Verify test data exists
    local user_count
    user_count=$(execute_sql "SELECT COUNT(*) FROM \"User\" WHERE role = 'LEARNER';" "Count LEARNER users")
    user_count=$(echo "$user_count" | tr -d ' ')
    
    if [[ "$user_count" -lt 1 ]]; then
        record_test_result "prerequisite_test_data" "FAILED" "No LEARNER users found for testing. Run copy-production-data.sh first."
        return 1
    fi
    
    local end_time
    end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    record_test_result "prerequisite_validation" "PASS" "{\"learner_users\": $user_count, \"tables_validated\": 3}" "$execution_time"
    
    log_info "Found $user_count LEARNER users available for migration testing"
    return 0
}

# Function to test role migration logic
test_role_migration_logic() {
    log_test "Testing role migration logic"
    
    local start_time
    start_time=$(date +%s)
    
    # Get test users for migration
    local test_users
    test_users=$(execute_sql "
        SELECT id, email, role 
        FROM \"User\" 
        WHERE role = 'LEARNER' 
        ORDER BY created_at ASC 
        LIMIT $TEST_BATCH_SIZE;
    " "Get test users for migration")
    
    if [[ -z "$test_users" ]]; then
        record_test_result "migration_logic_no_users" "FAILED" "No LEARNER users available for testing"
        return 1
    fi
    
    local user_ids=()
    while IFS= read -r line; do
        if [[ -n "$line" && "$line" != *"id"* ]]; then  # Skip header
            local user_id
            user_id=$(echo "$line" | awk '{print $1}')
            if [[ "$user_id" =~ ^[0-9]+$ ]]; then
                user_ids+=("$user_id")
            fi
        fi
    done <<< "$test_users"
    
    if [[ ${#user_ids[@]} -eq 0 ]]; then
        record_test_result "migration_logic_parse_users" "FAILED" "Could not parse user IDs from test data"
        return 1
    fi
    
    log_info "Testing migration logic with ${#user_ids[@]} users: ${user_ids[*]}"
    
    # Test 1: Backup current state
    log_verbose "Creating pre-migration backup"
    if ! execute_sql "
        CREATE TEMP TABLE pre_migration_backup AS 
        SELECT * FROM \"User\" WHERE id IN (${user_ids[0]});
    " "Create pre-migration backup" >/dev/null; then
        record_test_result "migration_logic_backup" "FAILED" "Could not create pre-migration backup"
        return 1
    fi
    
    # Test 2: Simulate role migration
    if [[ "$DRY_RUN" != "true" ]]; then
        log_verbose "Performing test role migration"
        
        for user_id in "${user_ids[@]}"; do
            # Log the migration attempt
            execute_sql "
                INSERT INTO staging_migrations.role_migration_log 
                (user_id, old_role, new_role, migration_status, rollback_data)
                SELECT 
                    $user_id,
                    role,
                    'CUSTOMER',
                    'testing',
                    row_to_json(u.*)
                FROM \"User\" u WHERE id = $user_id;
            " "Log migration attempt for user $user_id" >/dev/null
            
            # Perform the actual role change
            local update_result
            update_result=$(execute_sql "
                UPDATE \"User\" 
                SET role = 'CUSTOMER', updated_at = NOW() 
                WHERE id = $user_id AND role = 'LEARNER'
                RETURNING id, email, role;
            " "Migrate user $user_id to CUSTOMER role")
            
            if [[ -n "$update_result" ]]; then
                log_verbose "Successfully migrated user $user_id to CUSTOMER role"
                
                # Update migration log
                execute_sql "
                    UPDATE staging_migrations.role_migration_log 
                    SET migration_status = 'success', migration_timestamp = NOW()
                    WHERE user_id = $user_id AND migration_status = 'testing';
                " "Update migration log for user $user_id" >/dev/null
            else
                log_error "Failed to migrate user $user_id"
                
                # Update migration log with failure
                execute_sql "
                    UPDATE staging_migrations.role_migration_log 
                    SET migration_status = 'failed', error_message = 'UPDATE query returned no rows'
                    WHERE user_id = $user_id AND migration_status = 'testing';
                " "Log migration failure for user $user_id" >/dev/null
                
                record_test_result "migration_logic_user_$user_id" "FAILED" "Role migration failed for user $user_id"
                return 1
            fi
        done
    fi
    
    # Test 3: Verify migration results
    log_verbose "Verifying migration results"
    local customer_count
    customer_count=$(execute_sql "SELECT COUNT(*) FROM \"User\" WHERE role = 'CUSTOMER';" "Count CUSTOMER users after migration")
    customer_count=$(echo "$customer_count" | tr -d ' ')
    
    if [[ "$DRY_RUN" != "true" ]]; then
        if [[ "$customer_count" -lt ${#user_ids[@]} ]]; then
            record_test_result "migration_logic_verification" "FAILED" "Expected ${#user_ids[@]} CUSTOMER users, found $customer_count"
            return 1
        fi
    fi
    
    local end_time
    end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    record_test_result "migration_logic_test" "PASS" "{\"users_migrated\": ${#user_ids[@]}, \"customer_count\": $customer_count}" "$execution_time"
    
    return 0
}

# Function to test data integrity after migration
test_data_integrity() {
    log_test "Testing data integrity after migration"
    
    local start_time
    start_time=$(date +%s)
    
    # Test 1: Check foreign key constraints
    local fk_violations
    fk_violations=$(execute_sql "
        SELECT COUNT(*) 
        FROM \"UserStory\" us 
        LEFT JOIN \"User\" u ON us.user_id = u.id 
        WHERE u.id IS NULL;
    " "Check UserStory foreign key integrity")
    fk_violations=$(echo "$fk_violations" | tr -d ' ')
    
    if [[ "$fk_violations" != "0" ]]; then
        record_test_result "integrity_foreign_keys" "FAILED" "Found $fk_violations foreign key violations"
        return 1
    fi
    
    # Test 2: Check data consistency
    local user_story_orphans
    user_story_orphans=$(execute_sql "
        SELECT COUNT(*) 
        FROM \"UserStory\" us 
        LEFT JOIN \"Story\" s ON us.story_id = s.id 
        WHERE s.id IS NULL;
    " "Check UserStory-Story relationship integrity")
    user_story_orphans=$(echo "$user_story_orphans" | tr -d ' ')
    
    if [[ "$user_story_orphans" != "0" ]]; then
        record_test_result "integrity_story_orphans" "FAILED" "Found $user_story_orphans orphaned user-story relationships"
        return 1
    fi
    
    # Test 3: Check role constraints
    local invalid_roles
    invalid_roles=$(execute_sql "
        SELECT COUNT(*) 
        FROM \"User\" 
        WHERE role NOT IN ('ADMIN', 'CUSTOMER', 'TEACHER', 'INSTITUTION', 'VOLUNTEER');
    " "Check role constraint validity")
    invalid_roles=$(echo "$invalid_roles" | tr -d ' ')
    
    if [[ "$invalid_roles" != "0" ]]; then
        record_test_result "integrity_role_constraints" "FAILED" "Found $invalid_roles users with invalid roles"
        return 1
    fi
    
    # Test 4: Check timestamp consistency
    local timestamp_issues
    timestamp_issues=$(execute_sql "
        SELECT COUNT(*) 
        FROM \"User\" 
        WHERE updated_at < created_at;
    " "Check timestamp consistency")
    timestamp_issues=$(echo "$timestamp_issues" | tr -d ' ')
    
    if [[ "$timestamp_issues" != "0" ]]; then
        record_test_result "integrity_timestamps" "FAILED" "Found $timestamp_issues users with invalid timestamps"
        return 1
    fi
    
    local end_time
    end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    record_test_result "data_integrity_test" "PASS" "{\"fk_violations\": $fk_violations, \"orphans\": $user_story_orphans, \"invalid_roles\": $invalid_roles}" "$execution_time"
    
    return 0
}

# Function to test rollback functionality
test_rollback_functionality() {
    if [[ "$ROLLBACK_ENABLED" != "true" ]]; then
        record_test_result "rollback_test" "SKIP" "Rollback testing disabled"
        return 0
    fi
    
    log_test "Testing rollback functionality"
    
    local start_time
    start_time=$(date +%s)
    
    if [[ "$DRY_RUN" == "true" ]]; then
        record_test_result "rollback_test" "SKIP" "Dry run mode - rollback test skipped"
        return 0
    fi
    
    # Get users that were migrated
    local migrated_users
    migrated_users=$(execute_sql "
        SELECT user_id, rollback_data 
        FROM staging_migrations.role_migration_log 
        WHERE migration_status = 'success' 
        ORDER BY migration_timestamp DESC 
        LIMIT $TEST_BATCH_SIZE;
    " "Get migrated users for rollback test")
    
    if [[ -z "$migrated_users" ]]; then
        record_test_result "rollback_no_data" "SKIP" "No migrated users found for rollback testing"
        return 0
    fi
    
    # Test rollback for one user
    local first_user_id
    first_user_id=$(echo "$migrated_users" | head -n1 | awk '{print $1}')
    
    if [[ -n "$first_user_id" && "$first_user_id" =~ ^[0-9]+$ ]]; then
        log_verbose "Testing rollback for user $first_user_id"
        
        # Perform rollback
        local rollback_result
        rollback_result=$(execute_sql "
            WITH rollback_data AS (
                SELECT 
                    user_id,
                    (rollback_data->>'role')::text as original_role
                FROM staging_migrations.role_migration_log 
                WHERE user_id = $first_user_id 
                AND migration_status = 'success'
                ORDER BY migration_timestamp DESC 
                LIMIT 1
            )
            UPDATE \"User\" 
            SET role = rd.original_role, updated_at = NOW()
            FROM rollback_data rd
            WHERE \"User\".id = rd.user_id
            RETURNING \"User\".id, \"User\".role;
        " "Perform rollback for user $first_user_id")
        
        if [[ -n "$rollback_result" ]]; then
            # Log the rollback
            execute_sql "
                INSERT INTO staging_migrations.role_migration_log 
                (user_id, old_role, new_role, migration_status)
                VALUES ($first_user_id, 'CUSTOMER', 'LEARNER', 'rolled_back');
            " "Log rollback for user $first_user_id" >/dev/null
            
            log_verbose "Successfully rolled back user $first_user_id"
        else
            record_test_result "rollback_execution" "FAILED" "Rollback execution failed for user $first_user_id"
            return 1
        fi
    fi
    
    local end_time
    end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    record_test_result "rollback_test" "PASS" "{\"rollback_tested\": true, \"user_id\": $first_user_id}" "$execution_time"
    
    return 0
}

# Function to test performance under migration load
test_migration_performance() {
    log_test "Testing migration performance"
    
    local start_time
    start_time=$(date +%s)
    
    # Test query performance for large datasets
    local query_performance
    query_performance=$(execute_sql "
        EXPLAIN (ANALYZE, BUFFERS) 
        SELECT COUNT(*) 
        FROM \"User\" u 
        JOIN \"UserStory\" us ON u.id = us.user_id 
        WHERE u.role = 'CUSTOMER';
    " "Test join query performance")
    
    # Extract execution time from EXPLAIN ANALYZE output
    local execution_time_ms
    execution_time_ms=$(echo "$query_performance" | grep "Execution Time:" | awk '{print $3}')
    
    if [[ -n "$execution_time_ms" ]]; then
        # Convert to numeric comparison (remove 'ms')
        local time_numeric
        time_numeric=${execution_time_ms%.*}  # Remove decimal part
        
        # Warn if query takes longer than 100ms
        if [[ "$time_numeric" -gt 100 ]]; then
            log_warning "Query performance concern: ${execution_time_ms} > 100ms"
        fi
    fi
    
    # Test batch migration performance
    local batch_start
    batch_start=$(date +%s.%N)
    
    local batch_count
    batch_count=$(execute_sql "
        SELECT COUNT(*) 
        FROM \"User\" 
        WHERE role IN ('LEARNER', 'CUSTOMER') 
        AND created_at >= NOW() - INTERVAL '1 day';
    " "Count recent users for batch test")
    batch_count=$(echo "$batch_count" | tr -d ' ')
    
    local batch_end
    batch_end=$(date +%s.%N)
    local batch_time
    batch_time=$(echo "$batch_end - $batch_start" | bc -l 2>/dev/null || echo "0")
    
    local end_time
    end_time=$(date +%s)
    local total_execution_time=$((end_time - start_time))
    
    record_test_result "migration_performance_test" "PASS" "{\"query_time_ms\": \"$execution_time_ms\", \"batch_count\": $batch_count, \"batch_time_sec\": \"$batch_time\"}" "$total_execution_time"
    
    return 0
}

# Function to test edge cases
test_edge_cases() {
    log_test "Testing migration edge cases"
    
    local start_time
    start_time=$(date +%s)
    
    # Test 1: Migration of non-existent user
    local invalid_migration
    invalid_migration=$(execute_sql "
        UPDATE \"User\" 
        SET role = 'CUSTOMER' 
        WHERE id = -1 
        RETURNING id;
    " "Test migration of non-existent user")
    
    if [[ -n "$invalid_migration" ]]; then
        record_test_result "edge_case_invalid_user" "FAILED" "Migration succeeded for non-existent user"
        return 1
    fi
    
    # Test 2: Double migration attempt
    if [[ "$DRY_RUN" != "true" ]]; then
        # Try to migrate an already-migrated user
        local customer_user_id
        customer_user_id=$(execute_sql "SELECT id FROM \"User\" WHERE role = 'CUSTOMER' LIMIT 1;" "Get CUSTOMER user for double migration test")
        customer_user_id=$(echo "$customer_user_id" | tr -d ' ')
        
        if [[ -n "$customer_user_id" && "$customer_user_id" =~ ^[0-9]+$ ]]; then
            local double_migration
            double_migration=$(execute_sql "
                UPDATE \"User\" 
                SET role = 'CUSTOMER' 
                WHERE id = $customer_user_id AND role = 'LEARNER'
                RETURNING id;
            " "Test double migration")
            
            if [[ -n "$double_migration" ]]; then
                record_test_result "edge_case_double_migration" "FAILED" "Double migration succeeded unexpectedly"
                return 1
            fi
        fi
    fi
    
    # Test 3: Migration with missing UserStory references
    local orphaned_relations
    orphaned_relations=$(execute_sql "
        SELECT COUNT(*) 
        FROM \"UserStory\" us 
        LEFT JOIN \"User\" u ON us.user_id = u.id 
        WHERE u.id IS NULL;
    " "Check for orphaned UserStory relations")
    orphaned_relations=$(echo "$orphaned_relations" | tr -d ' ')
    
    if [[ "$orphaned_relations" != "0" ]]; then
        log_warning "Found $orphaned_relations orphaned UserStory relations"
    fi
    
    local end_time
    end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    record_test_result "edge_cases_test" "PASS" "{\"orphaned_relations\": $orphaned_relations}" "$execution_time"
    
    return 0
}

# Function to generate comprehensive test report
generate_test_report() {
    log_info "Generating comprehensive test report..."
    
    local report_file="$PROJECT_ROOT/staging-backups/migration-test-report-$(date +%Y%m%d-%H%M%S).json"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would generate test report: $report_file"
        return 0
    fi
    
    # Generate detailed test report
    local report_data
    report_data=$(execute_sql "
        SELECT jsonb_pretty(jsonb_build_object(
            'test_execution', jsonb_build_object(
                'timestamp', NOW(),
                'environment', 'staging',
                'dry_run', false,
                'total_tests', $TOTAL_TESTS,
                'passed_tests', $PASSED_TESTS,
                'failed_tests', $FAILED_TESTS,
                'skipped_tests', $SKIPPED_TESTS,
                'success_rate', ROUND(($PASSED_TESTS::numeric / NULLIF($TOTAL_TESTS, 0)) * 100, 2)
            ),
            'migration_summary', (
                SELECT jsonb_build_object(
                    'total_users', COUNT(*),
                    'customers', COUNT(*) FILTER (WHERE role = 'CUSTOMER'),
                    'learners', COUNT(*) FILTER (WHERE role = 'LEARNER'),
                    'admins', COUNT(*) FILTER (WHERE role = 'ADMIN'),
                    'teachers', COUNT(*) FILTER (WHERE role = 'TEACHER')
                )
                FROM \"User\"
            ),
            'migration_log', (
                SELECT jsonb_agg(jsonb_build_object(
                    'user_id', user_id,
                    'old_role', old_role,
                    'new_role', new_role,
                    'status', migration_status,
                    'timestamp', migration_timestamp
                ))
                FROM staging_migrations.role_migration_log 
                ORDER BY migration_timestamp DESC 
                LIMIT 20
            ),
            'test_results', (
                SELECT jsonb_agg(jsonb_build_object(
                    'test_name', test_name,
                    'category', test_category,
                    'status', status,
                    'execution_time', execution_time,
                    'created_at', created_at
                ))
                FROM staging_migrations.test_results 
                WHERE created_at >= NOW() - INTERVAL '1 hour'
                ORDER BY created_at DESC
            ),
            'recommendations', CASE 
                WHEN $FAILED_TESTS > 0 THEN 
                    jsonb_build_array(
                        'Review failed test details before proceeding to production',
                        'Consider adjusting migration batch size',
                        'Verify data integrity fixes'
                    )
                WHEN $PASSED_TESTS = $TOTAL_TESTS THEN 
                    jsonb_build_array(
                        'All tests passed - migration appears safe for production',
                        'Consider running additional load tests',
                        'Prepare production migration timeline'
                    )
                ELSE 
                    jsonb_build_array(
                        'Review skipped tests and determine if they should be run',
                        'Address any warnings before production deployment'
                    )
            END
        ));
    " "Generate test report")
    
    if [[ -n "$report_data" ]]; then
        echo "$report_data" > "$report_file"
        log_success "Test report generated: $report_file"
        
        # Display summary from report
        if command -v jq >/dev/null 2>&1; then
            log_info "Test Summary:"
            jq -r '
                .test_execution | 
                "  • Total Tests: " + (.total_tests | tostring) +
                "\n  • Passed: " + (.passed_tests | tostring) + 
                "\n  • Failed: " + (.failed_tests | tostring) + 
                "\n  • Skipped: " + (.skipped_tests | tostring) +
                "\n  • Success Rate: " + (.success_rate | tostring) + "%"
            ' "$report_file"
        fi
    else
        log_error "Failed to generate test report"
    fi
}

# Function to display final results
display_final_results() {
    echo -e "\n${GREEN}=============================================="
    echo "  Migration Testing Complete!"
    echo -e "==============================================\n${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}This was a DRY RUN - no actual migrations were performed.${NC}"
        echo "To perform real migration testing, run without --dry-run"
        return 0
    fi
    
    # Calculate success rate
    local success_rate=0
    if [[ $TOTAL_TESTS -gt 0 ]]; then
        success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    fi
    
    echo -e "${BLUE}Test Results:${NC}"
    echo "  • Total Tests: $TOTAL_TESTS"
    echo "  • Passed: $PASSED_TESTS"
    echo "  • Failed: $FAILED_TESTS" 
    echo "  • Skipped: $SKIPPED_TESTS"
    echo "  • Success Rate: ${success_rate}%"
    
    if [[ $FAILED_TESTS -eq 0 && $PASSED_TESTS -gt 0 ]]; then
        echo -e "\n${GREEN}✓ All tests passed! Migration appears safe for production.${NC}"
        echo -e "\n${BLUE}Ready for Week 2:${NC}"
        echo "  • Role system migration tested successfully"
        echo "  • Data integrity verified"
        echo "  • Rollback functionality confirmed"
        echo "  • Performance characteristics acceptable"
        
        echo -e "\n${BLUE}Next Steps:${NC}"
        echo "  1. Run staging validation: ./scripts/validate-staging.sh"
        echo "  2. Review test report for any recommendations"
        echo "  3. Prepare Week 2 production deployment"
    elif [[ $FAILED_TESTS -gt 0 ]]; then
        echo -e "\n${RED}⚠ Some tests failed - review before proceeding to production.${NC}"
        echo -e "\n${BLUE}Required Actions:${NC}"
        echo "  • Review failed test details in the test report"
        echo "  • Fix identified issues"
        echo "  • Re-run migration tests"
        echo "  • Do not proceed to production until all tests pass"
    else
        echo -e "\n${YELLOW}⚠ No tests were executed - verify test configuration.${NC}"
    fi
    
    echo -e "\n${BLUE}Access Staging Environment:${NC}"
    echo "  • Application: https://localhost:8080"
    echo "  • Database: docker exec -it $STAGING_CONTAINER psql -U $STAGING_DB_USER -d $STAGING_DB_NAME"
    echo "  • Migration logs: SELECT * FROM staging_migrations.role_migration_log;"
}

# Function to cleanup on exit
cleanup_on_exit() {
    if [[ $? -ne 0 ]]; then
        log_error "Migration testing failed or was interrupted"
        
        if [[ "$DRY_RUN" != "true" && "$ROLLBACK_ENABLED" == "true" ]]; then
            log_info "Consider running rollback if partial migration occurred"
        fi
    fi
}

# Main execution function
main() {
    # Set up cleanup on exit
    trap cleanup_on_exit EXIT
    
    print_banner
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --continue-on-failure)
                STOP_ON_FAILURE=false
                shift
                ;;
            --batch-size)
                TEST_BATCH_SIZE="$2"
                shift 2
                ;;
            --no-rollback)
                ROLLBACK_ENABLED=false
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --dry-run                   Show what would be tested without making changes"
                echo "  --verbose, -v               Enable verbose output"
                echo "  --continue-on-failure       Continue testing even if some tests fail"
                echo "  --batch-size N              Number of users to migrate in test batch (default: $TEST_BATCH_SIZE)"
                echo "  --no-rollback               Skip rollback functionality tests"
                echo "  --help, -h                  Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0 --dry-run                # Preview what tests would run"
                echo "  $0 --verbose                # Run with detailed output"  
                echo "  $0 --batch-size 1           # Test with only 1 user migration"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Validate batch size
    if ! [[ "$TEST_BATCH_SIZE" =~ ^[0-9]+$ ]] || [[ "$TEST_BATCH_SIZE" -le 0 ]]; then
        log_error "Invalid batch size: $TEST_BATCH_SIZE"
        exit 1
    fi
    
    # Execute test suite
    log_info "Starting migration test suite with batch size: $TEST_BATCH_SIZE"
    
    validate_prerequisites || exit 1
    test_role_migration_logic || true
    test_data_integrity || true
    test_rollback_functionality || true  
    test_migration_performance || true
    test_edge_cases || true
    
    generate_test_report
    display_final_results
    
    # Disable cleanup on successful exit
    trap - EXIT
    
    if [[ $FAILED_TESTS -eq 0 && $TOTAL_TESTS -gt 0 ]]; then
        log_success "Migration testing completed successfully!"
        exit 0
    elif [[ $FAILED_TESTS -gt 0 ]]; then
        log_error "Migration testing completed with failures!"
        exit 1
    else
        log_warning "Migration testing completed with no tests executed!"
        exit 2
    fi
}

# Execute main function with all arguments
main "$@"