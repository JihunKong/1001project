#!/bin/bash

# 1001 Stories Database Backup Script
# PostgreSQL 데이터베이스 자동 백업 및 관리

set -e

# 설정 변수
BACKUP_DIR="/var/backups/1001stories"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-1001stories}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS=30
S3_BUCKET="${S3_BUCKET:-1001stories-backups}"
LOG_FILE="/var/log/1001stories-backup.log"

# 컬러 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 로깅 함수
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# 에러 핸들링
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# 백업 디렉토리 생성
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR" || error_exit "Failed to create backup directory"
        log "${GREEN}Created backup directory: $BACKUP_DIR${NC}"
    fi
}

# 데이터베이스 백업 실행
backup_database() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/1001stories_backup_$timestamp.sql"
    local compressed_file="$backup_file.gz"
    
    log "Starting database backup..."
    
    # PostgreSQL 덤프 생성
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges > "$backup_file" 2>> "$LOG_FILE"; then
        log "${GREEN}Database dump created: $backup_file${NC}"
    else
        error_exit "Failed to create database dump"
    fi
    
    # 백업 파일 압축
    if gzip "$backup_file"; then
        log "${GREEN}Backup compressed: $compressed_file${NC}"
        echo "$compressed_file"
    else
        error_exit "Failed to compress backup file"
    fi
}

# 백업 검증
verify_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    local file_size=$(stat -c%s "$backup_file" 2>/dev/null || stat -f%z "$backup_file")
    if [ "$file_size" -lt 1024 ]; then
        error_exit "Backup file too small, likely corrupted: $file_size bytes"
    fi
    
    # 압축 파일 무결성 검사
    if ! gzip -t "$backup_file"; then
        error_exit "Backup file integrity check failed"
    fi
    
    log "${GREEN}Backup verification passed: $file_size bytes${NC}"
}

# S3 업로드 (AWS CLI가 설치되어 있는 경우)
upload_to_s3() {
    local backup_file=$1
    
    if ! command -v aws >/dev/null 2>&1; then
        log "${YELLOW}AWS CLI not installed, skipping S3 upload${NC}"
        return 0
    fi
    
    if [ -z "$S3_BUCKET" ]; then
        log "${YELLOW}S3 bucket not configured, skipping upload${NC}"
        return 0
    fi
    
    local s3_path="s3://$S3_BUCKET/database/$(basename $backup_file)"
    
    log "Uploading to S3: $s3_path"
    if aws s3 cp "$backup_file" "$s3_path" --storage-class STANDARD_IA; then
        log "${GREEN}Successfully uploaded to S3${NC}"
    else
        log "${RED}Failed to upload to S3${NC}"
        return 1
    fi
}

# 오래된 백업 파일 정리
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # 로컬 백업 정리
    find "$BACKUP_DIR" -name "1001stories_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    log "Local cleanup completed"
    
    # S3 백업 정리 (AWS CLI가 있는 경우)
    if command -v aws >/dev/null 2>&1 && [ -n "$S3_BUCKET" ]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" '+%Y-%m-%d')
        aws s3 ls "s3://$S3_BUCKET/database/" | while read -r line; do
            local s3_file=$(echo $line | awk '{print $4}')
            local s3_date=$(echo $line | awk '{print $1}')
            
            if [[ "$s3_date" < "$cutoff_date" ]]; then
                aws s3 rm "s3://$S3_BUCKET/database/$s3_file"
                log "Removed old S3 backup: $s3_file"
            fi
        done
    fi
}

# 백업 복원 함수 (테스트용)
restore_backup() {
    local backup_file=$1
    local test_db="${DB_NAME}_restore_test"
    
    if [ -z "$backup_file" ]; then
        error_exit "Backup file not provided for restore test"
    fi
    
    log "Testing backup restore..."
    
    # 테스트 데이터베이스 생성
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db" 2>/dev/null || true
    
    # 백업 복원
    if zcat "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$test_db" >/dev/null 2>&1; then
        log "${GREEN}Backup restore test successful${NC}"
        dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db" 2>/dev/null || true
        return 0
    else
        log "${RED}Backup restore test failed${NC}"
        dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db" 2>/dev/null || true
        return 1
    fi
}

# 디스크 공간 확인
check_disk_space() {
    local available_space=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        error_exit "Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
    fi
    
    log "Disk space check passed: ${available_space}KB available"
}

# Slack 알림 전송
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="good"
        if [ "$status" = "error" ]; then
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"1001 Stories Database Backup\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1
    fi
}

# 메인 백업 프로세스
main() {
    log "=== 1001 Stories Database Backup Started ==="
    
    # 환경 확인
    if ! command -v pg_dump >/dev/null 2>&1; then
        error_exit "pg_dump not found. Please install PostgreSQL client tools."
    fi
    
    # 데이터베이스 연결 확인
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        error_exit "Database is not accessible"
    fi
    
    # 디스크 공간 확인
    check_disk_space
    
    # 백업 디렉토리 생성
    create_backup_dir
    
    # 백업 실행
    local backup_file
    backup_file=$(backup_database)
    
    # 백업 검증
    verify_backup "$backup_file"
    
    # S3 업로드
    upload_to_s3 "$backup_file"
    
    # 복원 테스트 (선택사항)
    if [ "${RESTORE_TEST:-false}" = "true" ]; then
        restore_backup "$backup_file"
    fi
    
    # 오래된 백업 정리
    cleanup_old_backups
    
    log "${GREEN}=== Backup completed successfully ===${NC}"
    send_notification "success" "Database backup completed successfully"
}

# 도움말 표시
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --restore-test    Run restore test after backup"
    echo "  --cleanup-only    Only clean up old backups"
    echo "  --help           Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DB_HOST          Database host (default: localhost)"
    echo "  DB_PORT          Database port (default: 5432)"
    echo "  DB_NAME          Database name (default: 1001stories)"
    echo "  DB_USER          Database user (default: postgres)"
    echo "  PGPASSWORD       Database password"
    echo "  S3_BUCKET        S3 bucket for remote backup"
    echo "  SLACK_WEBHOOK_URL Slack webhook for notifications"
}

# 명령행 인수 처리
case "${1:-}" in
    --help)
        show_help
        exit 0
        ;;
    --cleanup-only)
        cleanup_old_backups
        exit 0
        ;;
    --restore-test)
        export RESTORE_TEST=true
        main
        ;;
    *)
        main
        ;;
esac