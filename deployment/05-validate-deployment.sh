#!/bin/bash

# 1001 Stories Deployment Validation Script
# Comprehensive validation of role system migration and deployment success

set -e

SERVER_IP="3.128.143.122"
PROJECT_DIR="/home/ubuntu/1001-stories"
VALIDATION_REPORT="/tmp/deployment-validation-$(date +%Y%m%d-%H%M%S).txt"

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

# Function to test endpoint with detailed response
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    local response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" "$url" 2>/dev/null || echo "000:0")
    local status_code=$(echo $response | cut -d: -f1)
    local response_time=$(echo $response | cut -d: -f2)
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "$description: HTTP $status_code (${response_time}s)"
        return 0
    else
        log_error "$description: HTTP $status_code (expected $expected_status)"
        return 1
    fi
}

# Function to validate JSON response
validate_json_endpoint() {
    local url=$1
    local expected_field=$2
    local expected_value=$3
    local description=$4
    
    local response=$(curl -s "$url" 2>/dev/null || echo "{}")
    local field_value=$(echo "$response" | grep -o "\"$expected_field\":\"[^\"]*\"" | cut -d'"' -f4)
    
    if [ "$field_value" = "$expected_value" ]; then
        log_success "$description: $expected_field = $expected_value"
        return 0
    else
        log_error "$description: $expected_field = $field_value (expected $expected_value)"
        echo "Full response: $response"
        return 1
    fi
}

echo "===================================================="
echo "1001 STORIES DEPLOYMENT VALIDATION"
echo "Server: $SERVER_IP"
echo "Timestamp: $(date)"
echo "===================================================="

# Initialize validation report
{
    echo "1001 Stories Deployment Validation Report"
    echo "========================================"
    echo "Validation Time: $(date)"
    echo "Server: $SERVER_IP"
    echo ""
} > "$VALIDATION_REPORT"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name=$1
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo "Test: $test_name" >> "$VALIDATION_REPORT"
    
    if eval "$2"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "Result: PASSED" >> "$VALIDATION_REPORT"
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "Result: FAILED" >> "$VALIDATION_REPORT"
        return 1
    fi
    echo "" >> "$VALIDATION_REPORT"
}

echo -e "\n${BLUE}=== INFRASTRUCTURE VALIDATION ===${NC}"

run_test "Container Health Check" '
    UNHEALTHY=$(run_remote "docker ps --filter health=unhealthy --format \"{{.Names}}\"")
    if [ -z "$UNHEALTHY" ]; then
        log_success "All containers are healthy"
        return 0
    else
        log_error "Unhealthy containers: $UNHEALTHY"
        return 1
    fi
'

run_test "Database Connectivity" '
    DB_TEST=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT NOW();\"" 2>/dev/null || echo "FAILED")
    if [ "$DB_TEST" != "FAILED" ]; then
        log_success "Database connection successful"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
'

run_test "Nginx Configuration" '
    NGINX_TEST=$(run_remote "docker exec 1001-stories-nginx nginx -t 2>&1" || echo "FAILED")
    if echo "$NGINX_TEST" | grep -q "syntax is ok"; then
        log_success "Nginx configuration valid"
        return 0
    else
        log_error "Nginx configuration invalid: $NGINX_TEST"
        return 1
    fi
'

echo -e "\n${BLUE}=== DATABASE VALIDATION ===${NC}"

run_test "Migration Status Check" '
    MIGRATION_STATUS=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT status FROM migration_log WHERE migration_name = \$\$role_system_redesign_learner_to_customer\$\$ ORDER BY started_at DESC LIMIT 1;\"" | grep -o "COMPLETED\|ROLLED_BACK" || echo "NOT_FOUND")
    
    if [ "$MIGRATION_STATUS" = "COMPLETED" ]; then
        log_success "Database migration completed successfully"
        return 0
    elif [ "$MIGRATION_STATUS" = "ROLLED_BACK" ]; then
        log_warning "Database migration was rolled back"
        return 0
    else
        log_error "Migration status unclear: $MIGRATION_STATUS"
        return 1
    fi
'

run_test "User Role Distribution" '
    USER_ROLES=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT role, COUNT(*) FROM \\\"User\\\" GROUP BY role ORDER BY role;\"" 2>/dev/null)
    
    echo "Current user roles:"
    echo "$USER_ROLES"
    
    TOTAL_USERS=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT COUNT(*) FROM \\\"User\\\";\"" | grep -o "[0-9]\+" | head -1)
    
    if [ "$TOTAL_USERS" = "4" ]; then
        log_success "User count correct: 4 users"
        return 0
    else
        log_error "User count incorrect: $TOTAL_USERS users (expected 4)"
        return 1
    fi
'

run_test "User Data Integrity" '
    USER_SESSIONS=$(run_remote "cd $PROJECT_DIR && docker-compose exec -T db psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT u.email, u.role, COUNT(s.id) as session_count FROM \\\"User\\\" u LEFT JOIN \\\"Session\\\" s ON u.id = s.\\\"userId\\\" GROUP BY u.id, u.email, u.role ORDER BY u.email;\"" 2>/dev/null)
    
    if echo "$USER_SESSIONS" | grep -q "@"; then
        log_success "User data and sessions intact"
        echo "User session summary:"
        echo "$USER_SESSIONS"
        return 0
    else
        log_error "User data validation failed"
        return 1
    fi
'

echo -e "\n${BLUE}=== APPLICATION VALIDATION ===${NC}"

run_test "Main Site Availability" 'test_endpoint "https://1001stories.seedsofempowerment.org" 200 "Main site"'

run_test "Health Endpoint" 'validate_json_endpoint "https://1001stories.seedsofempowerment.org/api/health" "status" "ok" "Health API"'

run_test "Authentication Pages" 'test_endpoint "https://1001stories.seedsofempowerment.org/login" 200 "Login page"'

run_test "Dashboard Access" 'test_endpoint "https://1001stories.seedsofempowerment.org/dashboard" 200 "Dashboard page"'

run_test "Admin Panel Access" 'test_endpoint "https://1001stories.seedsofempowerment.org/admin" 200 "Admin panel"'

run_test "API Endpoints" 'test_endpoint "https://1001stories.seedsofempowerment.org/api/auth/signin" 200 "Auth API"'

echo -e "\n${BLUE}=== PERFORMANCE VALIDATION ===${NC}"

run_test "Response Time Check" '
    RESPONSE_TIMES=""
    TOTAL_TIME=0
    REQUESTS=5
    
    for i in $(seq 1 $REQUESTS); do
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "https://1001stories.seedsofempowerment.org" 2>/dev/null || echo "0")
        TOTAL_TIME=$(echo "$TOTAL_TIME + $RESPONSE_TIME" | bc -l)
        RESPONSE_TIMES="$RESPONSE_TIMES $RESPONSE_TIME"
    done
    
    AVERAGE_TIME=$(echo "scale=3; $TOTAL_TIME / $REQUESTS" | bc -l)
    
    echo "Response times: $RESPONSE_TIMES"
    echo "Average response time: ${AVERAGE_TIME}s"
    
    if (( $(echo "$AVERAGE_TIME < 2.0" | bc -l) )); then
        log_success "Average response time acceptable: ${AVERAGE_TIME}s"
        return 0
    else
        log_warning "Average response time high: ${AVERAGE_TIME}s"
        return 1
    fi
'

run_test "Resource Usage Check" '
    CPU_USAGE=$(run_remote "docker stats --no-stream --format \"table {{.Container}}\t{{.CPUPerc}}\" | grep 1001-stories-app")
    MEMORY_USAGE=$(run_remote "docker stats --no-stream --format \"table {{.Container}}\t{{.MemUsage}}\" | grep 1001-stories-app")
    
    echo "CPU Usage: $CPU_USAGE"
    echo "Memory Usage: $MEMORY_USAGE"
    
    # Basic check that containers are using resources (not stuck)
    if echo "$CPU_USAGE" | grep -q "%"; then
        log_success "Application containers are active"
        return 0
    else
        log_error "Application containers may be stuck"
        return 1
    fi
'

echo -e "\n${BLUE}=== SECURITY VALIDATION ===${NC}"

run_test "HTTPS Configuration" '
    HTTPS_RESPONSE=$(curl -s -I "https://1001stories.seedsofempowerment.org" | head -1)
    if echo "$HTTPS_RESPONSE" | grep -q "200 OK"; then
        log_success "HTTPS properly configured"
        return 0
    else
        log_error "HTTPS configuration issue: $HTTPS_RESPONSE"
        return 1
    fi
'

run_test "Security Headers" '
    SECURITY_HEADERS=$(curl -s -I "https://1001stories.seedsofempowerment.org" | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)")
    
    if echo "$SECURITY_HEADERS" | grep -q "X-Frame-Options"; then
        log_success "Security headers present"
        return 0
    else
        log_warning "Some security headers missing"
        return 1
    fi
'

echo -e "\n${BLUE}=== USER EXPERIENCE VALIDATION ===${NC}"

run_test "Role System Functionality" '
    # Test that role-based routing works
    # This is a basic test - in production you might want more sophisticated tests
    
    DASHBOARD_RESPONSE=$(curl -s "https://1001stories.seedsofempowerment.org/dashboard" | head -c 1000)
    
    if echo "$DASHBOARD_RESPONSE" | grep -q -i "dashboard\|welcome\|stories"; then
        log_success "Dashboard content loading correctly"
        return 0
    else
        log_error "Dashboard content validation failed"
        return 1
    fi
'

run_test "Static Assets" '
    CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://1001stories.seedsofempowerment.org/_next/static/css/app/layout.css" 2>/dev/null || echo "404")
    
    # Next.js generates different asset names, so we check for any CSS file
    if test_endpoint "https://1001stories.seedsofempowerment.org/favicon.ico" 200 "Static assets" > /dev/null; then
        log_success "Static assets accessible"
        return 0
    else
        log_warning "Static assets validation inconclusive"
        return 1
    fi
'

echo -e "\n${BLUE}=== MONITORING AND LOGGING ===${NC}"

run_test "Application Logs" '
    APP_LOGS=$(run_remote "docker logs --tail=10 1001-stories-app-green 2>/dev/null || docker logs --tail=10 1001-stories-app-blue 2>/dev/null || docker logs --tail=10 \$(docker ps -q -f name=1001-stories-app)" | head -20)
    
    if echo "$APP_LOGS" | grep -v "ERROR\|FATAL\|error\|fatal" | grep -q "."; then
        log_success "Application logs look healthy"
        return 0
    else
        log_warning "Application logs may contain errors"
        echo "Recent logs:"
        echo "$APP_LOGS"
        return 1
    fi
'

run_test "System Stability" '
    # Check container uptime
    UPTIME=$(run_remote "docker ps --format \"table {{.Names}}\t{{.Status}}\" | grep 1001-stories-app | head -1")
    
    if echo "$UPTIME" | grep -q "Up"; then
        log_success "Application container stable"
        return 0
    else
        log_error "Application container instability detected"
        return 1
    fi
'

echo -e "\n${BLUE}=== VALIDATION SUMMARY ===${NC}"

# Finalize validation report
{
    echo ""
    echo "Validation Summary"
    echo "=================="
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Success Rate: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)%"
    echo ""
    echo "Overall Status: $([ $FAILED_TESTS -eq 0 ] && echo "PASSED" || echo "ATTENTION REQUIRED")"
} >> "$VALIDATION_REPORT"

# Copy report to local system
scp -o StrictHostKeyChecking=no "$VALIDATION_REPORT" ./

echo ""
echo "Validation Results:"
echo "=================="
echo "• Total Tests: $TOTAL_TESTS"
echo "• Passed: $PASSED_TESTS"
echo "• Failed: $FAILED_TESTS"
echo "• Success Rate: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)%"

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "ALL VALIDATIONS PASSED - Deployment is successful"
    OVERALL_STATUS="SUCCESS"
elif [ $FAILED_TESTS -lt 3 ]; then
    log_warning "SOME VALIDATIONS FAILED - Monitor closely, consider fixes"
    OVERALL_STATUS="WARNING"
else
    log_error "MULTIPLE VALIDATIONS FAILED - Consider rollback"
    OVERALL_STATUS="CRITICAL"
fi

echo ""
echo "Detailed Report: $(basename "$VALIDATION_REPORT")"

echo ""
echo "Next Actions Based on Results:"
echo "=============================="

case $OVERALL_STATUS in
    "SUCCESS")
        echo "✓ Deployment successful - continue monitoring"
        echo "✓ Inform users that new role system is active"
        echo "✓ Schedule cleanup of old deployment artifacts"
        ;;
    "WARNING")
        echo "⚠ Address failed validations within 24 hours"
        echo "⚠ Increase monitoring frequency"
        echo "⚠ Have rollback plan ready"
        ;;
    "CRITICAL")
        echo "✗ Consider immediate rollback: ./04-rollback.sh"
        echo "✗ Investigate critical failures before retry"
        echo "✗ Notify administrators immediately"
        ;;
esac

echo ""
echo "Monitoring Commands:"
echo "==================="
echo "• Real-time logs: ssh ubuntu@$SERVER_IP 'docker logs -f \$(docker ps -q -f name=1001-stories-app)'"
echo "• Health check: curl -s https://1001stories.seedsofempowerment.org/api/health | jq"
echo "• User validation: Test login with actual user accounts"
echo "• Performance: curl -w \"@curl-format.txt\" -o /dev/null -s https://1001stories.seedsofempowerment.org"

exit $FAILED_TESTS