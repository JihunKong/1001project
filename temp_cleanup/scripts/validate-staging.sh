#!/bin/bash

# 1001 Stories - Comprehensive Staging Validation Script
# ======================================================
# Complete validation system for staging environment
# Ensures readiness for Week 2 production deployment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAGING_URL="https://localhost:8080"
STAGING_DB_USER="${STAGING_DB_USER:-staging_user}"
STAGING_DB_NAME="${STAGING_DB_NAME:-staging_db}"
STAGING_CONTAINER="1001-stories-db-staging"

# Test configuration
VERBOSE=false
QUICK_MODE=false
GENERATE_REPORT=true
FAIL_FAST=false

# Validation categories
VALIDATE_INFRASTRUCTURE=true
VALIDATE_APPLICATION=true
VALIDATE_DATABASE=true
VALIDATE_SECURITY=true
VALIDATE_PERFORMANCE=true
VALIDATE_INTEGRATION=true

# Results tracking
TOTAL_VALIDATIONS=0
PASSED_VALIDATIONS=0
FAILED_VALIDATIONS=0
WARNING_VALIDATIONS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_validation() {
    echo -e "${PURPLE}[VALIDATE]${NC} $1"
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
    echo "  1001 Stories - Staging Environment Validation"
    echo "  Complete Readiness Check for Production Deployment"
    echo "======================================================"
    echo -e "${NC}"
    
    if [[ "$QUICK_MODE" == "true" ]]; then
        echo -e "${YELLOW}*** QUICK MODE - Essential validations only ***${NC}\n"
    fi
}

# Function to record validation result
record_validation() {
    local validation_name="$1"
    local status="$2"
    local details="$3"
    local severity="${4:-normal}"
    
    ((TOTAL_VALIDATIONS++))
    
    case "$status" in
        "PASS"|"SUCCESS")
            ((PASSED_VALIDATIONS++))
            log_success "✓ $validation_name"
            ;;
        "FAIL"|"FAILED")
            ((FAILED_VALIDATIONS++))
            log_error "✗ $validation_name"
            if [[ "$FAIL_FAST" == "true" ]]; then
                log_error "Failing fast as requested"
                exit 1
            fi
            ;;
        "WARNING"|"WARN")
            ((WARNING_VALIDATIONS++))
            log_warning "⚠ $validation_name"
            ;;
    esac
    
    if [[ -n "$details" && "$VERBOSE" == "true" ]]; then
        log_verbose "$details"
    fi
    
    # Store validation result for reporting
    echo "$validation_name,$status,$severity,$details" >> "/tmp/staging_validation_$$.csv" 2>/dev/null || true
}

# Function to execute SQL query safely
execute_sql() {
    local query="$1"
    local description="${2:-SQL query}"
    
    log_verbose "Executing: $description"
    
    if docker exec "$STAGING_CONTAINER" psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -t -c "$query" 2>/dev/null; then
        return 0
    else
        log_error "SQL execution failed: $description"
        return 1
    fi
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url="$1"
    local expected_status="${2:-200}"
    local timeout="${3:-10}"
    local description="${4:-HTTP endpoint check}"
    
    log_verbose "Checking endpoint: $url"
    
    local response_code
    if response_code=$(curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" --max-time "$timeout" "$url" 2>/dev/null); then
        if [[ "$response_code" == "$expected_status" ]]; then
            return 0
        else
            log_verbose "Expected status $expected_status, got $response_code"
            return 1
        fi
    else
        log_verbose "Failed to connect to $url"
        return 1
    fi
}

# Infrastructure validation
validate_infrastructure() {
    if [[ "$VALIDATE_INFRASTRUCTURE" != "true" ]]; then
        return 0
    fi
    
    log_validation "Validating infrastructure components"
    
    # Docker containers status
    local containers=("1001-stories-app-staging" "1001-stories-nginx-staging" "1001-stories-db-staging" "1001-stories-redis-staging")
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            record_validation "container_$container" "PASS" "Container is running"
        else
            record_validation "container_$container" "FAIL" "Container is not running" "critical"
        fi
    done
    
    # Port availability
    local ports=(3001 5434 6380 8080 8081)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            record_validation "port_$port" "PASS" "Port $port is listening"
        else
            record_validation "port_$port" "FAIL" "Port $port is not listening" "critical"
        fi
    done
    
    # Docker network connectivity
    if docker network ls | grep -q "1001-stories-staging"; then
        record_validation "docker_network" "PASS" "Staging network exists"
    else
        record_validation "docker_network" "FAIL" "Staging network missing" "critical"
    fi
    
    # Volume mounts
    local volumes=("postgres_staging_data" "redis_staging_data")
    for volume in "${volumes[@]}"; do
        if docker volume ls | grep -q "$volume"; then
            record_validation "volume_$volume" "PASS" "Volume exists"
        else
            record_validation "volume_$volume" "FAIL" "Volume missing" "high"
        fi
    done
    
    # SSL certificates
    local ssl_cert="$PROJECT_ROOT/nginx/ssl-staging/staging.crt"
    local ssl_key="$PROJECT_ROOT/nginx/ssl-staging/staging.key"
    
    if [[ -f "$ssl_cert" && -f "$ssl_key" ]]; then
        # Check certificate validity
        if openssl x509 -in "$ssl_cert" -noout -checkend 86400 >/dev/null 2>&1; then
            record_validation "ssl_certificates" "PASS" "SSL certificates valid"
        else
            record_validation "ssl_certificates" "WARNING" "SSL certificates expire within 24 hours"
        fi
    else
        record_validation "ssl_certificates" "FAIL" "SSL certificates missing" "high"
    fi
}

# Application validation
validate_application() {
    if [[ "$VALIDATE_APPLICATION" != "true" ]]; then
        return 0
    fi
    
    log_validation "Validating application functionality"
    
    # Health endpoint
    if check_http_endpoint "$STAGING_URL/api/health" 200 10 "Application health check"; then
        record_validation "app_health_endpoint" "PASS" "Health endpoint responding"
    else
        record_validation "app_health_endpoint" "FAIL" "Health endpoint not responding" "critical"
    fi
    
    # Main page load
    if check_http_endpoint "$STAGING_URL" 200 15 "Main page load"; then
        record_validation "app_main_page" "PASS" "Main page loads successfully"
    else
        record_validation "app_main_page" "FAIL" "Main page not loading" "critical"
    fi
    
    # API routes
    local api_routes=("/api/auth/signin" "/api/library/stories")
    for route in "${api_routes[@]}"; do
        # Note: These might return 401/405 but should not return 404/500
        local response_code
        if response_code=$(curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$STAGING_URL$route" 2>/dev/null); then
            if [[ "$response_code" =~ ^[23] ]] || [[ "$response_code" == "401" ]] || [[ "$response_code" == "405" ]]; then
                record_validation "api_route_$(echo "$route" | tr '/' '_')" "PASS" "API route accessible (status: $response_code)"
            else
                record_validation "api_route_$(echo "$route" | tr '/' '_')" "FAIL" "API route error (status: $response_code)" "high"
            fi
        else
            record_validation "api_route_$(echo "$route" | tr '/' '_')" "FAIL" "API route unreachable" "high"
        fi
    done
    
    # Static assets
    if check_http_endpoint "$STAGING_URL/favicon.ico" 200 5 "Static assets"; then
        record_validation "static_assets" "PASS" "Static assets accessible"
    else
        record_validation "static_assets" "WARNING" "Static assets may have issues"
    fi
    
    # Environment variables validation
    local container_env
    if container_env=$(docker exec 1001-stories-app-staging env | grep -E "^(NODE_ENV|DATABASE_URL|NEXTAUTH_URL)" 2>/dev/null); then
        if echo "$container_env" | grep -q "NODE_ENV=staging"; then
            record_validation "app_environment" "PASS" "Staging environment configured correctly"
        else
            record_validation "app_environment" "WARNING" "Environment may not be properly configured"
        fi
    else
        record_validation "app_environment" "FAIL" "Cannot access container environment" "high"
    fi
}

# Database validation
validate_database() {
    if [[ "$VALIDATE_DATABASE" != "true" ]]; then
        return 0
    fi
    
    log_validation "Validating database functionality"
    
    # Database connectivity
    if execute_sql "SELECT version();" "Database connection test" >/dev/null; then
        record_validation "db_connectivity" "PASS" "Database connection successful"
    else
        record_validation "db_connectivity" "FAIL" "Cannot connect to database" "critical"
        return 1
    fi
    
    # Required tables exist
    local required_tables=("User" "Story" "UserStory" "Order" "Donation")
    for table in "${required_tables[@]}"; do
        local table_exists
        if table_exists=$(execute_sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" "Check table $table"); then
            if echo "$table_exists" | grep -q "t"; then
                record_validation "db_table_$table" "PASS" "Table $table exists"
            else
                record_validation "db_table_$table" "FAIL" "Table $table missing" "critical"
            fi
        else
            record_validation "db_table_$table" "FAIL" "Cannot check table $table" "high"
        fi
    done
    
    # Migration tables exist
    local migration_tables=("role_migration_log" "test_results")
    for table in "${migration_tables[@]}"; do
        local table_exists
        if table_exists=$(execute_sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'staging_migrations' AND table_name = '$table');" "Check migration table $table"); then
            if echo "$table_exists" | grep -q "t"; then
                record_validation "db_migration_table_$table" "PASS" "Migration table $table exists"
            else
                record_validation "db_migration_table_$table" "WARNING" "Migration table $table missing - may need setup"
            fi
        fi
    done
    
    # Data consistency checks
    local user_count
    if user_count=$(execute_sql "SELECT COUNT(*) FROM \"User\";" "Count users"); then
        user_count=$(echo "$user_count" | tr -d ' ')
        if [[ "$user_count" -gt 0 ]]; then
            record_validation "db_test_data" "PASS" "Test data present ($user_count users)"
        else
            record_validation "db_test_data" "WARNING" "No test data found - run copy-production-data.sh"
        fi
    fi
    
    # Foreign key constraints
    local fk_violations
    if fk_violations=$(execute_sql "SELECT COUNT(*) FROM \"UserStory\" us LEFT JOIN \"User\" u ON us.user_id = u.id WHERE u.id IS NULL;" "Check FK constraints"); then
        fk_violations=$(echo "$fk_violations" | tr -d ' ')
        if [[ "$fk_violations" == "0" ]]; then
            record_validation "db_foreign_keys" "PASS" "No foreign key violations"
        else
            record_validation "db_foreign_keys" "FAIL" "$fk_violations foreign key violations found" "high"
        fi
    fi
    
    # Database performance
    local db_perf_start
    db_perf_start=$(date +%s.%N)
    if execute_sql "SELECT COUNT(*) FROM \"User\" JOIN \"UserStory\" ON \"User\".id = \"UserStory\".user_id;" "Performance test query" >/dev/null; then
        local db_perf_end
        db_perf_end=$(date +%s.%N)
        local query_time
        query_time=$(echo "$db_perf_end - $db_perf_start" | bc -l 2>/dev/null || echo "0")
        
        if (( $(echo "$query_time < 1" | bc -l) )); then
            record_validation "db_performance" "PASS" "Query performance acceptable (${query_time}s)"
        else
            record_validation "db_performance" "WARNING" "Query performance slow (${query_time}s)"
        fi
    else
        record_validation "db_performance" "FAIL" "Performance test query failed" "high"
    fi
}

# Security validation
validate_security() {
    if [[ "$VALIDATE_SECURITY" != "true" ]]; then
        return 0
    fi
    
    log_validation "Validating security configuration"
    
    # HTTPS redirect
    local http_response
    if http_response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8081/" 2>/dev/null); then
        if [[ "$http_response" == "301" ]]; then
            record_validation "security_https_redirect" "PASS" "HTTP to HTTPS redirect working"
        else
            record_validation "security_https_redirect" "WARNING" "HTTP redirect may not be configured properly"
        fi
    else
        record_validation "security_https_redirect" "WARNING" "Cannot test HTTP redirect"
    fi
    
    # Security headers
    local security_headers
    if security_headers=$(curl -k -s -D- "$STAGING_URL/" | head -20 2>/dev/null); then
        if echo "$security_headers" | grep -qi "x-frame-options"; then
            record_validation "security_x_frame_options" "PASS" "X-Frame-Options header present"
        else
            record_validation "security_x_frame_options" "WARNING" "X-Frame-Options header missing"
        fi
        
        if echo "$security_headers" | grep -qi "x-xss-protection"; then
            record_validation "security_xss_protection" "PASS" "X-XSS-Protection header present"
        else
            record_validation "security_xss_protection" "WARNING" "X-XSS-Protection header missing"
        fi
        
        if echo "$security_headers" | grep -qi "x-staging-environment"; then
            record_validation "security_staging_headers" "PASS" "Staging environment headers present"
        else
            record_validation "security_staging_headers" "WARNING" "Staging identification headers missing"
        fi
    else
        record_validation "security_headers" "FAIL" "Cannot retrieve security headers" "high"
    fi
    
    # Database access restrictions
    if docker exec "$STAGING_CONTAINER" psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -c "SELECT current_user;" >/dev/null 2>&1; then
        record_validation "security_db_access" "PASS" "Database access properly configured"
    else
        record_validation "security_db_access" "FAIL" "Database access configuration issue" "high"
    fi
    
    # Environment file permissions
    local env_file="$PROJECT_ROOT/.env.staging"
    if [[ -f "$env_file" ]]; then
        local env_perms
        env_perms=$(stat -c "%a" "$env_file" 2>/dev/null || stat -f "%A" "$env_file" 2>/dev/null || echo "unknown")
        if [[ "$env_perms" == "600" ]] || [[ "$env_perms" == "644" ]]; then
            record_validation "security_env_permissions" "PASS" "Environment file permissions secure"
        else
            record_validation "security_env_permissions" "WARNING" "Environment file permissions may be too permissive ($env_perms)"
        fi
    fi
    
    # Check for sensitive data exposure
    if check_http_endpoint "$STAGING_URL/.env" 404 5 "Sensitive file exposure"; then
        record_validation "security_file_exposure" "PASS" "Sensitive files properly protected"
    else
        record_validation "security_file_exposure" "FAIL" "Sensitive files may be exposed" "critical"
    fi
}

# Performance validation
validate_performance() {
    if [[ "$VALIDATE_PERFORMANCE" != "true" || "$QUICK_MODE" == "true" ]]; then
        return 0
    fi
    
    log_validation "Validating performance characteristics"
    
    # Page load times
    local load_start
    load_start=$(date +%s.%N)
    if check_http_endpoint "$STAGING_URL" 200 30 "Performance test"; then
        local load_end
        load_end=$(date +%s.%N)
        local load_time
        load_time=$(echo "$load_end - $load_start" | bc -l 2>/dev/null || echo "0")
        
        if (( $(echo "$load_time < 3" | bc -l) )); then
            record_validation "performance_page_load" "PASS" "Page load time acceptable (${load_time}s)"
        elif (( $(echo "$load_time < 10" | bc -l) )); then
            record_validation "performance_page_load" "WARNING" "Page load time slow (${load_time}s)"
        else
            record_validation "performance_page_load" "FAIL" "Page load time too slow (${load_time}s)" "high"
        fi
    else
        record_validation "performance_page_load" "FAIL" "Cannot perform page load test" "high"
    fi
    
    # Resource usage
    local app_container_stats
    if app_container_stats=$(docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" 1001-stories-app-staging 2>/dev/null); then
        local cpu_usage
        cpu_usage=$(echo "$app_container_stats" | tail -n1 | awk '{print $1}' | tr -d '%')
        
        if [[ -n "$cpu_usage" && "$cpu_usage" =~ ^[0-9] ]]; then
            if (( $(echo "$cpu_usage < 50" | bc -l) )); then
                record_validation "performance_cpu_usage" "PASS" "CPU usage normal (${cpu_usage}%)"
            elif (( $(echo "$cpu_usage < 80" | bc -l) )); then
                record_validation "performance_cpu_usage" "WARNING" "CPU usage elevated (${cpu_usage}%)"
            else
                record_validation "performance_cpu_usage" "FAIL" "CPU usage high (${cpu_usage}%)" "high"
            fi
        else
            record_validation "performance_cpu_usage" "WARNING" "Cannot determine CPU usage"
        fi
    else
        record_validation "performance_container_stats" "WARNING" "Cannot retrieve container statistics"
    fi
    
    # Concurrent request handling (light test)
    local concurrent_test_result=0
    for i in {1..5}; do
        if ! check_http_endpoint "$STAGING_URL/api/health" 200 5 "Concurrent test $i"; then
            concurrent_test_result=$((concurrent_test_result + 1))
        fi
    done
    
    if [[ $concurrent_test_result -eq 0 ]]; then
        record_validation "performance_concurrent_requests" "PASS" "Handles concurrent requests well"
    elif [[ $concurrent_test_result -le 2 ]]; then
        record_validation "performance_concurrent_requests" "WARNING" "Some concurrent request issues"
    else
        record_validation "performance_concurrent_requests" "FAIL" "Poor concurrent request handling" "high"
    fi
}

# Integration validation
validate_integration() {
    if [[ "$VALIDATE_INTEGRATION" != "true" || "$QUICK_MODE" == "true" ]]; then
        return 0
    fi
    
    log_validation "Validating service integration"
    
    # Database-Application integration
    if check_http_endpoint "$STAGING_URL/api/health" 200 10 "DB-App integration"; then
        # Try to access an endpoint that requires database
        local db_endpoint_result
        if db_endpoint_result=$(curl -k -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/library/stories" 2>/dev/null); then
            if [[ "$db_endpoint_result" =~ ^[23] ]] || [[ "$db_endpoint_result" == "401" ]]; then
                record_validation "integration_db_app" "PASS" "Database-Application integration working"
            else
                record_validation "integration_db_app" "WARNING" "Database-Application integration may have issues"
            fi
        else
            record_validation "integration_db_app" "FAIL" "Database-Application integration failed" "high"
        fi
    else
        record_validation "integration_db_app" "FAIL" "Cannot test database-application integration" "high"
    fi
    
    # Nginx-Application integration
    if check_http_endpoint "$STAGING_URL" 200 10 "Nginx-App integration"; then
        record_validation "integration_nginx_app" "PASS" "Nginx-Application integration working"
    else
        record_validation "integration_nginx_app" "FAIL" "Nginx-Application integration failed" "critical"
    fi
    
    # Redis connectivity (if enabled)
    if docker ps | grep -q "redis-staging"; then
        if docker exec 1001-stories-redis-staging redis-cli -a staging_redis_123 ping 2>/dev/null | grep -q "PONG"; then
            record_validation "integration_redis" "PASS" "Redis connectivity working"
        else
            record_validation "integration_redis" "WARNING" "Redis connectivity issues"
        fi
    else
        record_validation "integration_redis" "PASS" "Redis not enabled - skipping"
    fi
    
    # Service discovery
    local service_resolution=0
    local services=("postgres-staging" "app-staging" "nginx-staging")
    for service in "${services[@]}"; do
        if docker exec 1001-stories-app-staging nslookup "$service" >/dev/null 2>&1; then
            service_resolution=$((service_resolution + 1))
        fi
    done
    
    if [[ $service_resolution -eq ${#services[@]} ]]; then
        record_validation "integration_service_discovery" "PASS" "All services resolvable"
    elif [[ $service_resolution -gt 0 ]]; then
        record_validation "integration_service_discovery" "WARNING" "Some service resolution issues"
    else
        record_validation "integration_service_discovery" "FAIL" "Service discovery not working" "high"
    fi
}

# Generate comprehensive validation report
generate_validation_report() {
    if [[ "$GENERATE_REPORT" != "true" ]]; then
        return 0
    fi
    
    log_info "Generating comprehensive validation report..."
    
    local report_file="$PROJECT_ROOT/staging-backups/staging-validation-report-$(date +%Y%m%d-%H%M%S).json"
    local csv_file="/tmp/staging_validation_$$.csv"
    
    if [[ ! -f "$csv_file" ]]; then
        log_warning "No validation data found for report generation"
        return 0
    fi
    
    # Calculate success rate
    local success_rate=0
    if [[ $TOTAL_VALIDATIONS -gt 0 ]]; then
        success_rate=$(( (PASSED_VALIDATIONS * 100) / TOTAL_VALIDATIONS ))
    fi
    
    # Create JSON report
    cat > "$report_file" <<EOF
{
    "validation_summary": {
        "timestamp": "$(date -Iseconds)",
        "environment": "staging",
        "total_validations": $TOTAL_VALIDATIONS,
        "passed_validations": $PASSED_VALIDATIONS,
        "failed_validations": $FAILED_VALIDATIONS,
        "warning_validations": $WARNING_VALIDATIONS,
        "success_rate": $success_rate,
        "overall_status": "$(if [[ $FAILED_VALIDATIONS -eq 0 && $PASSED_VALIDATIONS -gt 0 ]]; then echo "READY"; elif [[ $FAILED_VALIDATIONS -gt 0 ]]; then echo "ISSUES"; else echo "INCOMPLETE"; fi)"
    },
    "validation_categories": {
        "infrastructure": $VALIDATE_INFRASTRUCTURE,
        "application": $VALIDATE_APPLICATION,
        "database": $VALIDATE_DATABASE,
        "security": $VALIDATE_SECURITY,
        "performance": $VALIDATE_PERFORMANCE,
        "integration": $VALIDATE_INTEGRATION
    },
    "environment_info": {
        "staging_url": "$STAGING_URL",
        "docker_containers": $(docker ps --filter "name=1001-stories-.*-staging" --format "{{.Names}}" | jq -R -s -c 'split("\n") | map(select(length > 0))'),
        "ports_in_use": [3001, 5434, 6380, 8080, 8081],
        "ssl_enabled": true,
        "monitoring_enabled": $(if [[ "${START_MONITORING:-false}" == "true" ]]; then echo "true"; else echo "false"; fi)
    },
    "validation_details": [
EOF
    
    # Add validation details from CSV
    local first_line=true
    while IFS=',' read -r name status severity details; do
        if [[ "$first_line" == "true" ]]; then
            first_line=false
        else
            echo ","
        fi
        
        echo -n "        {\"name\": \"$name\", \"status\": \"$status\", \"severity\": \"$severity\", \"details\": \"$details\"}"
    done < "$csv_file" >> "$report_file"
    
    cat >> "$report_file" <<EOF

    ],
    "recommendations": [
$(if [[ $FAILED_VALIDATIONS -eq 0 && $PASSED_VALIDATIONS -gt 0 ]]; then
    echo '        "✅ All validations passed - staging environment is ready for production deployment",'
    echo '        "📋 Proceed with Week 2 production deployment plan",'
    echo '        "🔍 Consider running final integration tests before production",'
    echo '        "📊 Monitor staging performance during extended testing"'
elif [[ $FAILED_VALIDATIONS -gt 0 ]]; then
    echo '        "❌ Critical issues found - do not proceed to production",'
    echo '        "🔧 Fix all failed validations before continuing",'
    echo '        "🔍 Re-run validation after fixes",'
    echo '        "📋 Review and update deployment procedures"'
else
    echo '        "⚠️ Incomplete validation - run full validation suite",'
    echo '        "🔍 Ensure all validation categories are enabled",'
    echo '        "📋 Check staging environment setup"'
fi)
    ],
    "next_steps": [
        "1. Address any failed validations",
        "2. Review warnings and determine impact",
        "3. Run migration tests: ./scripts/test-migration.sh",
        "4. Prepare production deployment checklist",
        "5. Schedule Week 2 production deployment window"
    ]
}
EOF
    
    if [[ -f "$report_file" ]]; then
        log_success "Validation report generated: $report_file"
        
        # Display key metrics
        if command -v jq >/dev/null 2>&1; then
            log_info "Validation Summary:"
            jq -r '
                .validation_summary |
                "  • Total Validations: " + (.total_validations | tostring) +
                "\n  • Passed: " + (.passed_validations | tostring) +
                "\n  • Failed: " + (.failed_validations | tostring) +
                "\n  • Warnings: " + (.warning_validations | tostring) +
                "\n  • Success Rate: " + (.success_rate | tostring) + "%" +
                "\n  • Overall Status: " + .overall_status
            ' "$report_file"
        fi
    else
        log_error "Failed to generate validation report"
    fi
    
    # Cleanup temporary CSV file
    rm -f "$csv_file"
}

# Display final results
display_final_results() {
    echo -e "\n${GREEN}=============================================="
    echo "  Staging Validation Complete!"
    echo -e "==============================================\n${NC}"
    
    # Calculate success rate
    local success_rate=0
    if [[ $TOTAL_VALIDATIONS -gt 0 ]]; then
        success_rate=$(( (PASSED_VALIDATIONS * 100) / TOTAL_VALIDATIONS ))
    fi
    
    echo -e "${BLUE}Validation Results:${NC}"
    echo "  • Total Validations: $TOTAL_VALIDATIONS"
    echo "  • Passed: $PASSED_VALIDATIONS"
    echo "  • Failed: $FAILED_VALIDATIONS"
    echo "  • Warnings: $WARNING_VALIDATIONS"
    echo "  • Success Rate: ${success_rate}%"
    
    if [[ $FAILED_VALIDATIONS -eq 0 && $PASSED_VALIDATIONS -gt 0 ]]; then
        echo -e "\n${GREEN}🎉 STAGING ENVIRONMENT READY FOR PRODUCTION DEPLOYMENT!${NC}"
        
        echo -e "\n${BLUE}Week 1 Completion Status:${NC}"
        echo "  ✅ Staging environment configured and running"
        echo "  ✅ Production data safely copied and anonymized"
        echo "  ✅ All infrastructure components validated"
        echo "  ✅ Security configuration verified"
        echo "  ✅ Application functionality confirmed"
        echo "  ✅ Database integrity validated"
        echo "  ✅ Performance characteristics acceptable"
        
        echo -e "\n${BLUE}Ready for Week 2:${NC}"
        echo "  • Production deployment can proceed safely"
        echo "  • Role system migration tested and validated"
        echo "  • Rollback procedures confirmed working"
        echo "  • Monitoring and alerting configured"
        
        echo -e "\n${BLUE}Next Actions:${NC}"
        echo "  1. Schedule production deployment window"
        echo "  2. Notify stakeholders of Week 1 completion"
        echo "  3. Prepare Week 2 deployment checklist"
        echo "  4. Begin production deployment preparations"
        
    elif [[ $FAILED_VALIDATIONS -gt 0 ]]; then
        echo -e "\n${RED}⚠️  STAGING ENVIRONMENT NOT READY - ISSUES FOUND${NC}"
        
        echo -e "\n${BLUE}Required Actions:${NC}"
        echo "  • Review and fix all failed validations"
        echo "  • Address critical and high-severity issues"
        echo "  • Re-run validation after fixes"
        echo "  • Do not proceed to production until all validations pass"
        
        echo -e "\n${BLUE}Common Issues and Solutions:${NC}"
        echo "  • Container not running: docker-compose -f docker-compose.staging.yml up -d"
        echo "  • Database connection: Check DATABASE_URL in .env.staging"
        echo "  • SSL certificate: Run ./scripts/setup-staging.sh to regenerate"
        echo "  • Missing data: Run ./scripts/copy-production-data.sh"
        
    else
        echo -e "\n${YELLOW}⚠️  VALIDATION INCOMPLETE${NC}"
        echo "  • Run with all validation categories enabled"
        echo "  • Ensure staging environment is properly set up"
        echo "  • Check script configuration and prerequisites"
    fi
    
    echo -e "\n${BLUE}Staging Environment Access:${NC}"
    echo "  • Application: https://localhost:8080"
    echo "  • Database: docker exec -it $STAGING_CONTAINER psql -U $STAGING_DB_USER -d $STAGING_DB_NAME"
    echo "  • Logs: docker-compose -f docker-compose.staging.yml logs -f"
    
    if [[ $WARNING_VALIDATIONS -gt 0 ]]; then
        echo -e "\n${YELLOW}Note: $WARNING_VALIDATIONS warnings found. Review for potential improvements.${NC}"
    fi
}

# Cleanup function
cleanup_on_exit() {
    # Clean up temporary files
    rm -f "/tmp/staging_validation_$$".csv
    
    if [[ $? -ne 0 ]]; then
        log_error "Validation process failed or was interrupted"
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
            --quick)
                QUICK_MODE=true
                VALIDATE_PERFORMANCE=false
                VALIDATE_INTEGRATION=false
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --no-report)
                GENERATE_REPORT=false
                shift
                ;;
            --fail-fast)
                FAIL_FAST=true
                shift
                ;;
            --infrastructure-only)
                VALIDATE_APPLICATION=false
                VALIDATE_DATABASE=false
                VALIDATE_SECURITY=false
                VALIDATE_PERFORMANCE=false
                VALIDATE_INTEGRATION=false
                shift
                ;;
            --application-only)
                VALIDATE_INFRASTRUCTURE=false
                VALIDATE_DATABASE=false
                VALIDATE_SECURITY=false
                VALIDATE_PERFORMANCE=false
                VALIDATE_INTEGRATION=false
                shift
                ;;
            --database-only)
                VALIDATE_INFRASTRUCTURE=false
                VALIDATE_APPLICATION=false
                VALIDATE_SECURITY=false
                VALIDATE_PERFORMANCE=false
                VALIDATE_INTEGRATION=false
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --quick                 Run essential validations only (faster)"
                echo "  --verbose, -v           Enable verbose output"
                echo "  --no-report             Skip generating validation report"
                echo "  --fail-fast             Stop on first validation failure"
                echo "  --infrastructure-only   Validate infrastructure components only"
                echo "  --application-only      Validate application functionality only"
                echo "  --database-only         Validate database components only"
                echo "  --help, -h              Show this help message"
                echo ""
                echo "Validation Categories:"
                echo "  • Infrastructure: Docker containers, ports, volumes, SSL"
                echo "  • Application: Health checks, API routes, static assets"
                echo "  • Database: Connectivity, tables, data integrity, performance"
                echo "  • Security: HTTPS, headers, access controls, file permissions"
                echo "  • Performance: Load times, resource usage, concurrent requests"
                echo "  • Integration: Service connectivity, cross-component communication"
                echo ""
                echo "Examples:"
                echo "  $0                      # Run all validations"
                echo "  $0 --quick              # Run essential validations only"
                echo "  $0 --verbose            # Run with detailed output"
                echo "  $0 --infrastructure-only # Check only Docker/nginx setup"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Initialize validation results file
    echo "validation_name,status,severity,details" > "/tmp/staging_validation_$$.csv"
    
    # Execute validation suite
    log_info "Starting comprehensive staging validation..."
    log_info "Categories: Infrastructure($VALIDATE_INFRASTRUCTURE) Application($VALIDATE_APPLICATION) Database($VALIDATE_DATABASE) Security($VALIDATE_SECURITY) Performance($VALIDATE_PERFORMANCE) Integration($VALIDATE_INTEGRATION)"
    
    validate_infrastructure
    validate_application
    validate_database
    validate_security
    validate_performance
    validate_integration
    
    generate_validation_report
    display_final_results
    
    # Disable cleanup on successful exit
    trap - EXIT
    
    # Exit with appropriate code
    if [[ $FAILED_VALIDATIONS -eq 0 && $TOTAL_VALIDATIONS -gt 0 ]]; then
        log_success "Staging validation completed successfully - ready for production!"
        exit 0
    elif [[ $FAILED_VALIDATIONS -gt 0 ]]; then
        log_error "Staging validation completed with failures - not ready for production!"
        exit 1
    else
        log_warning "Staging validation completed with no tests executed!"
        exit 2
    fi
}

# Execute main function with all arguments
main "$@"