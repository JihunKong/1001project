#!/bin/bash

# 1001 Stories Backup and Restore Script
# Comprehensive backup solution for educational platform
# Usage: ./backup-restore.sh [backup|restore|schedule|verify] [options]

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/1001-stories/backups"
RETENTION_DAYS=30
POSTGRES_CONTAINER="1001-stories-postgres"
REDIS_CONTAINER="1001-stories-redis"
APP_CONTAINER="1001-stories-app"
COMPOSE_FILE="/opt/1001-stories/docker-compose.yml"

# S3 Configuration (optional for off-site backup)
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."

    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
        exit 1
    fi

    # Check if backup directory exists
    if [[ ! -d "$BACKUP_DIR" ]]; then
        info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        chmod 750 "$BACKUP_DIR"
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check if containers are running
    if ! docker ps --format "table {{.Names}}" | grep -q "$POSTGRES_CONTAINER"; then
        warn "PostgreSQL container is not running"
    fi

    if ! docker ps --format "table {{.Names}}" | grep -q "$REDIS_CONTAINER"; then
        warn "Redis container is not running"
    fi
}

# Create comprehensive backup
create_backup() {
    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="1001stories_backup_${backup_timestamp}"
    local backup_path="${BACKUP_DIR}/${backup_name}"

    log "Starting backup: $backup_name"
    mkdir -p "$backup_path"

    # 1. PostgreSQL Database Backup
    info "Backing up PostgreSQL database..."
    docker exec "$POSTGRES_CONTAINER" pg_dump -U stories_user -d stories_db --verbose --format=custom > "${backup_path}/postgres_dump.custom"

    # Also create plain SQL dump for easier inspection
    docker exec "$POSTGRES_CONTAINER" pg_dump -U stories_user -d stories_db --verbose --format=plain > "${backup_path}/postgres_dump.sql"

    # 2. Redis Backup
    info "Backing up Redis data..."
    docker exec "$REDIS_CONTAINER" redis-cli --rdb /data/dump.rdb SAVE
    docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "${backup_path}/redis_dump.rdb"

    # 3. Application Files Backup
    info "Backing up application files..."

    # User uploads
    if [[ -d "/opt/1001-stories/uploads" ]]; then
        tar -czf "${backup_path}/uploads.tar.gz" -C "/opt/1001-stories" uploads/
    fi

    # Books and media
    if [[ -d "/opt/1001-stories/public/books" ]]; then
        tar -czf "${backup_path}/books.tar.gz" -C "/opt/1001-stories/public" books/
    fi

    # SSL certificates
    if [[ -d "/opt/1001-stories/certbot" ]]; then
        tar -czf "${backup_path}/ssl_certs.tar.gz" -C "/opt/1001-stories" certbot/
    fi

    # Configuration files
    tar -czf "${backup_path}/config.tar.gz" -C "/opt/1001-stories" \\\n        docker-compose.yml \\\n        .env.production \\\n        nginx-current.conf \\\n        postgres/ \\\n        monitoring/ \\\n        scripts/ 2>/dev/null || true

    # 4. Create metadata file
    info "Creating backup metadata..."
    cat > "${backup_path}/backup_info.json" <<EOF
{
    "backup_name": "$backup_name",
    "timestamp": "$backup_timestamp",
    "backup_date": "$(date -Iseconds)",
    "system_info": {
        "hostname": "$(hostname)",
        "docker_version": "$(docker --version)",
        "backup_script_version": "1.0",
        "platform": "1001-stories-educational"
    },
    "components": {
        "postgres": true,
        "redis": true,
        "uploads": $([ -d "/opt/1001-stories/uploads" ] && echo "true" || echo "false"),
        "books": $([ -d "/opt/1001-stories/public/books" ] && echo "true" || echo "false"),
        "ssl_certs": $([ -d "/opt/1001-stories/certbot" ] && echo "true" || echo "false"),
        "config": true
    },
    "rpo_target": "15 minutes",
    "rto_target": "30 minutes"
}
EOF

    # 5. Calculate checksums
    info "Calculating checksums..."
    find "$backup_path" -type f -exec sha256sum {} \\; > "${backup_path}/checksums.sha256"

    # 6. Compress entire backup
    info "Compressing backup..."
    tar -czf "${backup_path}.tar.gz" -C "$BACKUP_DIR" "$backup_name"
    rm -rf "$backup_path"

    # 7. Upload to S3 if configured
    if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
        info "Uploading to S3..."
        aws s3 cp "${backup_path}.tar.gz" "s3://${S3_BUCKET}/1001stories-backups/" --region "$AWS_REGION"
        if [[ $? -eq 0 ]]; then
            log "Backup uploaded to S3 successfully"
        else
            warn "S3 upload failed, backup remains local only"
        fi
    fi

    log "Backup completed: ${backup_path}.tar.gz"
    info "Backup size: $(du -h "${backup_path}.tar.gz" | cut -f1)"
}

# Restore from backup
restore_backup() {
    local backup_file="$1"
    local restore_timestamp=$(date +"%Y%m%d_%H%M%S")
    local restore_path="${BACKUP_DIR}/restore_${restore_timestamp}"

    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi

    log "Starting restore from: $backup_file"

    # Confirm restore operation
    echo -e "${YELLOW}WARNING: This will overwrite existing data!${NC}"
    read -p "Are you sure you want to proceed? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        info "Restore cancelled by user"
        exit 0
    fi

    # Extract backup
    info "Extracting backup..."
    mkdir -p "$restore_path"
    tar -xzf "$backup_file" -C "$restore_path" --strip-components=1

    # Verify checksums if available
    if [[ -f "${restore_path}/checksums.sha256" ]]; then
        info "Verifying backup integrity..."
        cd "$restore_path"
        if sha256sum -c checksums.sha256 --quiet; then
            log "Backup integrity verified"
        else
            error "Backup integrity check failed!"
            exit 1
        fi
        cd -
    fi

    # Stop services
    info "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" stop

    # Restore PostgreSQL
    if [[ -f "${restore_path}/postgres_dump.custom" ]]; then
        info "Restoring PostgreSQL database..."
        docker-compose -f "$COMPOSE_FILE" start postgres
        sleep 10  # Wait for PostgreSQL to start

        # Drop and recreate database
        docker exec "$POSTGRES_CONTAINER" dropdb -U stories_user stories_db --if-exists
        docker exec "$POSTGRES_CONTAINER" createdb -U stories_user stories_db

        # Restore from custom dump
        docker exec -i "$POSTGRES_CONTAINER" pg_restore -U stories_user -d stories_db --verbose --clean --if-exists < "${restore_path}/postgres_dump.custom"
    fi

    # Restore Redis
    if [[ -f "${restore_path}/redis_dump.rdb" ]]; then
        info "Restoring Redis data..."
        docker-compose -f "$COMPOSE_FILE" stop redis
        docker cp "${restore_path}/redis_dump.rdb" "${REDIS_CONTAINER}:/data/dump.rdb"
        docker-compose -f "$COMPOSE_FILE" start redis
    fi

    # Restore application files
    info "Restoring application files..."

    if [[ -f "${restore_path}/uploads.tar.gz" ]]; then
        tar -xzf "${restore_path}/uploads.tar.gz" -C "/opt/1001-stories/"
    fi

    if [[ -f "${restore_path}/books.tar.gz" ]]; then
        tar -xzf "${restore_path}/books.tar.gz" -C "/opt/1001-stories/public/"
    fi

    if [[ -f "${restore_path}/ssl_certs.tar.gz" ]]; then
        tar -xzf "${restore_path}/ssl_certs.tar.gz" -C "/opt/1001-stories/"
    fi

    # Start all services
    info "Starting all services..."
    docker-compose -f "$COMPOSE_FILE" up -d

    # Wait for health checks
    info "Waiting for services to be healthy..."
    sleep 30

    # Verify restore
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
        log "Restore completed successfully"
    else
        warn "Some services may not be healthy, please check manually"
    fi

    # Cleanup
    rm -rf "$restore_path"
}

# Schedule automatic backups
schedule_backups() {
    info "Setting up automatic backup schedule..."

    # Create cron job for daily backups at 2 AM
    local cron_job="0 2 * * * /opt/1001-stories/scripts/backup-restore.sh backup && /opt/1001-stories/scripts/backup-restore.sh cleanup"

    # Add to root crontab
    (crontab -l 2>/dev/null; echo "$cron_job") | sort -u | crontab -

    log "Backup scheduled for 2 AM daily"
}

# Cleanup old backups
cleanup_backups() {
    info "Cleaning up old backups (older than $RETENTION_DAYS days)..."

    find "$BACKUP_DIR" -name "1001stories_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

    log "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    local temp_dir=$(mktemp -d)

    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi

    info "Verifying backup: $backup_file"

    # Extract and verify
    tar -xzf "$backup_file" -C "$temp_dir"

    local backup_dir=$(find "$temp_dir" -mindepth 1 -maxdepth 1 -type d | head -n 1)

    if [[ -f "${backup_dir}/checksums.sha256" ]]; then
        cd "$backup_dir"
        if sha256sum -c checksums.sha256 --quiet; then
            log "Backup verification successful"
        else
            error "Backup verification failed!"
            rm -rf "$temp_dir"
            exit 1
        fi
        cd -
    else
        warn "No checksum file found, skipping integrity check"
    fi

    # Check if essential files exist
    local essential_files=("postgres_dump.custom" "backup_info.json")
    for file in "${essential_files[@]}"; do
        if [[ ! -f "${backup_dir}/${file}" ]]; then
            error "Essential file missing: $file"
            rm -rf "$temp_dir"
            exit 1
        fi
    done

    log "Backup structure verification passed"
    rm -rf "$temp_dir"
}

# Show usage
usage() {
    echo "Usage: $0 {backup|restore|schedule|cleanup|verify} [options]"
    echo ""
    echo "Commands:"
    echo "  backup                Create a new backup"
    echo "  restore <backup_file> Restore from backup file"
    echo "  schedule             Set up automatic daily backups"
    echo "  cleanup              Remove old backups"
    echo "  verify <backup_file>  Verify backup integrity"
    echo ""
    echo "Environment Variables:"
    echo "  S3_BACKUP_BUCKET     S3 bucket for off-site backups"
    echo "  AWS_DEFAULT_REGION   AWS region (default: us-east-1)"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore /opt/1001-stories/backups/1001stories_backup_20241201_020000.tar.gz"
    echo "  $0 verify /opt/1001-stories/backups/1001stories_backup_20241201_020000.tar.gz"
}

# Main script logic
main() {
    case "${1:-}" in
        backup)
            check_prerequisites
            create_backup
            cleanup_backups
            ;;
        restore)
            if [[ -z "${2:-}" ]]; then
                error "Backup file path required"
                usage
                exit 1
            fi
            check_prerequisites
            restore_backup "$2"
            ;;
        schedule)
            check_prerequisites
            schedule_backups
            ;;
        cleanup)
            check_prerequisites
            cleanup_backups
            ;;
        verify)
            if [[ -z "${2:-}" ]]; then
                error "Backup file path required"
                usage
                exit 1
            fi
            verify_backup "$2"
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"