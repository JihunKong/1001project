#!/bin/bash

# 1001 Stories Production Health Check Script
# 서버 상태를 모니터링하고 알림을 전송하는 스크립트

set -e

# 설정 변수
SITE_URL="https://1001stories.seedsofempowerment.org"
HEALTH_ENDPOINT="/api/health"
MAX_RESPONSE_TIME=5000  # 최대 응답 시간 (ms)
LOG_FILE="/var/log/1001stories-health.log"
ALERT_EMAIL="admin@1001stories.org"

# 컬러 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로깅 함수
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo -e "$1"
}

# 헬스 체크 함수
health_check() {
    local start_time=$(date +%s%N)
    
    # HTTP 상태 코드 확인
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL$HEALTH_ENDPOINT")
    local curl_exit_code=$?
    
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ $curl_exit_code -ne 0 ]; then
        log "${RED}CRITICAL: Site is completely down - curl failed with exit code $curl_exit_code${NC}"
        send_alert "CRITICAL" "Site is completely down" "Curl failed with exit code $curl_exit_code"
        return 1
    fi
    
    if [ "$http_status" != "200" ]; then
        log "${RED}ERROR: Health check failed - HTTP $http_status${NC}"
        send_alert "ERROR" "Health check failed" "HTTP status: $http_status"
        return 1
    fi
    
    if [ $response_time -gt $MAX_RESPONSE_TIME ]; then
        log "${YELLOW}WARNING: Slow response time - ${response_time}ms${NC}"
        send_alert "WARNING" "Slow response time" "Response time: ${response_time}ms"
    fi
    
    log "${GREEN}OK: Site is healthy - HTTP $http_status, Response time: ${response_time}ms${NC}"
    return 0
}

# 데이터베이스 연결 확인
db_check() {
    # API를 통한 데이터베이스 연결 확인
    local db_status=$(curl -s "$SITE_URL/api/health" | grep -o '"database":"[^"]*' | cut -d'"' -f4 2>/dev/null || echo "unknown")
    
    if [ "$db_status" = "healthy" ] || [ "$db_status" = "connected" ]; then
        log "${GREEN}OK: Database connection healthy${NC}"
        return 0
    else
        log "${RED}ERROR: Database connection issue - Status: $db_status${NC}"
        send_alert "ERROR" "Database connection issue" "Status: $db_status"
        return 1
    fi
}

# SSL 인증서 확인
ssl_check() {
    local ssl_expiry=$(echo | openssl s_client -servername $(echo $SITE_URL | sed 's|https://||') -connect $(echo $SITE_URL | sed 's|https://||'):443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -n "$ssl_expiry" ]; then
        local expiry_timestamp=$(date -d "$ssl_expiry" +%s 2>/dev/null)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -lt 30 ]; then
            log "${YELLOW}WARNING: SSL certificate expires in $days_until_expiry days${NC}"
            send_alert "WARNING" "SSL certificate expiring soon" "Expires in $days_until_expiry days"
        else
            log "${GREEN}OK: SSL certificate valid for $days_until_expiry days${NC}"
        fi
    else
        log "${RED}ERROR: Could not check SSL certificate${NC}"
    fi
}

# 알림 전송 함수
send_alert() {
    local severity=$1
    local title=$2
    local message=$3
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 이메일 알림 (실제 환경에서는 sendmail, postfix, 또는 AWS SES 사용)
    if command -v mail >/dev/null 2>&1; then
        echo -e "Time: $timestamp\nSeverity: $severity\nTitle: $title\nMessage: $message\n\nSite: $SITE_URL" | \
        mail -s "[$severity] 1001 Stories Alert: $title" "$ALERT_EMAIL"
    fi
    
    # Slack 웹훅 (선택사항 - 웹훅 URL이 설정된 경우)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="good"
        case $severity in
            "CRITICAL"|"ERROR") color="danger" ;;
            "WARNING") color="warning" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"$title\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$timestamp\", \"short\": true},
                        {\"title\": \"Site\", \"value\": \"$SITE_URL\", \"short\": false}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# 시스템 리소스 확인 (서버에서 실행시)
system_check() {
    if [ -f /proc/meminfo ] && [ -f /proc/loadavg ]; then
        local memory_usage=$(free | awk '/^Mem:/{printf "%.1f", $3/$2 * 100.0}')
        local load_avg=$(cut -d' ' -f1 /proc/loadavg)
        
        log "System: Memory usage: ${memory_usage}%, Load average: ${load_avg}"
        
        # 메모리 사용량이 90% 이상이면 경고
        if (( $(echo "$memory_usage > 90" | bc -l) )); then
            send_alert "WARNING" "High memory usage" "Memory usage: ${memory_usage}%"
        fi
    fi
}

# 메인 실행 함수
main() {
    log "=== 1001 Stories Health Check Started ==="
    
    local all_checks_passed=true
    
    # 기본 헬스 체크
    if ! health_check; then
        all_checks_passed=false
    fi
    
    # 데이터베이스 체크
    if ! db_check; then
        all_checks_passed=false
    fi
    
    # SSL 체크
    ssl_check
    
    # 시스템 리소스 체크 (서버에서만)
    system_check
    
    if $all_checks_passed; then
        log "${GREEN}=== All checks passed ===${NC}"
        exit 0
    else
        log "${RED}=== Some checks failed ===${NC}"
        exit 1
    fi
}

# 스크립트 실행
main "$@"