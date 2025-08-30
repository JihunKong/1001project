#!/bin/bash

# 1001 Stories - Role Changes Validation Script
# Validates role system changes across different environments

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
STAGING_URL="${STAGING_URL:-https://localhost:8080}"
VALIDATION_LOG="${PROJECT_ROOT}/validation-logs/role-validation-${TIMESTAMP}.log"
REPORT_FILE="${PROJECT_ROOT}/validation-reports/role-validation-report-${TIMESTAMP}.json"

# Validation categories
VALIDATE_SCHEMA=true
VALIDATE_API=true
VALIDATE_UI=true
VALIDATE_ACCESS_CONTROL=true
VALIDATE_MIGRATION=true

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$VALIDATION_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1" | tee -a "$VALIDATION_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $1" | tee -a "$VALIDATION_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $1" | tee -a "$VALIDATION_LOG"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Validate role system changes across different aspects of the application.

OPTIONS:
    -h, --help              Show this help message
    --staging-url URL       Staging environment URL (default: https://localhost:8080)
    
    Validation Categories:
    --schema-only          Validate database schema only
    --api-only             Validate API endpoints only  
    --ui-only              Validate user interface only
    --access-only          Validate access control only
    --migration-only       Validate migration logic only
    --all                  Run all validations (default)
    
    Output Options:
    --json                 Output results in JSON format
    --report-file FILE     Specify custom report file location
    --verbose              Show detailed validation steps
    
VALIDATION CATEGORIES:

Schema Validation:
    - Database schema compliance
    - Role enum values
    - Foreign key constraints
    - Index optimization

API Validation:
    - Authentication endpoints
    - Role assignment endpoints
    - Migration endpoints
    - Access control middleware

UI Validation:
    - Role selection removal
    - Unified dashboard access
    - Admin panel restrictions
    - Navigation updates

Access Control Validation:
    - Route protection
    - Role-based permissions
    - Admin access controls
    - Legacy route blocking

Migration Validation:
    - Data migration logic
    - Rollback capabilities
    - Data integrity preservation
    - Performance impact

EOF
}

init_validation() {
    log "Initializing role changes validation..."
    
    # Create required directories
    mkdir -p "$(dirname "$VALIDATION_LOG")"
    mkdir -p "$(dirname "$REPORT_FILE")"
    
    # Initialize report structure
    cat > "$REPORT_FILE" << EOF
{
    "validation": {
        "timestamp": "$TIMESTAMP",
        "startTime": "$(date -Iseconds)",
        "environment": "$STAGING_URL",
        "categories": {
            "schema": $VALIDATE_SCHEMA,
            "api": $VALIDATE_API,
            "ui": $VALIDATE_UI,
            "accessControl": $VALIDATE_ACCESS_CONTROL,
            "migration": $VALIDATE_MIGRATION
        },
        "results": {}
    }
}
EOF
    
    log_success "Validation initialized"
}

validate_database_schema() {
    if [ "$VALIDATE_SCHEMA" = false ]; then
        return 0
    fi
    
    log "Validating database schema changes..."
    
    local schema_errors=0
    local schema_results=()
    
    # Check User table structure
    log "Checking User table schema..."
    local user_schema=$(curl -k -s "$STAGING_URL/api/admin/database/table-schema?table=User")
    
    # Validate role column
    if ! echo "$user_schema" | jq -e '.columns[] | select(.name == "role" and .type == "UserRole")' > /dev/null; then
        log_error "User table missing role column with UserRole type"
        schema_errors=$((schema_errors + 1))
        schema_results+=('{"test": "user_role_column", "status": "failed", "error": "Missing role column"}')
    else
        log_success "User table has correct role column"
        schema_results+=('{"test": "user_role_column", "status": "passed"}')
    fi
    
    # Validate UserRole enum values
    log "Checking UserRole enum values..."
    local enum_values=$(curl -k -s "$STAGING_URL/api/admin/database/enum-values?enum=UserRole")
    local expected_roles=("CUSTOMER" "ADMIN" "LEARNER")
    
    for role in "${expected_roles[@]}"; do
        if ! echo "$enum_values" | jq -e ".values[] | select(. == \"$role\")" > /dev/null; then
            log_error "UserRole enum missing value: $role"
            schema_errors=$((schema_errors + 1))
            schema_results+=("{\"test\": \"enum_value_$role\", \"status\": \"failed\", \"error\": \"Missing enum value\"}")
        else
            log_success "UserRole enum contains $role"
            schema_results+=("{\"test\": \"enum_value_$role\", \"status\": \"passed\"}")
        fi
    done
    
    # Check foreign key constraints
    log "Validating foreign key constraints..."
    local fk_constraints=$(curl -k -s "$STAGING_URL/api/admin/database/foreign-keys")
    local expected_fks=("User_Order" "User_Donation" "User_Session")
    
    for fk in "${expected_fks[@]}"; do
        if ! echo "$fk_constraints" | jq -e ".[] | select(.name | contains(\"$fk\"))" > /dev/null; then
            log_error "Missing foreign key constraint: $fk"
            schema_errors=$((schema_errors + 1))
            schema_results+=("{\"test\": \"foreign_key_$fk\", \"status\": \"failed\", \"error\": \"Missing constraint\"}")
        else
            log_success "Foreign key constraint exists: $fk"
            schema_results+=("{\"test\": \"foreign_key_$fk\", \"status\": \"passed\"}")
        fi
    done
    
    # Check indexes
    log "Validating database indexes..."
    local indexes=$(curl -k -s "$STAGING_URL/api/admin/database/indexes")
    local expected_indexes=("User_role_idx" "User_email_unique")
    
    for idx in "${expected_indexes[@]}"; do
        if ! echo "$indexes" | jq -e ".[] | select(.name == \"$idx\")" > /dev/null; then
            log_warning "Missing recommended index: $idx"
            schema_results+=("{\"test\": \"index_$idx\", \"status\": \"warning\", \"error\": \"Missing index\"}")
        else
            log_success "Database index exists: $idx"
            schema_results+=("{\"test\": \"index_$idx\", \"status\": \"passed\"}")
        fi
    done
    
    # Update report
    local schema_result=$(printf '%s\n' "${schema_results[@]}" | jq -s .)
    jq --argjson schema "$schema_result" '.validation.results.schema = $schema' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    if [ $schema_errors -eq 0 ]; then
        log_success "Database schema validation completed successfully"
        return 0
    else
        log_error "Database schema validation failed with $schema_errors errors"
        return 1
    fi
}

validate_api_endpoints() {
    if [ "$VALIDATE_API" = false ]; then
        return 0
    fi
    
    log "Validating API endpoints..."
    
    local api_errors=0
    local api_results=()
    
    # Test authentication endpoints
    log "Testing authentication API endpoints..."
    
    # Test signup (should not require role selection)
    local signup_response=$(curl -k -s -w "%{http_code}" -X POST "$STAGING_URL/api/auth/signup" \
        -H "Content-Type: application/json" \
        -d '{"email": "test-'$TIMESTAMP'@example.com"}' -o /dev/null)
    
    if [ "$signup_response" -eq 200 ]; then
        log_success "Signup API endpoint working correctly"
        api_results+=('{"test": "signup_endpoint", "status": "passed"}')
    else
        log_error "Signup API endpoint failed (HTTP $signup_response)"
        api_errors=$((api_errors + 1))
        api_results+=("{\"test\": \"signup_endpoint\", \"status\": \"failed\", \"error\": \"HTTP $signup_response\"}")
    fi
    
    # Test role assignment endpoint (admin only)
    log "Testing role assignment API endpoint..."
    local role_assign_response=$(curl -k -s -w "%{http_code}" -X POST "$STAGING_URL/api/admin/assign-role" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer invalid-token" \
        -d '{"userEmail": "test@example.com", "newRole": "ADMIN"}' -o /dev/null)
    
    # Should return 401/403 without proper admin authentication
    if [ "$role_assign_response" -eq 401 ] || [ "$role_assign_response" -eq 403 ]; then
        log_success "Role assignment API properly protected"
        api_results+=('{"test": "role_assign_protection", "status": "passed"}')
    else
        log_error "Role assignment API not properly protected (HTTP $role_assign_response)"
        api_errors=$((api_errors + 1))
        api_results+=("{\"test\": \"role_assign_protection\", \"status\": \"failed\", \"error\": \"HTTP $role_assign_response\"}")
    fi
    
    # Test migration endpoints
    log "Testing migration API endpoints..."
    local migration_response=$(curl -k -s -w "%{http_code}" -X POST "$STAGING_URL/api/admin/batch-migrate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer invalid-token" \
        -d '{"fromRole": "LEARNER", "toRole": "CUSTOMER"}' -o /dev/null)
    
    # Should be protected
    if [ "$migration_response" -eq 401 ] || [ "$migration_response" -eq 403 ]; then
        log_success "Migration API properly protected"
        api_results+=('{"test": "migration_protection", "status": "passed"}')
    else
        log_error "Migration API not properly protected (HTTP $migration_response)"
        api_errors=$((api_errors + 1))
        api_results+=("{\"test\": \"migration_protection\", \"status\": \"failed\", \"error\": \"HTTP $migration_response\"}")
    fi
    
    # Test user profile endpoint
    log "Testing user profile API endpoint..."
    local profile_response=$(curl -k -s -w "%{http_code}" -X GET "$STAGING_URL/api/user/profile" \
        -H "Authorization: Bearer invalid-token" -o /dev/null)
    
    # Should require authentication
    if [ "$profile_response" -eq 401 ]; then
        log_success "User profile API properly protected"
        api_results+=('{"test": "profile_protection", "status": "passed"}')
    else
        log_error "User profile API not properly protected (HTTP $profile_response)"
        api_errors=$((api_errors + 1))
        api_results+=("{\"test\": \"profile_protection\", \"status\": \"failed\", \"error\": \"HTTP $profile_response\"}")
    fi
    
    # Update report
    local api_result=$(printf '%s\n' "${api_results[@]}" | jq -s .)
    jq --argjson api "$api_result" '.validation.results.api = $api' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    if [ $api_errors -eq 0 ]; then
        log_success "API endpoints validation completed successfully"
        return 0
    else
        log_error "API endpoints validation failed with $api_errors errors"
        return 1
    fi
}

validate_ui_changes() {
    if [ "$VALIDATE_UI" = false ]; then
        return 0
    fi
    
    log "Validating UI changes..."
    
    local ui_errors=0
    local ui_results=()
    
    # Check signup page (no role selection)
    log "Validating signup page..."
    local signup_html=$(curl -k -s "$STAGING_URL/signup")
    
    # Should NOT contain role selection elements
    if echo "$signup_html" | grep -qi "role.*select\|choose.*role\|I am a"; then
        log_error "Signup page still contains role selection elements"
        ui_errors=$((ui_errors + 1))
        ui_results+=('{"test": "signup_no_role_selection", "status": "failed", "error": "Role selection found"}')
    else
        log_success "Signup page correctly removes role selection"
        ui_results+=('{"test": "signup_no_role_selection", "status": "passed"}')
    fi
    
    # Check login page
    log "Validating login page..."
    local login_html=$(curl -k -s "$STAGING_URL/login")
    
    if echo "$login_html" | grep -qi "role.*select\|choose.*role"; then
        log_error "Login page contains unexpected role selection elements"
        ui_errors=$((ui_errors + 1))
        ui_results+=('{"test": "login_no_role_selection", "status": "failed", "error": "Role selection found"}')
    else
        log_success "Login page correctly omits role selection"
        ui_results+=('{"test": "login_no_role_selection", "status": "passed"}')
    fi
    
    # Check legacy dashboard routes return 404
    log "Validating legacy dashboard routes..."
    local legacy_routes=("dashboard/learner" "dashboard/teacher" "dashboard/institution" "dashboard/volunteer")
    
    for route in "${legacy_routes[@]}"; do
        local route_response=$(curl -k -s -w "%{http_code}" "$STAGING_URL/$route" -o /dev/null)
        
        if [ "$route_response" -eq 404 ]; then
            log_success "Legacy route /$route correctly returns 404"
            ui_results+=("{\"test\": \"legacy_route_$route\", \"status\": \"passed\"}")
        else
            log_error "Legacy route /$route should return 404 but returns $route_response"
            ui_errors=$((ui_errors + 1))
            ui_results+=("{\"test\": \"legacy_route_$route\", \"status\": \"failed\", \"error\": \"HTTP $route_response\"}")
        fi
    done
    
    # Check unified dashboard accessibility
    log "Validating unified dashboard..."
    local dashboard_response=$(curl -k -s -w "%{http_code}" "$STAGING_URL/dashboard" -o /dev/null)
    
    # Should be accessible (but may require auth - 401 is acceptable)
    if [ "$dashboard_response" -eq 200 ] || [ "$dashboard_response" -eq 401 ]; then
        log_success "Unified dashboard route is accessible"
        ui_results+=('{"test": "unified_dashboard", "status": "passed"}')
    else
        log_error "Unified dashboard route returns unexpected status: $dashboard_response"
        ui_errors=$((ui_errors + 1))
        ui_results+=("{\"test\": \"unified_dashboard\", \"status\": \"failed\", \"error\": \"HTTP $dashboard_response\"}")
    fi
    
    # Update report
    local ui_result=$(printf '%s\n' "${ui_results[@]}" | jq -s .)
    jq --argjson ui "$ui_result" '.validation.results.ui = $ui' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    if [ $ui_errors -eq 0 ]; then
        log_success "UI changes validation completed successfully"
        return 0
    else
        log_error "UI changes validation failed with $ui_errors errors"
        return 1
    fi
}

validate_access_control() {
    if [ "$VALIDATE_ACCESS_CONTROL" = false ]; then
        return 0
    fi
    
    log "Validating access control changes..."
    
    local access_errors=0
    local access_results=()
    
    # Test admin panel access
    log "Testing admin panel access control..."
    local admin_response=$(curl -k -s -w "%{http_code}" "$STAGING_URL/admin" -o /dev/null)
    
    # Should require authentication
    if [ "$admin_response" -eq 401 ] || [ "$admin_response" -eq 403 ]; then
        log_success "Admin panel properly protected"
        access_results+=('{"test": "admin_protection", "status": "passed"}')
    else
        log_error "Admin panel not properly protected (HTTP $admin_response)"
        access_errors=$((access_errors + 1))
        access_results+=("{\"test\": \"admin_protection\", \"status\": \"failed\", \"error\": \"HTTP $admin_response\"}")
    fi
    
    # Test middleware protection
    log "Testing middleware protection..."
    local protected_routes=("api/admin/users" "api/admin/migrate" "api/admin/settings")
    
    for route in "${protected_routes[@]}"; do
        local route_response=$(curl -k -s -w "%{http_code}" "$STAGING_URL/$route" -o /dev/null)
        
        if [ "$route_response" -eq 401 ] || [ "$route_response" -eq 403 ]; then
            log_success "Route /$route properly protected"
            access_results+=("{\"test\": \"route_protection_$route\", \"status\": \"passed\"}")
        else
            log_error "Route /$route not properly protected (HTTP $route_response)"
            access_errors=$((access_errors + 1))
            access_results+=("{\"test\": \"route_protection_$route\", \"status\": \"failed\", \"error\": \"HTTP $route_response\"}")
        fi
    done
    
    # Test demo mode access
    log "Testing demo mode access..."
    local demo_response=$(curl -k -s -w "%{http_code}" "$STAGING_URL/demo" -o /dev/null)
    
    # Demo should be publicly accessible
    if [ "$demo_response" -eq 200 ]; then
        log_success "Demo mode properly accessible"
        access_results+=('{"test": "demo_access", "status": "passed"}')
    else
        log_error "Demo mode not accessible (HTTP $demo_response)"
        access_errors=$((access_errors + 1))
        access_results+=("{\"test\": \"demo_access\", \"status\": \"failed\", \"error\": \"HTTP $demo_response\"}")
    fi
    
    # Update report
    local access_result=$(printf '%s\n' "${access_results[@]}" | jq -s .)
    jq --argjson access "$access_result" '.validation.results.accessControl = $access' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    if [ $access_errors -eq 0 ]; then
        log_success "Access control validation completed successfully"
        return 0
    else
        log_error "Access control validation failed with $access_errors errors"
        return 1
    fi
}

validate_migration_logic() {
    if [ "$VALIDATE_MIGRATION" = false ]; then
        return 0
    fi
    
    log "Validating migration logic..."
    
    local migration_errors=0
    local migration_results=()
    
    # Test migration dry-run
    log "Testing migration dry-run..."
    local dryrun_response=$(curl -k -s -X POST "$STAGING_URL/api/test/migration-dryrun" \
        -H "Content-Type: application/json" \
        -d '{"fromRole": "LEARNER", "toRole": "CUSTOMER", "dryRun": true}')
    
    if echo "$dryrun_response" | jq -e '.success == true' > /dev/null; then
        log_success "Migration dry-run works correctly"
        migration_results+=('{"test": "migration_dryrun", "status": "passed"}')
    else
        log_error "Migration dry-run failed"
        migration_errors=$((migration_errors + 1))
        migration_results+=('{"test": "migration_dryrun", "status": "failed", "error": "Dry-run failed"}')
    fi
    
    # Test migration validation
    log "Testing migration validation logic..."
    local validation_response=$(curl -k -s -X POST "$STAGING_URL/api/test/validate-migration-readiness" \
        -H "Content-Type: application/json" \
        -d '{"targetUsers": "LEARNER"}')
    
    if echo "$validation_response" | jq -e '.ready == true or .ready == false' > /dev/null; then
        log_success "Migration validation logic works"
        migration_results+=('{"test": "migration_validation", "status": "passed"}')
    else
        log_error "Migration validation logic failed"
        migration_errors=$((migration_errors + 1))
        migration_results+=('{"test": "migration_validation", "status": "failed", "error": "Validation logic error"}')
    fi
    
    # Test rollback capabilities
    log "Testing rollback validation..."
    local rollback_response=$(curl -k -s -X POST "$STAGING_URL/api/test/validate-rollback-capability" \
        -H "Content-Type: application/json" \
        -d '{"migrationId": "test-migration-123"}')
    
    if echo "$rollback_response" | jq -e '.rollbackPossible != null' > /dev/null; then
        log_success "Rollback validation works"
        migration_results+=('{"test": "rollback_validation", "status": "passed"}')
    else
        log_error "Rollback validation failed"
        migration_errors=$((migration_errors + 1))
        migration_results+=('{"test": "rollback_validation", "status": "failed", "error": "Rollback validation error"}')
    fi
    
    # Test data integrity checks
    log "Testing data integrity validation..."
    local integrity_response=$(curl -k -s "$STAGING_URL/api/test/data-integrity-check")
    
    if echo "$integrity_response" | jq -e '.integrityCheck.passed == true' > /dev/null; then
        log_success "Data integrity checks work"
        migration_results+=('{"test": "data_integrity", "status": "passed"}')
    else
        log_warning "Data integrity check returned warnings or errors"
        migration_results+=('{"test": "data_integrity", "status": "warning", "error": "Integrity issues detected"}')
    fi
    
    # Update report
    local migration_result=$(printf '%s\n' "${migration_results[@]}" | jq -s .)
    jq --argjson migration "$migration_result" '.validation.results.migration = $migration' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    if [ $migration_errors -eq 0 ]; then
        log_success "Migration logic validation completed successfully"
        return 0
    else
        log_error "Migration logic validation failed with $migration_errors errors"
        return 1
    fi
}

generate_final_report() {
    log "Generating final validation report..."
    
    # Update report with completion time
    jq --arg endTime "$(date -Iseconds)" '.validation.endTime = $endTime' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    # Calculate overall status
    local total_errors=0
    local total_warnings=0
    local total_passed=0
    
    # Count results from each category
    for category in schema api ui accessControl migration; do
        if jq -e ".validation.results.$category" "$REPORT_FILE" > /dev/null; then
            local cat_errors=$(jq ".validation.results.$category | map(select(.status == \"failed\")) | length" "$REPORT_FILE")
            local cat_warnings=$(jq ".validation.results.$category | map(select(.status == \"warning\")) | length" "$REPORT_FILE")
            local cat_passed=$(jq ".validation.results.$category | map(select(.status == \"passed\")) | length" "$REPORT_FILE")
            
            total_errors=$((total_errors + cat_errors))
            total_warnings=$((total_warnings + cat_warnings))
            total_passed=$((total_passed + cat_passed))
        fi
    done
    
    # Update report with summary
    jq --argjson errors $total_errors --argjson warnings $total_warnings --argjson passed $total_passed \
       '.validation.summary = {"passed": $passed, "warnings": $warnings, "errors": $errors, "total": ($passed + $warnings + $errors)}' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    # Determine overall status
    local overall_status="passed"
    if [ $total_errors -gt 0 ]; then
        overall_status="failed"
    elif [ $total_warnings -gt 0 ]; then
        overall_status="warning"
    fi
    
    jq --arg status "$overall_status" '.validation.overallStatus = $status' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    log "Validation Summary:"
    log "  Total Tests: $((total_passed + total_warnings + total_errors))"
    log "  Passed: $total_passed"
    log "  Warnings: $total_warnings" 
    log "  Errors: $total_errors"
    log "  Overall Status: $overall_status"
    
    log_success "Validation report generated: $REPORT_FILE"
    
    return $total_errors
}

# Parse command line arguments
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
        --schema-only)
            VALIDATE_SCHEMA=true
            VALIDATE_API=false
            VALIDATE_UI=false
            VALIDATE_ACCESS_CONTROL=false
            VALIDATE_MIGRATION=false
            shift
            ;;
        --api-only)
            VALIDATE_SCHEMA=false
            VALIDATE_API=true
            VALIDATE_UI=false
            VALIDATE_ACCESS_CONTROL=false
            VALIDATE_MIGRATION=false
            shift
            ;;
        --ui-only)
            VALIDATE_SCHEMA=false
            VALIDATE_API=false
            VALIDATE_UI=true
            VALIDATE_ACCESS_CONTROL=false
            VALIDATE_MIGRATION=false
            shift
            ;;
        --access-only)
            VALIDATE_SCHEMA=false
            VALIDATE_API=false
            VALIDATE_UI=false
            VALIDATE_ACCESS_CONTROL=true
            VALIDATE_MIGRATION=false
            shift
            ;;
        --migration-only)
            VALIDATE_SCHEMA=false
            VALIDATE_API=false
            VALIDATE_UI=false
            VALIDATE_ACCESS_CONTROL=false
            VALIDATE_MIGRATION=true
            shift
            ;;
        --all)
            VALIDATE_SCHEMA=true
            VALIDATE_API=true
            VALIDATE_UI=true
            VALIDATE_ACCESS_CONTROL=true
            VALIDATE_MIGRATION=true
            shift
            ;;
        --report-file)
            REPORT_FILE="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
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
    
    log "Starting role changes validation - $(date)"
    log "Environment: $STAGING_URL"
    
    # Initialize validation
    init_validation
    
    # Run validation categories
    validate_database_schema || exit_code=$?
    validate_api_endpoints || exit_code=$?
    validate_ui_changes || exit_code=$?
    validate_access_control || exit_code=$?
    validate_migration_logic || exit_code=$?
    
    # Generate final report
    generate_final_report
    local report_exit=$?
    if [ $exit_code -eq 0 ]; then
        exit_code=$report_exit
    fi
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        log_success "Role changes validation completed successfully in ${total_duration}s"
    else
        log_error "Role changes validation completed with errors in ${total_duration}s"
    fi
    
    # Output JSON if requested
    if [ "$JSON_OUTPUT" = true ]; then
        cat "$REPORT_FILE"
    fi
    
    return $exit_code
}

# Run main function
main "$@"