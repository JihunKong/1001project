#!/bin/bash

# SECURITY MONITORING SCRIPT
# Monitors for security violations and suspicious activity

LOG_FILE="/var/log/1001-stories-security.log"
ALERT_EMAIL="security@1001stories.org"

echo "$(date): Starting security monitoring..." >> $LOG_FILE

# Monitor for hardcoded credentials
check_hardcoded_credentials() {
    echo "Checking for hardcoded credentials..."
    VIOLATIONS=$(grep -r "password_123\|stories_password" /opt/1001-stories --exclude-dir=node_modules 2>/dev/null | wc -l)

    if [ $VIOLATIONS -gt 0 ]; then
        echo "$(date): CRITICAL - Hardcoded credentials found: $VIOLATIONS instances" >> $LOG_FILE
        # Send alert
        echo "CRITICAL SECURITY ALERT: Hardcoded credentials detected in 1001 Stories" | \
            mail -s "SECURITY ALERT - Hardcoded Credentials" $ALERT_EMAIL
    fi
}

# Monitor failed login attempts
check_failed_logins() {
    echo "Checking failed login attempts..."
    FAILED_LOGINS=$(grep "Failed login attempt" /var/log/1001-stories.log | tail -n 100 | wc -l)

    if [ $FAILED_LOGINS -gt 50 ]; then
        echo "$(date): HIGH - Excessive failed logins: $FAILED_LOGINS attempts" >> $LOG_FILE
        # Send alert for potential brute force
        echo "HIGH SECURITY ALERT: Excessive failed login attempts detected" | \
            mail -s "SECURITY ALERT - Brute Force Attack" $ALERT_EMAIL
    fi
}

# Monitor database connections
check_database_security() {
    echo "Checking database security..."

    # Check for RLS bypass usage
    RLS_BYPASSES=$(grep "RLS BYPASS USED" /var/log/1001-stories.log | tail -n 24 | wc -l)

    if [ $RLS_BYPASSES -gt 10 ]; then
        echo "$(date): HIGH - Excessive RLS bypasses: $RLS_BYPASSES in last 24h" >> $LOG_FILE
        echo "HIGH SECURITY ALERT: Excessive RLS bypass usage detected" | \
            mail -s "SECURITY ALERT - RLS Bypass Abuse" $ALERT_EMAIL
    fi
}

# Monitor for suspicious file access
check_file_access() {
    echo "Checking suspicious file access..."

    # Look for directory traversal attempts
    TRAVERSAL_ATTEMPTS=$(grep -E "\.\./|\.\.\\" /var/log/nginx/access.log | tail -n 100 | wc -l)

    if [ $TRAVERSAL_ATTEMPTS -gt 0 ]; then
        echo "$(date): HIGH - Directory traversal attempts: $TRAVERSAL_ATTEMPTS" >> $LOG_FILE
        echo "HIGH SECURITY ALERT: Directory traversal attacks detected" | \
            mail -s "SECURITY ALERT - Path Traversal" $ALERT_EMAIL
    fi
}

# Monitor rate limiting violations
check_rate_limits() {
    echo "Checking rate limiting..."

    RATE_LIMIT_HITS=$(grep "Rate limit exceeded" /var/log/1001-stories.log | tail -n 100 | wc -l)

    if [ $RATE_LIMIT_HITS -gt 20 ]; then
        echo "$(date): MEDIUM - Rate limit violations: $RATE_LIMIT_HITS" >> $LOG_FILE
    fi
}

# Run all checks
check_hardcoded_credentials
check_failed_logins
check_database_security
check_file_access
check_rate_limits

echo "$(date): Security monitoring completed" >> $LOG_FILE