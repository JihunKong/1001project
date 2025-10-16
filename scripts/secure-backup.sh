#!/bin/bash
# Secure Backup Script for 1001 Stories
# Implements encrypted backups with proper security measures

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/1001-stories/backups"
ENCRYPTION_KEY_FILE="/opt/1001-stories/secrets/backup.key"
RETENTION_DAYS=30
DATABASE_NAME="stories_db"
DATABASE_USER="stories_user"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
        exit 1
    fi

    # Check required commands
    local required_commands=("docker" "gpg" "find" "tar" "gzip")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command '$cmd' not found"
            exit 1
        fi
    done

    # Create backup directory with secure permissions
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        chmod 700 "$BACKUP_DIR"
    fi

    # Check encryption key
    if [[ ! -f "$ENCRYPTION_KEY_FILE" ]]; then
        warning "Encryption key not found. Generating new key..."
        mkdir -p "$(dirname "$ENCRYPTION_KEY_FILE")"
        # Generate 32-byte (256-bit) key
        openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
        chmod 600 "$ENCRYPTION_KEY_FILE"
        log "Encryption key generated at $ENCRYPTION_KEY_FILE"
    fi
}

# Database backup with encryption
backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/database_${timestamp}.sql.gz.gpg"

    log "Creating encrypted database backup..."

    # Create database dump with compression and encryption
    docker exec 1001-stories-postgres pg_dump \
        -U "$DATABASE_USER" \
        -d "$DATABASE_NAME" \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain | \
    gzip -9 | \
    gpg --batch --yes --cipher-algo AES256 --compress-algo 1 \
        --symmetric --passphrase-file "$ENCRYPTION_KEY_FILE" \
        --output "$backup_file"

    # Verify backup file was created
    if [[ -f "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo 0)
        log "Database backup completed: $backup_file (${file_size} bytes)"

        # Set secure permissions
        chmod 600 "$backup_file"

        # Create checksum
        shasum -a 256 "$backup_file" > "${backup_file}.sha256"
        chmod 600 "${backup_file}.sha256"

        return 0
    else
        error "Database backup failed - file not created"
        return 1
    fi
}

# Application data backup
backup_application_data() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/application_data_${timestamp}.tar.gz.gpg"

    log "Creating encrypted application data backup..."

    # Backup uploads, public/books, and configuration files
    tar -czf - \
        -C /opt/1001-stories \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='data/postgres' \
        --exclude='data/redis' \
        uploads/ \
        public/books/ \
        .env.production \
        docker-compose.yml \
        nginx-current.conf 2>/dev/null | \
    gpg --batch --yes --cipher-algo AES256 --compress-algo 1 \
        --symmetric --passphrase-file "$ENCRYPTION_KEY_FILE" \
        --output "$backup_file"

    if [[ -f "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo 0)
        log "Application data backup completed: $backup_file (${file_size} bytes)"

        # Set secure permissions and create checksum
        chmod 600 "$backup_file"
        shasum -a 256 "$backup_file" > "${backup_file}.sha256"
        chmod 600 "${backup_file}.sha256"

        return 0
    else
        error "Application data backup failed - file not created"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        rm -f "${file}.sha256"  # Remove associated checksum
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "*.gpg" -mtime +$RETENTION_DAYS -print0)

    if [[ $deleted_count -gt 0 ]]; then
        log "Cleaned up $deleted_count old backup files"
    else
        log "No old backups to clean up"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"

    log "Verifying backup integrity: $(basename "$backup_file")"

    # Check if checksum file exists
    if [[ ! -f "${backup_file}.sha256" ]]; then
        warning "No checksum file found for $backup_file"
        return 1
    fi

    # Verify checksum
    if shasum -a 256 -c "${backup_file}.sha256" >/dev/null 2>&1; then
        log "Backup integrity verified: $(basename "$backup_file")"
        return 0
    else
        error "Backup integrity check failed: $(basename "$backup_file")"
        return 1
    fi
}

# Main backup process
main() {
    log "Starting secure backup process for 1001 Stories"

    check_prerequisites

    # Perform backups
    if backup_database && backup_application_data; then
        log "All backups completed successfully"

        # Verify the latest backups
        local latest_db_backup=$(find "$BACKUP_DIR" -name "database_*.gpg" -type f | sort | tail -1)
        local latest_app_backup=$(find "$BACKUP_DIR" -name "application_data_*.gpg" -type f | sort | tail -1)

        verify_backup "$latest_db_backup"
        verify_backup "$latest_app_backup"

        # Cleanup old backups
        cleanup_old_backups

        # Summary
        local total_backups=$(find "$BACKUP_DIR" -name "*.gpg" -type f | wc -l)
        local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)

        log "Backup summary: $total_backups files, $total_size total size"
        log "Secure backup process completed successfully"

    else
        error "Backup process failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "verify")
        if [[ -z "${2:-}" ]]; then
            error "Please provide backup file path for verification"
            exit 1
        fi
        verify_backup "$2"
        ;;
    "cleanup")
        check_prerequisites
        cleanup_old_backups
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [verify <backup_file>|cleanup]"
        echo "  verify <backup_file>  - Verify specific backup file integrity"
        echo "  cleanup              - Clean up old backup files only"
        echo "  (no args)           - Run full backup process"
        exit 1
        ;;
esac