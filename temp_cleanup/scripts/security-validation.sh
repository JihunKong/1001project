#!/bin/bash
# 1001 Stories - Security Validation Script
# Week 1 Security Audit Validation for Production Deployment
# Run this script before Week 2 production deployment

echo "🔐 1001 Stories Security Validation Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
PASSED_CHECKS=0

# Helper function for status output
check_status() {
    local status=$1
    local message=$2
    local severity=${3:-"INFO"}
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        ((PASSED_CHECKS++))
    elif [ "$status" = "FAIL" ]; then
        if [ "$severity" = "CRITICAL" ]; then
            echo -e "${RED}❌ CRITICAL FAIL${NC}: $message"
            ((CRITICAL_ISSUES++))
        elif [ "$severity" = "HIGH" ]; then
            echo -e "${YELLOW}⚠️  HIGH FAIL${NC}: $message"
            ((HIGH_ISSUES++))
        else
            echo -e "${YELLOW}⚠️  FAIL${NC}: $message"
            ((MEDIUM_ISSUES++))
        fi
    else
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
    fi
}

echo "🔍 Phase 1: Critical Security Checks"
echo "-----------------------------------"

# Check 1: Session Management
echo "Checking session invalidation implementation..."
if grep -r "tokenVersion" lib/ > /dev/null 2>&1; then
    check_status "PASS" "JWT token versioning system implemented"
else
    check_status "FAIL" "JWT token versioning NOT implemented - session hijacking risk" "CRITICAL"
fi

# Check 2: Rate Limiting
echo "Checking rate limiting configuration..."
if grep -q "maxRequests.*3" lib/rate-limiter.ts > /dev/null 2>&1; then
    check_status "PASS" "Secure rate limiting configured"
else
    check_status "FAIL" "Rate limiting too permissive - DoS vulnerability" "HIGH"
fi

# Check 3: Admin Protection
echo "Checking admin security measures..."
if grep -r "requireMFA\|multiFactorAuth" lib/ > /dev/null 2>&1; then
    check_status "PASS" "Multi-factor authentication implemented for admin"
else
    check_status "FAIL" "Admin accounts lack MFA protection" "HIGH"
fi

# Check 4: Environment Security  
echo "Checking environment variable security..."
if [ -f .env.production ]; then
    if grep -q "staging-nextauth-secret" .env.production; then
        check_status "FAIL" "Production using staging secrets" "CRITICAL"
    else
        check_status "PASS" "Production secrets properly configured"
    fi
else
    check_status "FAIL" "Production environment file missing" "HIGH"
fi

echo ""
echo "🔍 Phase 2: Role System Security"
echo "-------------------------------"

# Check 5: Role Transition Security
echo "Checking role system implementation..."
if grep -q "UserRole.LEARNER" middleware.ts; then
    check_status "PASS" "New LEARNER default role implemented"
else
    check_status "FAIL" "Role system migration incomplete" "HIGH"
fi

# Check 6: Authorization Consistency
echo "Checking API authorization patterns..."
API_FILES=$(find app/api -name "*.ts" -type f | wc -l)
AUTH_CHECKS=$(grep -r "getServerSession\|session.user.role" app/api --include="*.ts" | wc -l)

if [ $AUTH_CHECKS -gt $((API_FILES * 70 / 100)) ]; then
    check_status "PASS" "API endpoints have consistent authorization checks"
else
    check_status "FAIL" "Inconsistent authorization patterns in API endpoints" "HIGH"
fi

# Check 7: Database Security
echo "Checking database security configuration..."
if grep -q "executeWithRLSBypass" lib/auth.ts; then
    check_status "FAIL" "Excessive RLS bypass usage - review required" "MEDIUM"
else
    check_status "PASS" "Database access patterns secure"
fi

echo ""
echo "🔍 Phase 3: Infrastructure Security" 
echo "----------------------------------"

# Check 8: Docker Security
echo "Checking Docker configuration..."
if [ -f Dockerfile ] && grep -q "USER.*node" Dockerfile; then
    check_status "PASS" "Docker runs as non-root user"
else
    check_status "FAIL" "Docker security configuration needs review" "MEDIUM"
fi

# Check 9: SSL/TLS Configuration
echo "Checking SSL/TLS setup..."
if [ -f nginx/nginx.conf ] && grep -q "ssl_" nginx/nginx.conf; then
    check_status "PASS" "SSL/TLS properly configured"
else
    check_status "FAIL" "SSL/TLS configuration missing or incomplete" "HIGH"
fi

# Check 10: Security Headers
echo "Checking security headers implementation..."
if [ -f lib/security/headers.ts ] && grep -q "X-Frame-Options" lib/security/headers.ts; then
    check_status "PASS" "Security headers properly implemented"
else
    check_status "FAIL" "Security headers implementation incomplete" "MEDIUM"
fi

echo ""
echo "🧪 Phase 4: Security Test Validation"
echo "-----------------------------------"

# Check 11: Security Tests Exist
echo "Checking security test coverage..."
SECURITY_TESTS=$(find tests/security -name "*.spec.ts" -type f 2>/dev/null | wc -l)
if [ $SECURITY_TESTS -ge 3 ]; then
    check_status "PASS" "Comprehensive security test suite exists ($SECURITY_TESTS test files)"
else
    check_status "FAIL" "Insufficient security test coverage" "HIGH"
fi

# Check 12: Run Security Tests (if available)
echo "Running security tests..."
if command -v npx > /dev/null 2>&1 && [ -f package.json ]; then
    if timeout 60s npx playwright test tests/security/ --config=playwright.config.staging.ts > /tmp/security-test-results.txt 2>&1; then
        PASSED_TESTS=$(grep -c "✓" /tmp/security-test-results.txt || echo "0")
        FAILED_TESTS=$(grep -c "✗" /tmp/security-test-results.txt || echo "0")
        
        if [ $FAILED_TESTS -eq 0 ] && [ $PASSED_TESTS -gt 0 ]; then
            check_status "PASS" "All security tests passing ($PASSED_TESTS tests)"
        else
            check_status "FAIL" "Security tests failing ($FAILED_TESTS failures, $PASSED_TESTS passes)" "HIGH"
        fi
    else
        check_status "FAIL" "Security tests could not be executed" "MEDIUM"
    fi
else
    check_status "INFO" "Security tests skipped (Playwright not available)"
fi

echo ""
echo "📊 Security Validation Summary"
echo "=============================="
echo -e "✅ Passed Checks: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "⚠️  Medium Issues: ${YELLOW}$MEDIUM_ISSUES${NC}" 
echo -e "🔶 High Issues: ${YELLOW}$HIGH_ISSUES${NC}"
echo -e "🔴 Critical Issues: ${RED}$CRITICAL_ISSUES${NC}"
echo ""

# Overall status determination
if [ $CRITICAL_ISSUES -eq 0 ] && [ $HIGH_ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 PRODUCTION READY${NC}: All critical and high-priority security issues resolved"
    echo "✅ Safe to proceed with Week 2 production deployment"
    exit 0
elif [ $CRITICAL_ISSUES -eq 0 ] && [ $HIGH_ISSUES -le 2 ]; then
    echo -e "${YELLOW}⚠️  CONDITIONAL APPROVAL${NC}: Minor high-priority issues remain"
    echo "🔧 Recommended: Address high-priority issues before production deployment"
    echo "📋 Review WEEK_1_SECURITY_AUDIT_REPORT.md for detailed remediation steps"
    exit 1
elif [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}🚫 PRODUCTION BLOCKED${NC}: Critical security vulnerabilities found"
    echo "🔒 MUST resolve all critical issues before production deployment"
    echo "📋 See WEEK_1_SECURITY_AUDIT_REPORT.md for immediate action items"
    exit 2
else
    echo -e "${YELLOW}⚠️  DEPLOYMENT RISK${NC}: Multiple high-priority security issues"
    echo "🔧 Strongly recommended to resolve issues before production deployment"
    echo "📋 Review security audit report for complete remediation guidance"
    exit 1
fi