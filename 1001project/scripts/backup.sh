#!/bin/bash

# ============================================
# 1001 Stories Backup Script
# ============================================

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backups/1001-stories"
PROJECT_DIR="/opt/1001-stories"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Create backup directory
setup_backup_dir() {
    log_info "Setting up backup directory..."
    
    sudo mkdir -p $BACKUP_DIR
    sudo chown -R $USER:$USER $BACKUP_DIR
    
    log_success "Backup directory ready: $BACKUP_DIR"
}

# Backup database
backup_database() {
    log_info "Backing up PostgreSQL database..."
    
    cd $PROJECT_DIR
    
    # Get database credentials from environment
    DB_NAME=$(docker-compose exec -T postgres env | grep POSTGRES_DB | cut -d'=' -f2 | tr -d '\r')
    DB_USER=$(docker-compose exec -T postgres env | grep POSTGRES_USER | cut -d'=' -f2 | tr -d '\r')
    
    # Create database backup
    docker-compose exec -T postgres pg_dump -U $DB_USER -d $DB_NAME --no-owner --no-privileges | gzip > "$BACKUP_DIR/database-$TIMESTAMP.sql.gz"
    
    if [[ -f "$BACKUP_DIR/database-$TIMESTAMP.sql.gz" ]]; then
        log_success "Database backup completed: database-$TIMESTAMP.sql.gz"
        return 0
    else
        log_error "Database backup failed"
        return 1
    fi
}

# Backup uploaded files
backup_uploads() {
    log_info "Backing up uploaded files..."
    
    if [[ -d "$PROJECT_DIR/uploads" ]]; then
        tar -czf "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" uploads/
        log_success "Uploads backup completed: uploads-$TIMESTAMP.tar.gz"
    else
        log_warning "No uploads directory found"
    fi
}

# Backup SSL certificates
backup_ssl() {
    log_info "Backing up SSL certificates..."
    
    if [[ -d "$PROJECT_DIR/nginx/ssl" ]]; then
        tar -czf "$BACKUP_DIR/ssl-$TIMESTAMP.tar.gz" -C "$PROJECT_DIR/nginx" ssl/
        log_success "SSL backup completed: ssl-$TIMESTAMP.tar.gz"
    else
        log_warning "No SSL certificates found"
    fi
}

# Backup configuration files
backup_config() {
    log_info "Backing up configuration files..."
    
    cd $PROJECT_DIR
    
    # Create config backup
    tar -czf "$BACKUP_DIR/config-$TIMESTAMP.tar.gz" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='uploads' \
        --exclude='nginx/ssl' \
        --exclude='nginx/logs' \
        --exclude='backups' \
        .
    
    log_success "Configuration backup completed: config-$TIMESTAMP.tar.gz"
}

# Upload to S3 if configured
upload_to_s3() {
    if [[ -n "$S3_BUCKET" ]]; then
        log_info "Uploading backups to S3..."
        
        if command -v aws &> /dev/null; then
            aws s3 sync $BACKUP_DIR s3://$S3_BUCKET/1001-stories/ --delete
            log_success "Backups uploaded to S3"
        else
            log_warning "AWS CLI not installed, skipping S3 upload"
        fi
    else
        log_info "S3_BACKUP_BUCKET not configured, skipping S3 upload"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find $BACKUP_DIR -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete
    
    # Count remaining backups
    BACKUP_COUNT=$(find $BACKUP_DIR -type f -name "*.gz" | wc -l)
    log_success "Cleanup completed. $BACKUP_COUNT backup files remaining"
}

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."
    
    cat > "$BACKUP_DIR/manifest-$TIMESTAMP.txt" << EOF
1001 Stories Backup Manifest
============================
Timestamp: $TIMESTAMP
Date: $(date)
Server: $(hostname)
Project Directory: $PROJECT_DIR

Files in this backup:
$(ls -la $BACKUP_DIR/*$TIMESTAMP*)

System Information:
Docker Version: $(docker --version)
Docker Compose Version: $(docker-compose --version)
Disk Usage: $(df -h $PROJECT_DIR)

Services Status:
$(cd $PROJECT_DIR && docker-compose ps)
EOF
    
    log_success "Backup manifest created"
}

# Verify backup integrity
verify_backups() {
    log_info "Verifying backup integrity..."
    
    local errors=0
    
    # Check if database backup is valid
    if [[ -f "$BACKUP_DIR/database-$TIMESTAMP.sql.gz" ]]; then
        if gzip -t "$BACKUP_DIR/database-$TIMESTAMP.sql.gz"; then
            log_success "Database backup integrity verified"
        else
            log_error "Database backup is corrupted"
            errors=$((errors + 1))
        fi
    fi
    
    # Check if tar files are valid
    for tar_file in "$BACKUP_DIR"/*.tar.gz; do
        if [[ -f "$tar_file" ]]; then
            if tar -tzf "$tar_file" >/dev/null; then
                log_success "$(basename $tar_file) integrity verified"
            else
                log_error "$(basename $tar_file) is corrupted"
                errors=$((errors + 1))
            fi
        fi
    done
    
    if [[ $errors -eq 0 ]]; then
        log_success "All backups verified successfully"
        return 0
    else
        log_error "$errors backup(s) failed verification"
        return 1
    fi
}

# Full backup
full_backup() {
    log_info "Starting full backup process..."
    
    setup_backup_dir
    
    local success=0
    
    if backup_database; then
        success=$((success + 1))
    fi
    
    backup_uploads
    backup_ssl
    backup_config
    create_manifest
    
    if verify_backups; then
        success=$((success + 1))
    fi
    
    upload_to_s3
    cleanup_old_backups
    
    if [[ $success -eq 2 ]]; then
        log_success "🎉 Full backup completed successfully!"
        log_info "Backup location: $BACKUP_DIR"
        log_info "Backup timestamp: $TIMESTAMP"
        
        # Show backup size
        BACKUP_SIZE=$(du -sh $BACKUP_DIR/*$TIMESTAMP* | awk '{total+=$1} END {print total}')
        log_info "Total backup size: $(du -sh $BACKUP_DIR | cut -f1)"
        
        return 0
    else
        log_error "Backup completed with errors"
        return 1
    fi
}

# Restore from backup
restore_backup() {
    local backup_timestamp="${1:-}"
    
    if [[ -z "$backup_timestamp" ]]; then
        log_error "Please specify backup timestamp"
        log_info "Available backups:"
        ls -la $BACKUP_DIR/database-*.sql.gz | awk '{print $9}' | sed 's/.*database-\(.*\)\.sql\.gz/\1/'
        return 1
    fi
    
    log_warning "⚠️  CAUTION: This will restore data from backup $backup_timestamp"
    log_warning "This will overwrite current data!"
    
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
    if [[ ! $REPLY == "yes" ]]; then
        log_info "Restore cancelled"
        return 0
    fi
    
    log_info "Starting restore process..."
    
    cd $PROJECT_DIR
    
    # Stop services
    log_info "Stopping services..."
    docker-compose down
    
    # Restore database
    if [[ -f "$BACKUP_DIR/database-$backup_timestamp.sql.gz" ]]; then
        log_info "Restoring database..."
        
        # Start only postgres
        docker-compose up -d postgres
        sleep 10
        
        # Restore database
        zcat "$BACKUP_DIR/database-$backup_timestamp.sql.gz" | docker-compose exec -T postgres psql -U stories_user -d stories_db
        
        log_success "Database restored"
    else
        log_error "Database backup not found: $BACKUP_DIR/database-$backup_timestamp.sql.gz"
    fi
    
    # Restore uploads
    if [[ -f "$BACKUP_DIR/uploads-$backup_timestamp.tar.gz" ]]; then
        log_info "Restoring uploads..."
        tar -xzf "$BACKUP_DIR/uploads-$backup_timestamp.tar.gz" -C "$PROJECT_DIR"
        log_success "Uploads restored"
    fi
    
    # Restore SSL certificates
    if [[ -f "$BACKUP_DIR/ssl-$backup_timestamp.tar.gz" ]]; then
        log_info "Restoring SSL certificates..."
        tar -xzf "$BACKUP_DIR/ssl-$backup_timestamp.tar.gz" -C "$PROJECT_DIR/nginx"
        log_success "SSL certificates restored"
    fi
    
    # Start all services
    log_info "Starting all services..."
    docker-compose up -d
    
    log_success "🎉 Restore completed successfully!"
}

# List available backups
list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    echo
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Group by timestamp
        for timestamp in $(ls $BACKUP_DIR/database-*.sql.gz 2>/dev/null | sed 's/.*database-\(.*\)\.sql\.gz/\1/' | sort -r); do
            echo "Backup: $timestamp"
            echo "  Files:"
            ls -la $BACKUP_DIR/*$timestamp* | awk '{printf "    %s %s %s\n", $5, $6" "$7" "$8, $9}' | sed 's|.*/||'
            
            if [[ -f "$BACKUP_DIR/manifest-$timestamp.txt" ]]; then
                echo "  Manifest available"
            fi
            echo
        done
    else
        log_warning "No backup directory found"
    fi
}

# Main execution
case "${1:-backup}" in
    "backup"|"full")
        full_backup
        ;;
    "restore")
        restore_backup "${2:-}"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "verify")
        if [[ -n "${2:-}" ]]; then
            TIMESTAMP="${2}"
            verify_backups
        else
            log_error "Please specify backup timestamp to verify"
        fi
        ;;
    *)
        echo "Usage: $0 {backup|restore|list|cleanup|verify}"
        echo ""
        echo "Commands:"
        echo "  backup              - Create full backup"
        echo "  restore <timestamp> - Restore from backup"
        echo "  list                - List available backups"
        echo "  cleanup             - Clean old backups"
        echo "  verify <timestamp>  - Verify backup integrity"
        echo ""
        echo "Environment Variables:"
        echo "  S3_BACKUP_BUCKET    - S3 bucket for backup storage"
        echo "  RETENTION_DAYS      - Days to keep backups (default: 30)"
        exit 1
        ;;
esac