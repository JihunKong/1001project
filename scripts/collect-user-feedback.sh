#!/bin/bash

# User Feedback Collection and Analysis Script
# Automated collection of user feedback with sentiment analysis and issue detection

set -e

# Configuration
API_BASE_URL="http://localhost:3000/api"
OUTPUT_DIR="./data/feedback"
LOG_DIR="./logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create directories
setup_directories() {
    log_info "Setting up directories"
    mkdir -p "${OUTPUT_DIR}" "${LOG_DIR}"
}

# Collect feedback data
collect_feedback() {
    local timeframe=${1:-"24h"}
    
    log_info "Collecting feedback data for last ${timeframe}"
    
    # Convert timeframe to API format
    case $timeframe in
        "1h") api_timeframe="1h" ;;
        "24h") api_timeframe="1d" ;;
        "7d") api_timeframe="7d" ;;
        "30d") api_timeframe="30d" ;;
        *) api_timeframe="1d" ;;
    esac
    
    local output_file="${OUTPUT_DIR}/feedback_${api_timeframe}_${TIMESTAMP}.json"
    
    # Collect feedback from API
    curl -s -X GET "${API_BASE_URL}/feedback/analytics?timeframe=${api_timeframe}" \
         -H "Content-Type: application/json" \
         > "$output_file"
    
    if [ $? -eq 0 ]; then
        log_success "Feedback data collected: $output_file"
        echo "$output_file"
    else
        log_error "Failed to collect feedback data"
        return 1
    fi
}

# Analyze critical issues
analyze_critical_issues() {
    local feedback_file="$1"
    
    log_info "Analyzing critical issues"
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq not available - skipping detailed analysis"
        return 0
    fi
    
    # Extract critical issues
    local critical_count=$(jq -r '.summary.criticalIssues // 0' "$feedback_file")
    local bug_reports=$(jq -r '.summary.bugReports // 0' "$feedback_file")
    
    if [ "$critical_count" -gt 0 ] || [ "$bug_reports" -gt 5 ]; then
        log_warning "ATTENTION REQUIRED:"
        [ "$critical_count" -gt 0 ] && log_warning "- ${critical_count} critical issues reported"
        [ "$bug_reports" -gt 5 ] && log_warning "- ${bug_reports} bug reports (threshold exceeded)"
        
        # Generate alert file
        local alert_file="${OUTPUT_DIR}/alert_${TIMESTAMP}.json"
        jq '{
            timestamp: now,
            criticalIssues: .summary.criticalIssues,
            bugReports: .summary.bugReports,
            criticalFeedback: .criticalFeedback,
            requiresAttention: true
        }' "$feedback_file" > "$alert_file"
        
        log_warning "Alert file created: $alert_file"
    else
        log_success "No critical issues detected"
    fi
}

# Analyze sentiment trends
analyze_sentiment() {
    local feedback_file="$1"
    
    log_info "Analyzing sentiment trends"
    
    if ! command -v jq &> /dev/null; then
        return 0
    fi
    
    # Calculate sentiment percentages
    local total_feedback=$(jq -r '.summary.totalFeedback // 0' "$feedback_file")
    
    if [ "$total_feedback" -gt 0 ]; then
        log_info "Sentiment breakdown:"
        jq -r '.sentimentBreakdown | to_entries[] | "  - \(.key | gsub("_"; " ") | ascii_downcase): \(.value) (\((.value/'"$total_feedback"')*100 | floor)%)"' "$feedback_file"
        
        # Check for negative sentiment threshold
        local negative_count=$(jq -r '.sentimentBreakdown.NEGATIVE // 0' "$feedback_file")
        local very_negative_count=$(jq -r '.sentimentBreakdown.VERY_NEGATIVE // 0' "$feedback_file")
        local total_negative=$((negative_count + very_negative_count))
        
        if [ "$total_negative" -gt 0 ]; then
            local negative_percentage=$((total_negative * 100 / total_feedback))
            if [ "$negative_percentage" -gt 30 ]; then
                log_warning "High negative sentiment detected: ${negative_percentage}%"
            fi
        fi
    fi
}

# Analyze role migration feedback
analyze_role_migration() {
    local feedback_file="$1"
    
    log_info "Analyzing role migration feedback"
    
    if ! command -v jq &> /dev/null; then
        return 0
    fi
    
    local migration_feedback=$(jq -r '.summary.roleMigrationFeedback // 0' "$feedback_file")
    local avg_rating=$(jq -r '.summary.avgRating // 0' "$feedback_file")
    
    if [ "$migration_feedback" -gt 0 ]; then
        log_info "Role migration feedback: ${migration_feedback} responses"
        if (( $(echo "$avg_rating > 0" | bc -l) )); then
            log_info "Average rating: ${avg_rating}/5.0"
            
            if (( $(echo "$avg_rating < 3.0" | bc -l) )); then
                log_warning "Low satisfaction with role changes (${avg_rating}/5.0)"
            elif (( $(echo "$avg_rating >= 4.0" | bc -l) )); then
                log_success "High satisfaction with role changes (${avg_rating}/5.0)"
            fi
        fi
    else
        log_info "No specific role migration feedback in this period"
    fi
}

# Generate summary statistics
generate_summary() {
    local feedback_file="$1"
    local timeframe="$2"
    
    log_info "Generating feedback summary"
    
    local summary_file="${OUTPUT_DIR}/summary_${timeframe}_${TIMESTAMP}.txt"
    
    cat > "$summary_file" << EOF
=== USER FEEDBACK SUMMARY ===
Generated: $(date)
Period: Last $timeframe
Source: $feedback_file

EOF

    if command -v jq &> /dev/null; then
        local total=$(jq -r '.summary.totalFeedback // 0' "$feedback_file")
        local critical=$(jq -r '.summary.criticalIssues // 0' "$feedback_file")
        local bugs=$(jq -r '.summary.bugReports // 0' "$feedback_file")
        local rating=$(jq -r '.summary.avgRating // 0' "$feedback_file")
        
        cat >> "$summary_file" << EOF
OVERVIEW:
- Total Feedback: $total
- Critical Issues: $critical
- Bug Reports: $bugs
- Average Rating: $rating/5.0

EOF

        # Add top issues if available
        if jq -e '.topIssues' "$feedback_file" >/dev/null 2>&1; then
            echo "TOP ISSUES:" >> "$summary_file"
            jq -r '.topIssues[:5][] | "- \(.issue) (\(.count) reports, \(.severity) severity)"' "$feedback_file" >> "$summary_file"
            echo "" >> "$summary_file"
        fi
        
        # Add feedback by type
        if jq -e '.feedbackByType' "$feedback_file" >/dev/null 2>&1; then
            echo "FEEDBACK BY TYPE:" >> "$summary_file"
            jq -r '.feedbackByType | to_entries[] | "- \(.key): \(.value)"' "$feedback_file" >> "$summary_file"
            echo "" >> "$summary_file"
        fi
    fi
    
    log_success "Summary generated: $summary_file"
}

# Send notification if critical issues detected
send_notification() {
    local feedback_file="$1"
    
    if ! command -v jq &> /dev/null; then
        return 0
    fi
    
    local critical_count=$(jq -r '.summary.criticalIssues // 0' "$feedback_file")
    local bug_reports=$(jq -r '.summary.bugReports // 0' "$feedback_file")
    
    # Check if notification is needed
    if [ "$critical_count" -gt 0 ] || [ "$bug_reports" -gt 10 ]; then
        local notification_file="${OUTPUT_DIR}/notification_${TIMESTAMP}.txt"
        
        cat > "$notification_file" << EOF
URGENT: User Feedback Alert

Critical issues detected in user feedback:
- Critical Issues: $critical_count
- Bug Reports: $bug_reports

Please review the feedback data immediately:
$feedback_file

Time: $(date)
EOF
        
        log_warning "Notification created: $notification_file"
        
        # Here you could integrate with external notification systems:
        # - Send email via sendmail/mail command
        # - Post to Slack webhook
        # - Send to monitoring system
        
        # Example Slack notification (requires webhook URL)
        # if [ -n "$SLACK_WEBHOOK" ]; then
        #     curl -X POST -H 'Content-type: application/json' \
        #          --data '{"text":"🚨 Critical user feedback issues detected"}' \
        #          "$SLACK_WEBHOOK"
        # fi
    fi
}

# Archive old data
archive_old_data() {
    log_info "Archiving old feedback data"
    
    # Archive files older than 30 days
    find "$OUTPUT_DIR" -name "*.json" -mtime +30 -type f | while read -r file; do
        if [ -f "$file" ]; then
            log_info "Archiving: $file"
            gzip "$file"
        fi
    done
    
    # Remove files older than 90 days
    find "$OUTPUT_DIR" -name "*.gz" -mtime +90 -type f -delete
}

# Main execution
main() {
    local timeframe=${1:-"24h"}
    
    log_info "Starting feedback collection (${timeframe})"
    
    setup_directories
    
    # Collect feedback data
    local feedback_file
    feedback_file=$(collect_feedback "$timeframe")
    
    if [ $? -eq 0 ] && [ -f "$feedback_file" ]; then
        # Analyze the collected data
        analyze_critical_issues "$feedback_file"
        analyze_sentiment "$feedback_file"
        analyze_role_migration "$feedback_file"
        
        # Generate outputs
        generate_summary "$feedback_file" "$timeframe"
        send_notification "$feedback_file"
        
        # Cleanup
        archive_old_data
        
        log_success "Feedback collection and analysis complete"
        log_info "Data file: $feedback_file"
    else
        log_error "Failed to collect feedback data"
        exit 1
    fi
}

# Usage help
show_usage() {
    echo "Usage: $0 [timeframe]"
    echo ""
    echo "Timeframes:"
    echo "  1h    - Last hour"
    echo "  24h   - Last 24 hours (default)"
    echo "  7d    - Last 7 days"
    echo "  30d   - Last 30 days"
    echo ""
    echo "Examples:"
    echo "  $0        # Collect last 24h of feedback"
    echo "  $0 7d     # Collect last 7 days of feedback"
}

# Handle arguments
case "${1:-}" in
    -h|--help|help)
        show_usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac