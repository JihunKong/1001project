#!/bin/bash

# ============================================
# 1001 Stories Monitoring Script
# ============================================

set -euo pipefail

# Configuration
PROJECT_DIR="/opt/1001-stories"
DOMAIN="1001stories.seedsofempowerment.org"
LOG_FILE="/var/log/1001-stories-monitor.log"
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

# Send alert notification
send_alert() {
    local message="$1"
    local severity="${2:-warning}"
    
    # Log the alert
    log_error "ALERT: $message"
    
    # Send email if configured
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "1001 Stories Alert - $severity" "$ALERT_EMAIL"
    fi
    
    # Send Slack notification if configured
    if [[ -n "$SLACK_WEBHOOK" ]] && command -v curl &> /dev/null; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 1001 Stories Alert\\n$message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

# Check Docker services
check_docker_services() {
    log_info "Checking Docker services..."
    
    cd $PROJECT_DIR
    
    local failed_services=0
    
    # Check if docker-compose is running
    if ! docker-compose ps | grep -q "Up"; then
        send_alert "No Docker services are running" "critical"
        return 1
    fi
    
    # Check each service
    for service in app nginx postgres; do
        if docker-compose ps $service | grep -q "Up"; then
            log_success "$service service is running"
        else
            log_error "$service service is not running"
            failed_services=$((failed_services + 1))
        fi
    done
    
    if [[ $failed_services -gt 0 ]]; then
        send_alert "$failed_services Docker services are down" "critical"
        return 1
    fi
    
    return 0
}

# Check website availability
check_website() {
    log_info "Checking website availability..."
    
    local errors=0
    
    # Check HTTP redirect
    if curl -I -s http://$DOMAIN | grep -q "301\|302"; then
        log_success "HTTP redirect working"
    else
        log_error "HTTP redirect not working"
        errors=$((errors + 1))
    fi
    
    # Check HTTPS
    if curl -I -s https://$DOMAIN | grep -q "200"; then
        log_success "HTTPS endpoint working"
    else
        log_error "HTTPS endpoint not responding"
        errors=$((errors + 1))
    fi
    
    # Check API health endpoint
    if curl -s https://$DOMAIN/api/health | grep -q "OK\|healthy"; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        errors=$((errors + 1))
    fi
    
    if [[ $errors -gt 0 ]]; then
        send_alert "Website availability issues detected" "critical"
        return 1
    fi
    
    return 0
}

# Check SSL certificate
check_ssl_certificate() {
    log_info "Checking SSL certificate..."
    
    local cert_info
    cert_info=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [[ -n "$cert_info" ]]; then
        local expiry_date
        expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d'=' -f2)
        
        local expiry_timestamp
        expiry_timestamp=$(date -d "$expiry_date" +%s)
        
        local current_timestamp
        current_timestamp=$(date +%s)
        
        local days_until_expiry
        days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [[ $days_until_expiry -lt 7 ]]; then
            send_alert "SSL certificate expires in $days_until_expiry days" "critical"
            return 1
        elif [[ $days_until_expiry -lt 30 ]]; then
            log_warning "SSL certificate expires in $days_until_expiry days"
            send_alert "SSL certificate expires in $days_until_expiry days" "warning"
        else
            log_success "SSL certificate valid for $days_until_expiry days"
        fi
    else
        log_error "Could not retrieve SSL certificate information"
        send_alert "SSL certificate check failed" "critical"
        return 1
    fi
    
    return 0
}

# Check system resources
check_system_resources() {
    log_info "Checking system resources..."
    
    local alerts=0
    
    # Check disk usage
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $disk_usage -gt 90 ]]; then
        send_alert "Disk usage is at ${disk_usage}%" "critical"
        alerts=$((alerts + 1))
    elif [[ $disk_usage -gt 80 ]]; then
        log_warning "Disk usage is at ${disk_usage}%"
    else
        log_success "Disk usage is at ${disk_usage}%"
    fi
    
    # Check memory usage
    local memory_usage
    memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [[ $memory_usage -gt 90 ]]; then
        send_alert "Memory usage is at ${memory_usage}%" "critical"
        alerts=$((alerts + 1))
    elif [[ $memory_usage -gt 80 ]]; then
        log_warning "Memory usage is at ${memory_usage}%"
    else
        log_success "Memory usage is at ${memory_usage}%"
    fi
    
    # Check load average
    local load_average
    load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    local cpu_cores
    cpu_cores=$(nproc)
    
    local load_percentage
    load_percentage=$(echo "$load_average $cpu_cores" | awk '{printf "%.0f", ($1/$2)*100}')
    
    if [[ $load_percentage -gt 90 ]]; then
        send_alert "System load is at ${load_percentage}%" "critical"
        alerts=$((alerts + 1))
    elif [[ $load_percentage -gt 80 ]]; then
        log_warning "System load is at ${load_percentage}%"
    else
        log_success "System load is at ${load_percentage}%"
    fi
    
    return $alerts
}

# Check database
check_database() {
    log_info "Checking database..."
    
    cd $PROJECT_DIR
    
    # Check if PostgreSQL is responding
    if docker-compose exec -T postgres pg_isready -U stories_user -d stories_db | grep -q "accepting connections"; then
        log_success "Database is accepting connections"
        
        # Check database size
        local db_size
        db_size=$(docker-compose exec -T postgres psql -U stories_user -d stories_db -t -c "SELECT pg_size_pretty(pg_database_size('stories_db'));" | tr -d ' ')
        log_info "Database size: $db_size"
        
        # Check connection count
        local connections
        connections=$(docker-compose exec -T postgres psql -U stories_user -d stories_db -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | tr -d ' ')
        log_info "Active connections: $connections"
        
        return 0
    else
        log_error "Database is not responding"
        send_alert "Database connectivity issues" "critical"
        return 1
    fi
}

# Check logs for errors
check_logs() {
    log_info "Checking application logs for errors..."
    
    cd $PROJECT_DIR
    
    # Check for recent errors in application logs
    local error_count
    error_count=$(docker-compose logs --since="5m" app 2>/dev/null | grep -i "error\|exception\|fail" | wc -l)
    
    if [[ $error_count -gt 10 ]]; then
        send_alert "High error rate detected: $error_count errors in last 5 minutes" "warning"
        
        # Show recent errors
        log_warning "Recent errors:"
        docker-compose logs --since="5m" app | grep -i "error\|exception\|fail" | tail -5
    elif [[ $error_count -gt 0 ]]; then
        log_warning "Found $error_count errors in last 5 minutes"
    else
        log_success "No recent errors found"
    fi
    
    return 0
}

# Generate status report
generate_status_report() {
    log_info "Generating status report..."
    
    echo "============================================"
    echo "1001 Stories System Status Report"
    echo "============================================"
    echo "Generated: $(date)"
    echo "Server: $(hostname)"
    echo "Domain: $DOMAIN"
    echo ""
    
    # System information
    echo "System Information:"
    echo "- Uptime: $(uptime -p)"
    echo "- Load: $(uptime | awk -F'load average:' '{print $2}')"
    echo "- Memory: $(free -h | awk 'NR==2{print $3"/"$2" ("$3/$2*100"%)"}')"
    echo "- Disk: $(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')"
    echo ""
    
    # Docker services
    echo "Docker Services:"
    cd $PROJECT_DIR
    docker-compose ps
    echo ""
    
    # Recent activity
    echo "Recent Activity (last 24 hours):"
    docker-compose logs --since="24h" nginx | grep -E "GET|POST" | wc -l | xargs echo "- HTTP Requests:"
    docker-compose logs --since="24h" app | grep -i error | wc -l | xargs echo "- Application Errors:"
    echo ""
    
    # SSL Certificate
    echo "SSL Certificate:"
    if cert_info=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
        echo "$cert_info"
    else
        echo "- Could not retrieve certificate information"
    fi
    echo ""
    
    echo "============================================"
}

# Full health check
full_health_check() {
    log_info "Starting full health check..."
    
    local total_checks=0
    local passed_checks=0
    
    # Docker services
    total_checks=$((total_checks + 1))
    if check_docker_services; then
        passed_checks=$((passed_checks + 1))
    fi
    
    # Website availability
    total_checks=$((total_checks + 1))
    if check_website; then
        passed_checks=$((passed_checks + 1))
    fi
    
    # SSL certificate
    total_checks=$((total_checks + 1))
    if check_ssl_certificate; then
        passed_checks=$((passed_checks + 1))
    fi
    
    # System resources
    total_checks=$((total_checks + 1))
    if check_system_resources; then
        passed_checks=$((passed_checks + 1))
    fi
    
    # Database
    total_checks=$((total_checks + 1))
    if check_database; then
        passed_checks=$((passed_checks + 1))
    fi
    
    # Check logs
    check_logs
    
    # Summary
    echo ""
    log_info "Health check summary: $passed_checks/$total_checks checks passed"
    
    if [[ $passed_checks -eq $total_checks ]]; then
        log_success "🎉 All health checks passed!"
        return 0
    else
        local failed_checks=$((total_checks - passed_checks))
        log_error "$failed_checks health check(s) failed"
        return 1
    fi
}

# Setup monitoring cron jobs
setup_monitoring() {
    log_info "Setting up monitoring cron jobs..."
    
    # Create monitoring cron job
    cat > /etc/cron.d/1001-stories-monitor << EOF
# 1001 Stories Monitoring
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Health check every 5 minutes
*/5 * * * * root cd $PROJECT_DIR && $PROJECT_DIR/scripts/monitor.sh health >> $LOG_FILE 2>&1

# Full status report daily at 6 AM
0 6 * * * root cd $PROJECT_DIR && $PROJECT_DIR/scripts/monitor.sh report >> $LOG_FILE 2>&1

# Weekly comprehensive check on Sundays at 7 AM
0 7 * * 0 root cd $PROJECT_DIR && $PROJECT_DIR/scripts/monitor.sh full >> $LOG_FILE 2>&1
EOF
    
    chmod 644 /etc/cron.d/1001-stories-monitor
    
    # Create log rotation
    cat > /etc/logrotate.d/1001-stories-monitor << EOF
$LOG_FILE {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    
    log_success "Monitoring cron jobs configured"
    log_info "Log file: $LOG_FILE"
}

# Main execution
case "${1:-health}" in
    "health")
        check_docker_services && check_website
        ;;
    "full")
        full_health_check
        ;;
    "ssl")
        check_ssl_certificate
        ;;
    "resources")
        check_system_resources
        ;;
    "database")
        check_database
        ;;
    "logs")
        check_logs
        ;;
    "report")
        generate_status_report
        ;;
    "setup")
        setup_monitoring
        ;;
    *)
        echo "Usage: $0 {health|full|ssl|resources|database|logs|report|setup}"
        echo ""
        echo "Commands:"
        echo "  health     - Quick health check (services + website)"
        echo "  full       - Comprehensive health check"
        echo "  ssl        - Check SSL certificate status"
        echo "  resources  - Check system resources"
        echo "  database   - Check database connectivity"
        echo "  logs       - Check recent logs for errors"
        echo "  report     - Generate status report"
        echo "  setup      - Setup monitoring cron jobs"
        echo ""
        echo "Environment Variables:"
        echo "  ALERT_EMAIL    - Email for alerts"
        echo "  SLACK_WEBHOOK  - Slack webhook for notifications"
        exit 1
        ;;
esac