#!/bin/bash

# 1001 Stories Auto-scaling and Cost Optimization Script
# Monitors resource usage and scales services based on educational platform load
# Optimized for cost-efficiency with predictable educational usage patterns

set -euo pipefail

# Configuration
COMPOSE_FILE="/opt/1001-stories/docker-compose.yml"
METRICS_ENDPOINT="http://localhost:9090"
SCALE_UP_CPU_THRESHOLD=75      # CPU percentage to scale up
SCALE_DOWN_CPU_THRESHOLD=25    # CPU percentage to scale down
SCALE_UP_MEMORY_THRESHOLD=80   # Memory percentage to scale up
SCALE_DOWN_MEMORY_THRESHOLD=30 # Memory percentage to scale down
MIN_INSTANCES=1                # Minimum app instances
MAX_INSTANCES=3                # Maximum app instances (cost control)
OBSERVATION_WINDOW=300         # 5 minutes in seconds
CHECK_INTERVAL=60              # Check every minute

# Educational platform specific thresholds
STUDENT_ACTIVE_THRESHOLD=50    # Number of active students to trigger scaling
PEAK_HOURS_START=8             # 8 AM
PEAK_HOURS_END=22              # 10 PM
WEEKEND_SCALE_DOWN=true        # Scale down on weekends

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Get current metrics from Prometheus
get_cpu_usage() {
    if command -v curl &> /dev/null; then
        curl -s "${METRICS_ENDPOINT}/api/v1/query?query=100-(avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m]))*100)" | \
        jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0"
    else
        # Fallback to Docker stats if curl/Prometheus unavailable
        docker stats --no-stream --format "table {{.CPUPerc}}" | grep -v "CPU%" | sed 's/%//g' | head -n1 || echo "0"
    fi
}

get_memory_usage() {
    if command -v curl &> /dev/null; then
        curl -s "${METRICS_ENDPOINT}/api/v1/query?query=(1-(node_memory_MemAvailable_bytes/node_memory_MemTotal_bytes))*100" | \
        jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0"
    else
        # Fallback to free command
        free | grep Mem | awk '{printf "%.2f", ($3/$2) * 100.0}' || echo "0"
    fi
}

# Get application-specific metrics
get_active_sessions() {
    # Query Redis for active sessions (educational platform specific)
    docker exec 1001-stories-redis redis-cli --raw -a "${REDIS_PASSWORD:-5DlvWlSxaxHNQbrHawza9EnhCDYMIfvIc55kkGpb1SM=}" eval "return #redis.call('keys', 'session:*')" 0 2>/dev/null || echo "0"
}

get_concurrent_readers() {
    # Query application metrics for concurrent PDF readers
    if command -v curl &> /dev/null; then
        curl -s "http://localhost:3000/api/metrics/readers" 2>/dev/null | jq -r '.concurrent_readers // 0' || echo "0"
    else
        echo "0"
    fi
}

# Check if we're in educational peak hours
is_peak_hours() {
    local current_hour=$(date +%H)
    if [[ $current_hour -ge $PEAK_HOURS_START && $current_hour -le $PEAK_HOURS_END ]]; then
        return 0  # True
    else
        return 1  # False
    fi
}

# Check if it's weekend
is_weekend() {
    local day_of_week=$(date +%u)
    if [[ $day_of_week -ge 6 ]]; then
        return 0  # True (Saturday=6, Sunday=7)
    else
        return 1  # False
    fi
}

# Get current number of app instances
get_current_instances() {
    docker ps --filter "name=1001-stories-app" --format "table {{.Names}}" | grep -c "1001-stories-app" || echo "0"
}

# Scale up application instances
scale_up() {
    local current_instances=$(get_current_instances)
    if [[ $current_instances -lt $MAX_INSTANCES ]]; then
        local new_instance_id=$((current_instances + 1))
        info "Scaling UP: Adding app instance $new_instance_id"

        # Start additional app instance using Docker Compose profiles
        docker-compose -f "$COMPOSE_FILE" --profile scale-up up -d app-${new_instance_id} 2>/dev/null || {
            # Fallback: create new instance manually
            docker run -d \
                --name "1001-stories-app-${new_instance_id}" \
                --network "1001-stories_app-network" \
                --env-file /opt/1001-stories/.env.production \
                -e INSTANCE_ID="app-${new_instance_id}" \
                -v /opt/1001-stories/uploads:/app/uploads \
                -v /opt/1001-stories/public/books:/app/public/books:ro \
                1001-stories_app
        }

        # Update load balancer configuration (if HAProxy is used)
        update_load_balancer_config

        log "Scale up completed: Now running $((current_instances + 1)) instances"
    else
        warn "Maximum instances ($MAX_INSTANCES) reached, cannot scale up further"
    fi
}

# Scale down application instances
scale_down() {
    local current_instances=$(get_current_instances)
    if [[ $current_instances -gt $MIN_INSTANCES ]]; then
        local instance_to_remove="1001-stories-app-${current_instances}"
        info "Scaling DOWN: Removing app instance $current_instances"

        # Gracefully stop the instance
        docker stop "$instance_to_remove" 2>/dev/null || true
        docker rm "$instance_to_remove" 2>/dev/null || true

        # Update load balancer configuration
        update_load_balancer_config

        log "Scale down completed: Now running $((current_instances - 1)) instances"
    else
        warn "Minimum instances ($MIN_INSTANCES) reached, cannot scale down further"
    fi
}

# Update load balancer configuration (HAProxy)
update_load_balancer_config() {
    info "Updating load balancer configuration..."
    # This would update HAProxy config and reload it
    # Implementation depends on your load balancer setup
    docker exec 1001-stories-loadbalancer kill -HUP 1 2>/dev/null || true
}

# Educational platform specific optimizations
optimize_for_educational_load() {
    local current_hour=$(date +%H)
    local day_of_week=$(date +%u)

    # Night time optimization (11 PM - 6 AM)
    if [[ $current_hour -ge 23 || $current_hour -le 6 ]]; then
        info "Night time detected: Applying low-usage optimizations"

        # Scale down to minimum if not already
        local current_instances=$(get_current_instances)
        if [[ $current_instances -gt $MIN_INSTANCES ]]; then
            scale_down
        fi

        # Adjust PostgreSQL settings for low load
        docker exec 1001-stories-postgres psql -U stories_user -d stories_db -c "
            ALTER SYSTEM SET shared_buffers = '64MB';
            ALTER SYSTEM SET work_mem = '2MB';
            SELECT pg_reload_conf();
        " 2>/dev/null || true

    # Morning preparation (6 AM - 8 AM)
    elif [[ $current_hour -ge 6 && $current_hour -lt 8 ]]; then
        info "Morning preparation: Pre-scaling for educational hours"

        # Warm up caches and pre-scale if needed
        if is_weekend; then
            info "Weekend detected: Maintaining lower resource allocation"
        else
            info "Weekday morning: Preparing for educational activity"
            # Ensure at least 2 instances are ready for the day
            local current_instances=$(get_current_instances)
            if [[ $current_instances -lt 2 ]]; then
                scale_up
            fi
        fi
    fi
}

# Cost optimization based on educational patterns
apply_cost_optimizations() {
    info "Applying cost optimizations..."

    # Weekend scale-down
    if is_weekend && [[ "$WEEKEND_SCALE_DOWN" == "true" ]]; then
        warn "Weekend detected: Scaling down for cost optimization"
        local current_instances=$(get_current_instances)
        if [[ $current_instances -gt 1 ]]; then
            scale_down
        fi
    fi

    # Database optimization during low usage
    local active_sessions=$(get_active_sessions)
    if [[ $active_sessions -lt 5 ]]; then
        info "Low session count ($active_sessions): Optimizing database connections"

        # Reduce pgbouncer pool size
        docker exec 1001-stories-postgres psql -U stories_user -d stories_db -c "
            SELECT pg_reload_conf();
        " 2>/dev/null || true
    fi

    # Redis memory optimization
    docker exec 1001-stories-redis redis-cli --raw -a "${REDIS_PASSWORD:-5DlvWlSxaxHNQbrHawza9EnhCDYMIfvIc55kkGpb1SM=}" MEMORY PURGE 2>/dev/null || true
}

# Main monitoring and scaling logic
main_scaling_loop() {
    log "Starting auto-scaling monitoring for 1001 Stories educational platform"

    while true; do
        # Get current metrics
        local cpu_usage=$(get_cpu_usage)
        local memory_usage=$(get_memory_usage)
        local active_sessions=$(get_active_sessions)
        local concurrent_readers=$(get_concurrent_readers)
        local current_instances=$(get_current_instances)

        info "Current metrics - CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Sessions: ${active_sessions}, Readers: ${concurrent_readers}, Instances: ${current_instances}"

        # Educational platform specific logic
        optimize_for_educational_load

        # Scaling decisions based on metrics
        local cpu_float=$(printf "%.0f" "$cpu_usage" 2>/dev/null || echo "0")
        local memory_float=$(printf "%.0f" "$memory_usage" 2>/dev/null || echo "0")

        # Scale up conditions
        if [[ $cpu_float -gt $SCALE_UP_CPU_THRESHOLD ]] ||
           [[ $memory_float -gt $SCALE_UP_MEMORY_THRESHOLD ]] ||
           [[ $active_sessions -gt $STUDENT_ACTIVE_THRESHOLD ]]; then

            if is_peak_hours; then
                warn "High load detected during peak hours - scaling up"
                scale_up
            else
                info "High load detected outside peak hours - monitoring closely"
            fi

        # Scale down conditions
        elif [[ $cpu_float -lt $SCALE_DOWN_CPU_THRESHOLD ]] &&
             [[ $memory_float -lt $SCALE_DOWN_MEMORY_THRESHOLD ]] &&
             [[ $active_sessions -lt $((STUDENT_ACTIVE_THRESHOLD / 2)) ]]; then

            if ! is_peak_hours; then
                info "Low load detected outside peak hours - scaling down"
                scale_down
            else
                info "Low load during peak hours - maintaining current scale"
            fi
        fi

        # Apply cost optimizations
        apply_cost_optimizations

        # Wait before next check
        sleep $CHECK_INTERVAL
    done
}

# Emergency scale down (cost protection)
emergency_scale_down() {
    warn "Emergency scale down initiated"
    local current_instances=$(get_current_instances)

    while [[ $current_instances -gt 1 ]]; do
        scale_down
        current_instances=$(get_current_instances)
        sleep 10
    done

    log "Emergency scale down completed"
}

# Show current status
show_status() {
    echo "=== 1001 Stories Auto-scaling Status ==="
    echo "Current instances: $(get_current_instances)"
    echo "CPU usage: $(get_cpu_usage)%"
    echo "Memory usage: $(get_memory_usage)%"
    echo "Active sessions: $(get_active_sessions)"
    echo "Peak hours: $(is_peak_hours && echo "Yes" || echo "No")"
    echo "Weekend: $(is_weekend && echo "Yes" || echo "No")"
    echo "====================================="
}

# Usage information
usage() {
    echo "Usage: $0 {start|stop|status|scale-up|scale-down|emergency-stop}"
    echo ""
    echo "Commands:"
    echo "  start           Start auto-scaling monitoring"
    echo "  stop            Stop auto-scaling monitoring"
    echo "  status          Show current scaling status"
    echo "  scale-up        Manually scale up one instance"
    echo "  scale-down      Manually scale down one instance"
    echo "  emergency-stop  Emergency scale down to minimum"
    echo ""
    echo "Educational Platform Optimizations:"
    echo "  - Automatic scaling during peak educational hours (8 AM - 10 PM)"
    echo "  - Weekend cost optimization with reduced scaling"
    echo "  - Student activity-based scaling decisions"
    echo "  - Night time resource optimization"
}

# Signal handlers for graceful shutdown
trap 'log "Shutting down auto-scaler..."; exit 0' SIGTERM SIGINT

# Main script execution
case "${1:-start}" in
    start)
        main_scaling_loop
        ;;
    stop)
        pkill -f "auto-scale.sh" || true
        log "Auto-scaling stopped"
        ;;
    status)
        show_status
        ;;
    scale-up)
        scale_up
        ;;
    scale-down)
        scale_down
        ;;
    emergency-stop)
        emergency_scale_down
        ;;
    *)
        usage
        exit 1
        ;;
esac