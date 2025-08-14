#!/bin/bash

# Backup and Monitoring Script for 1001 Stories Platform

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
DB_NAME="stories_db"
APP_DIR="/var/www/1001-stories"
LOG_FILE="/var/log/1001-stories-monitor.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to backup database
backup_database() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    
    docker exec 1001-stories-db pg_dump -U stories_user "$DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        gzip "$BACKUP_FILE"
        log_message "Database backup completed: ${BACKUP_FILE}.gz"
        
        # Keep only last 7 days of backups
        find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
        log_message "Old backups cleaned up"
    else
        log_message "ERROR: Database backup failed"
    fi
}

# Function to check application health
check_app_health() {
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        log_message "Application health check: OK (Status: $HTTP_STATUS)"
    else
        log_message "WARNING: Application health check failed (Status: $HTTP_STATUS)"
        
        # Attempt to restart if down
        pm2 restart 1001-stories
        log_message "Attempted application restart"
    fi
}

# Function to check disk space
check_disk_space() {
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -gt 80 ]; then
        log_message "WARNING: Disk usage is high: ${DISK_USAGE}%"
    else
        log_message "Disk usage: ${DISK_USAGE}%"
    fi
}

# Function to check memory usage
check_memory() {
    MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    if [ "$MEM_USAGE" -gt 80 ]; then
        log_message "WARNING: Memory usage is high: ${MEM_USAGE}%"
    else
        log_message "Memory usage: ${MEM_USAGE}%"
    fi
}

# Main monitoring function
monitor_system() {
    log_message "=== Starting monitoring cycle ==="
    check_app_health
    check_disk_space
    check_memory
    log_message "=== Monitoring cycle completed ==="
}

# Parse command line arguments
case "$1" in
    backup)
        backup_database
        ;;
    monitor)
        monitor_system
        ;;
    all)
        backup_database
        monitor_system
        ;;
    *)
        echo "Usage: $0 {backup|monitor|all}"
        exit 1
        ;;
esac