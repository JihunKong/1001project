#!/bin/bash

# ============================================
# Health Monitoring Script for 1001 Stories
# ============================================
# Continuous monitoring and alerting system

SERVER_IP="3.128.143.122"
DOMAIN="1001stories.seedsofempowerment.org"
LOG_FILE="/tmp/1001stories-health-$(date +%Y%m%d).log"
ALERT_FILE="/tmp/1001stories-alerts.log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CHECK_INTERVAL=30  # seconds
MAX_FAILURES=3
TIMEOUT=10

# Counters
health_failures=0
db_failures=0
app_failures=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  1001 Stories Health Monitor          ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function: Log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function: Send alert
send_alert() {
    local severity=$1
    local message=$2
    local alert_msg="[$severity] $(date '+%Y-%m-%d %H:%M:%S') - $message"
    
    echo -e "${RED}🚨 ALERT: $alert_msg${NC}"
    echo "$alert_msg" >> "$ALERT_FILE"
    
    # You can extend this to send email/slack notifications
    # Example: curl -X POST -H 'Content-type: application/json' \
    #          --data "{\"text\":\"$alert_msg\"}" \
    #          YOUR_WEBHOOK_URL
}

# Function: Test web health endpoint
check_health_endpoint() {
    local url="http://$SERVER_IP/health"
    
    if timeout $TIMEOUT curl -f -s "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function: Test database endpoint
check_database_endpoint() {
    local url="http://$SERVER_IP/api/library/books"
    
    local response=$(timeout $TIMEOUT curl -s -w "%{http_code}" "$url" -o /dev/null 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Function: Test application responsiveness
check_app_responsiveness() {
    local url="http://$SERVER_IP/demo"
    
    if timeout $TIMEOUT curl -f -s "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function: Comprehensive health check
run_health_check() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local status_summary=""
    local all_healthy=true
    
    echo -e "\n${YELLOW}[$timestamp] Running health check...${NC}"
    
    # Health endpoint check
    if check_health_endpoint; then
        echo -e "${GREEN}✓ Health endpoint: OK${NC}"
        status_summary+="Health:OK "
        health_failures=0
    else
        echo -e "${RED}✗ Health endpoint: FAILED${NC}"
        status_summary+="Health:FAIL "
        ((health_failures++))
        all_healthy=false
        
        if [ $health_failures -ge $MAX_FAILURES ]; then
            send_alert "CRITICAL" "Health endpoint failed $health_failures times"
        fi
    fi
    
    # Database check
    if check_database_endpoint; then
        echo -e "${GREEN}✓ Database endpoint: OK${NC}"
        status_summary+="DB:OK "
        db_failures=0
    else
        echo -e "${RED}✗ Database endpoint: FAILED${NC}"
        status_summary+="DB:FAIL "
        ((db_failures++))
        all_healthy=false
        
        if [ $db_failures -ge $MAX_FAILURES ]; then
            send_alert "CRITICAL" "Database endpoint failed $db_failures times"
        fi
    fi
    
    # Application check
    if check_app_responsiveness; then
        echo -e "${GREEN}✓ Application: OK${NC}"
        status_summary+="App:OK"
        app_failures=0
    else
        echo -e "${RED}✗ Application: FAILED${NC}"
        status_summary+="App:FAIL"
        ((app_failures++))
        all_healthy=false
        
        if [ $app_failures -ge $MAX_FAILURES ]; then
            send_alert "CRITICAL" "Application failed $app_failures times"
        fi
    fi
    
    # Log status
    if [ "$all_healthy" = true ]; then
        log_message "ALL SYSTEMS OK - $status_summary"
    else
        log_message "ISSUES DETECTED - $status_summary"
    fi
    
    return $([ "$all_healthy" = true ] && echo 0 || echo 1)
}

# Function: Generate status report
generate_status_report() {
    echo -e "\n${BLUE}=== Status Report ===${NC}"
    echo -e "${YELLOW}Server: $SERVER_IP${NC}"
    echo -e "${YELLOW}Domain: $DOMAIN${NC}"
    echo -e "${YELLOW}Last check: $(date)${NC}"
    echo -e "${YELLOW}Log file: $LOG_FILE${NC}"
    
    if [ -f "$ALERT_FILE" ]; then
        local alert_count=$(wc -l < "$ALERT_FILE")
        echo -e "${YELLOW}Total alerts: $alert_count${NC}"
        
        if [ $alert_count -gt 0 ]; then
            echo -e "\n${RED}Recent alerts:${NC}"
            tail -5 "$ALERT_FILE"
        fi
    fi
    
    echo -e "\n${YELLOW}Failure counts:${NC}"
    echo -e "Health endpoint: $health_failures"
    echo -e "Database: $db_failures"
    echo -e "Application: $app_failures"
    
    if [ -f "$LOG_FILE" ]; then
        echo -e "\n${YELLOW}Recent log entries:${NC}"
        tail -10 "$LOG_FILE"
    fi
}

# Function: Monitor continuously
start_monitoring() {
    echo -e "${GREEN}Starting continuous monitoring...${NC}"
    echo -e "${YELLOW}Check interval: ${CHECK_INTERVAL}s${NC}"
    echo -e "${YELLOW}Max failures before alert: $MAX_FAILURES${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"
    
    log_message "Health monitoring started"
    
    while true; do
        if run_health_check; then
            # All systems OK - just show a dot
            echo -n "."
        else
            # Issues detected - show status
            echo ""
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Function: Quick status check
quick_status() {
    echo -e "${YELLOW}Running quick status check...${NC}"
    run_health_check
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All systems operational${NC}"
    else
        echo -e "\n${RED}⚠️  Issues detected${NC}"
        echo -e "${YELLOW}Run with 'detailed' for more information${NC}"
    fi
}

# Function: Detailed diagnostics
detailed_diagnostics() {
    echo -e "${YELLOW}Running detailed diagnostics...${NC}\n"
    
    # Basic connectivity
    echo -e "${BLUE}=== Connectivity Tests ===${NC}"
    
    echo -n "Testing server connectivity... "
    if ping -c 1 -W 5 "$SERVER_IP" > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
    
    echo -n "Testing HTTP port 80... "
    if timeout 5 nc -z "$SERVER_IP" 80 2>/dev/null; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
    
    echo -n "Testing HTTPS port 443... "
    if timeout 5 nc -z "$SERVER_IP" 443 2>/dev/null; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
    
    # HTTP response analysis
    echo -e "\n${BLUE}=== HTTP Response Analysis ===${NC}"
    
    for endpoint in "/health" "/demo" "/api/library/books"; do
        echo -e "\nTesting $endpoint:"
        
        local response=$(timeout 10 curl -s -w "\nSTATUS_CODE:%{http_code}\nTIME_TOTAL:%{time_total}\nTIME_CONNECT:%{time_connect}" "http://$SERVER_IP$endpoint" 2>/dev/null)
        
        local status_code=$(echo "$response" | grep "STATUS_CODE:" | cut -d: -f2)
        local time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)
        local time_connect=$(echo "$response" | grep "TIME_CONNECT:" | cut -d: -f2)
        
        if [ "$status_code" = "200" ]; then
            echo -e "  Status: ${GREEN}$status_code OK${NC}"
        else
            echo -e "  Status: ${RED}$status_code FAILED${NC}"
        fi
        
        echo "  Response time: ${time_total}s"
        echo "  Connect time: ${time_connect}s"
        
        if [ "$endpoint" = "/health" ] && [ "$status_code" = "200" ]; then
            local content=$(echo "$response" | head -n -3)
            echo "  Content: $content"
        fi
    done
    
    # Domain check
    echo -e "\n${BLUE}=== Domain Resolution ===${NC}"
    if nslookup "$DOMAIN" > /dev/null 2>&1; then
        echo -e "Domain resolution: ${GREEN}OK${NC}"
        local domain_ip=$(nslookup "$DOMAIN" | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -n1)
        echo "Domain IP: $domain_ip"
        if [ "$domain_ip" = "$SERVER_IP" ]; then
            echo -e "IP match: ${GREEN}OK${NC}"
        else
            echo -e "IP match: ${YELLOW}Different (Domain: $domain_ip, Expected: $SERVER_IP)${NC}"
        fi
    else
        echo -e "Domain resolution: ${RED}FAILED${NC}"
    fi
}

# Function: Auto-recovery attempt
attempt_auto_recovery() {
    echo -e "${YELLOW}Attempting automatic recovery...${NC}"
    
    log_message "Auto-recovery initiated"
    
    # Check if we can run the recovery script
    if [ -f "/Users/jihunkong/1001project/1001-stories/scripts/remote-recovery.sh" ]; then
        echo -e "${YELLOW}Running remote recovery script...${NC}"
        /Users/jihunkong/1001project/1001-stories/scripts/remote-recovery.sh full
        
        # Wait and retest
        echo -e "${YELLOW}Waiting 60 seconds for recovery to complete...${NC}"
        sleep 60
        
        if run_health_check; then
            log_message "Auto-recovery successful"
            send_alert "INFO" "Auto-recovery completed successfully"
            echo -e "${GREEN}✓ Auto-recovery successful${NC}"
            return 0
        else
            log_message "Auto-recovery failed"
            send_alert "CRITICAL" "Auto-recovery failed - manual intervention required"
            echo -e "${RED}✗ Auto-recovery failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}Recovery script not found${NC}"
        return 1
    fi
}

# Main execution
main() {
    case "${1:-status}" in
        monitor)
            start_monitoring
            ;;
        status)
            quick_status
            ;;
        detailed)
            detailed_diagnostics
            ;;
        report)
            generate_status_report
            ;;
        recover)
            attempt_auto_recovery
            ;;
        test)
            echo -e "${YELLOW}Running single health check...${NC}"
            run_health_check
            ;;
        *)
            echo "Usage: $0 {monitor|status|detailed|report|recover|test}"
            echo ""
            echo "Commands:"
            echo "  monitor   - Start continuous monitoring (Ctrl+C to stop)"
            echo "  status    - Quick status check"
            echo "  detailed  - Detailed diagnostics"
            echo "  report    - Generate status report"
            echo "  recover   - Attempt automatic recovery"
            echo "  test      - Single health check"
            echo ""
            echo "Files:"
            echo "  Log file: $LOG_FILE"
            echo "  Alert file: $ALERT_FILE"
            exit 1
            ;;
    esac
}

# Trap Ctrl+C for clean exit
trap 'echo -e "\n${YELLOW}Monitoring stopped by user${NC}"; log_message "Monitoring stopped"; exit 0' INT

# Run main function
main "$@"