#!/bin/bash

# ============================================
# 1001 Stories Enhanced Deployment Script
# 무중단 배포, 백업, 모니터링 포함
# ============================================

set -e  # 에러 발생시 스크립트 중단

# Configuration
SERVER_IP="${SERVER_IP:-3.128.143.122}"
SERVER_USER="${SERVER_USER:-ubuntu}"
PEM_FILE="${PEM_FILE:-/Users/jihunkong/Downloads/1001project.pem}"
REPO_URL="${REPO_URL:-https://github.com/JihunKong/1001project.git}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/ubuntu/1001-stories}"
DOMAIN="${DOMAIN:-1001stories.seedsofempowerment.org}"
BRANCH="${BRANCH:-feature/role-system-v2}"
BACKUP_PATH="/var/backups/1001stories"
LOG_FILE="/var/log/deployment.log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Deployment metadata
DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
START_TIME=$(date +%s)

# 로깅 함수
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# 에러 핸들링 함수
handle_error() {
    local error_line=$1
    log "${RED}ERROR: Deployment failed at line $error_line${NC}"
    send_notification "error" "Deployment failed at line $error_line" "$DEPLOYMENT_ID"
    cleanup_on_error
    exit 1
}

# 에러 트랩 설정
trap 'handle_error $LINENO' ERR

# 알림 전송 함수
send_notification() {
    local status=$1
    local message=$2
    local deployment_id=${3:-""}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Slack 알림 (웹훅 URL이 설정된 경우)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="good"
        case $status in
            "error") color="danger" ;;
            "warning") color="warning" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"🚀 1001 Stories Deployment\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                        {\"title\": \"Deployment ID\", \"value\": \"$deployment_id\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$timestamp\", \"short\": true},
                        {\"title\": \"Server\", \"value\": \"$SERVER_IP\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
}

# Prerequisites 확인
check_prerequisites() {
    log "${YELLOW}Checking prerequisites...${NC}"
    
    # PEM 파일 확인
    if [ ! -f "$PEM_FILE" ]; then
        log "${RED}Error: PEM file not found at $PEM_FILE${NC}"
        exit 1
    fi
    
    chmod 400 "$PEM_FILE"
    log "${GREEN}✓ PEM file found and permissions set${NC}"
    
    # 서버 연결 확인
    if ! ssh -i "$PEM_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
         "$SERVER_USER@$SERVER_IP" "echo 'Connection test successful'" > /dev/null 2>&1; then
        log "${RED}Error: Cannot connect to server $SERVER_IP${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ Server connection verified${NC}"
}

# 사전 배포 백업
pre_deployment_backup() {
    log "${YELLOW}Creating pre-deployment backup...${NC}"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << EOF
        set -e
        
        # 백업 디렉토리 생성
        sudo mkdir -p $BACKUP_PATH
        
        # 현재 버전 백업
        if [ -d "$DEPLOY_PATH" ]; then
            sudo cp -r "$DEPLOY_PATH" "$BACKUP_PATH/backup-$DEPLOYMENT_ID"
            echo "✓ Application backup created: $BACKUP_PATH/backup-$DEPLOYMENT_ID"
        fi
        
        # 데이터베이스 백업
        if command -v docker-compose >/dev/null 2>&1; then
            cd "$DEPLOY_PATH"
            if docker-compose ps | grep -q postgres; then
                docker-compose exec -T postgres pg_dump -U postgres 1001stories | \
                sudo tee "$BACKUP_PATH/db-backup-$DEPLOYMENT_ID.sql" > /dev/null
                echo "✓ Database backup created: $BACKUP_PATH/db-backup-$DEPLOYMENT_ID.sql"
            fi
        fi
        
        # 업로드된 파일 백업
        if [ -d "$DEPLOY_PATH/public/books" ]; then
            sudo cp -r "$DEPLOY_PATH/public/books" "$BACKUP_PATH/books-backup-$DEPLOYMENT_ID"
            echo "✓ Books backup created"
        fi
        
        # 오래된 백업 정리 (7일 이상된 백업 삭제)
        find "$BACKUP_PATH" -name "backup-*" -mtime +7 -exec sudo rm -rf {} + 2>/dev/null || true
        find "$BACKUP_PATH" -name "db-backup-*" -mtime +7 -exec sudo rm -f {} + 2>/dev/null || true
        find "$BACKUP_PATH" -name "books-backup-*" -mtime +7 -exec sudo rm -rf {} + 2>/dev/null || true
EOF
    
    log "${GREEN}✓ Pre-deployment backup completed${NC}"
}

# 헬스체크 함수
health_check() {
    local max_attempts=${1:-30}  # 기본 30회 시도 (5분)
    local attempt=0
    
    log "${YELLOW}Performing health check...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s --max-time 5 "https://$DOMAIN/api/health" > /dev/null 2>&1; then
            log "${GREEN}✓ Health check passed (attempt $((attempt + 1)))${NC}"
            return 0
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -lt $max_attempts ]; then
            log "${YELLOW}Health check failed, retrying in 10 seconds... (attempt $attempt/$max_attempts)${NC}"
            sleep 10
        fi
    done
    
    log "${RED}✗ Health check failed after $max_attempts attempts${NC}"
    return 1
}

# 무중단 배포 함수
zero_downtime_deploy() {
    log "${YELLOW}Starting zero-downtime deployment...${NC}"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << EOF
        set -e
        
        cd "$DEPLOY_PATH"
        
        # 현재 실행 중인 컨테이너 정보 저장
        docker-compose ps --services --filter "status=running" > /tmp/running_services.txt
        
        # Git 업데이트
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
        
        # 의존성 및 이미지 업데이트
        docker-compose build --pull --no-cache app
        
        # 새 이미지로 rolling update 수행
        docker-compose up -d --no-deps app
        
        # 컨테이너가 시작될 때까지 대기
        sleep 15
        
        # 헬스체크를 위한 내부 포트 확인
        timeout 60s bash -c 'until curl -f http://localhost:3000/api/health > /dev/null 2>&1; do sleep 2; done' || {
            echo "Internal health check failed, rolling back..."
            exit 1
        }
        
        # Nginx 설정 리로드 (무중단)
        if docker-compose ps nginx | grep -q "Up"; then
            docker-compose exec nginx nginx -s reload || true
        fi
        
        echo "✓ Zero-downtime deployment completed"
EOF
    
    log "${GREEN}✓ Zero-downtime deployment completed${NC}"
}

# 전통적인 배포 함수 (백업용)
traditional_deploy() {
    log "${YELLOW}Starting traditional deployment...${NC}"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << EOF
        set -e
        
        cd "$DEPLOY_PATH"
        
        # 서비스 중지
        docker-compose down
        
        # Git 업데이트
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
        
        # 업로드된 파일 복구
        BOOKS_BACKUP="$BACKUP_PATH/books-backup-$DEPLOYMENT_ID"
        if [ -d "\$BOOKS_BACKUP" ]; then
            mkdir -p public/books
            cp -r "\$BOOKS_BACKUP"/* public/books/ 2>/dev/null || true
            chown -R \$USER:\$USER public/books
            chmod -R 755 public/books
            echo "✓ Books restored from backup"
        fi
        
        # 이미지 빌드 및 시작
        docker-compose build --no-cache
        docker-compose up -d
        
        echo "✓ Traditional deployment completed"
EOF
    
    log "${GREEN}✓ Traditional deployment completed${NC}"
}

# 롤백 함수
rollback() {
    local backup_id=${1:-""}
    
    if [ -z "$backup_id" ]; then
        # 최신 백업 찾기
        backup_id=$(ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" \
            "ls -t $BACKUP_PATH/backup-* 2>/dev/null | head -n1 | xargs basename" || echo "")
    fi
    
    if [ -z "$backup_id" ]; then
        log "${RED}Error: No backup found for rollback${NC}"
        exit 1
    fi
    
    log "${RED}Rolling back to backup: $backup_id${NC}"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << EOF
        set -e
        
        # 현재 서비스 중지
        cd "$DEPLOY_PATH"
        docker-compose down || true
        
        # 백업에서 복원
        if [ -d "$BACKUP_PATH/$backup_id" ]; then
            sudo rm -rf "$DEPLOY_PATH.old" 2>/dev/null || true
            sudo mv "$DEPLOY_PATH" "$DEPLOY_PATH.old" 2>/dev/null || true
            sudo cp -r "$BACKUP_PATH/$backup_id" "$DEPLOY_PATH"
            sudo chown -R $SERVER_USER:$SERVER_USER "$DEPLOY_PATH"
        else
            echo "Backup directory not found: $BACKUP_PATH/$backup_id"
            exit 1
        fi
        
        # 데이터베이스 롤백
        DB_BACKUP="\$(echo $backup_id | sed 's/backup-/db-backup-/').sql"
        if [ -f "$BACKUP_PATH/\$DB_BACKUP" ]; then
            cd "$DEPLOY_PATH"
            docker-compose up -d postgres
            sleep 10
            cat "$BACKUP_PATH/\$DB_BACKUP" | docker-compose exec -T postgres psql -U postgres -d 1001stories
            echo "✓ Database rolled back"
        fi
        
        # 서비스 재시작
        docker-compose up -d
        
        echo "✓ Rollback completed"
EOF
    
    log "${GREEN}✓ Rollback completed to $backup_id${NC}"
    send_notification "warning" "Rollback completed to $backup_id" "$DEPLOYMENT_ID"
}

# 배포 정보 기록
record_deployment() {
    local status=$1
    local duration=$(($(date +%s) - START_TIME))
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << EOF
        # 배포 로그 기록
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Deployment $DEPLOYMENT_ID - Status: $status - Duration: ${duration}s - Branch: $BRANCH" | \
        sudo tee -a /var/log/deployments.log > /dev/null
        
        # Git 커밋 정보 기록
        if [ "$status" = "success" ]; then
            cd "$DEPLOY_PATH"
            git log -1 --pretty=format:"%H %s" | \
            sudo tee -a /var/log/deployments.log > /dev/null
        fi
EOF
}

# 에러 발생시 정리 작업
cleanup_on_error() {
    log "${RED}Performing cleanup after error...${NC}"
    
    # 실패한 배포의 정보 기록
    record_deployment "failed"
    
    # 자동 롤백 (설정된 경우)
    if [ "${AUTO_ROLLBACK:-false}" = "true" ]; then
        log "${YELLOW}Auto-rollback is enabled, performing rollback...${NC}"
        rollback
    fi
}

# 배포 후 검증
post_deployment_verification() {
    log "${YELLOW}Performing post-deployment verification...${NC}"
    
    # 헬스체크
    if ! health_check 30; then
        log "${RED}Post-deployment health check failed${NC}"
        return 1
    fi
    
    # 주요 엔드포인트 확인
    local endpoints=(
        "/api/health"
        "/login"
        "/signup"
        "/dashboard/learner"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s --max-time 10 "https://$DOMAIN$endpoint" > /dev/null; then
            log "${GREEN}✓ Endpoint accessible: $endpoint${NC}"
        else
            log "${YELLOW}⚠ Endpoint check failed: $endpoint${NC}"
        fi
    done
    
    # 데이터베이스 연결 확인
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'EOF'
        cd /home/ubuntu/1001-stories
        if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            echo "✓ Database connection verified"
        else
            echo "⚠ Database connection check failed"
        fi
EOF
    
    log "${GREEN}✓ Post-deployment verification completed${NC}"
}

# 메인 배포 함수
main_deploy() {
    local deploy_type=${1:-"zero-downtime"}
    
    log "${BLUE}========================================${NC}"
    log "${BLUE}   Starting deployment: $DEPLOYMENT_ID   ${NC}"
    log "${BLUE}========================================${NC}"
    
    send_notification "info" "Deployment started" "$DEPLOYMENT_ID"
    
    # Prerequisites 확인
    check_prerequisites
    
    # 사전 백업
    pre_deployment_backup
    
    # 배포 실행
    case $deploy_type in
        "zero-downtime")
            zero_downtime_deploy
            ;;
        "traditional")
            traditional_deploy
            ;;
        *)
            log "${RED}Unknown deployment type: $deploy_type${NC}"
            exit 1
            ;;
    esac
    
    # 배포 후 검증
    if post_deployment_verification; then
        local duration=$(($(date +%s) - START_TIME))
        log "${GREEN}🎉 Deployment completed successfully! (Duration: ${duration}s)${NC}"
        record_deployment "success"
        send_notification "success" "Deployment completed successfully (${duration}s)" "$DEPLOYMENT_ID"
    else
        log "${RED}Post-deployment verification failed${NC}"
        record_deployment "failed"
        send_notification "error" "Post-deployment verification failed" "$DEPLOYMENT_ID"
        exit 1
    fi
}

# 모니터링 설정 배포
deploy_monitoring() {
    log "${YELLOW}Deploying monitoring stack...${NC}"
    
    # 모니터링 파일들을 서버로 복사
    scp -i "$PEM_FILE" -r monitoring/ "$SERVER_USER@$SERVER_IP:/tmp/monitoring/"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'EOF'
        set -e
        
        # 모니터링 디렉토리 준비
        sudo mkdir -p /opt/monitoring
        sudo cp -r /tmp/monitoring/* /opt/monitoring/
        sudo chown -R $USER:$USER /opt/monitoring
        
        # 환경 변수 설정
        cd /opt/monitoring
        if [ ! -f .env ]; then
            cat > .env << EOL
GRAFANA_PASSWORD=$(openssl rand -base64 32)
SMTP_HOST=smtp.gmail.com:587
SMTP_USER=${SMTP_USER:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}
SMTP_FROM=alerts@1001stories.org
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-}
EOL
        fi
        
        # 모니터링 스택 시작
        docker-compose -f docker-compose.monitoring.yml up -d
        
        # 헬스체크 스크립트를 cron에 등록
        chmod +x health-check.sh backup-database.sh
        
        # 기존 cron 작업 제거
        crontab -l 2>/dev/null | grep -v "1001stories" | crontab - || true
        
        # 새 cron 작업 추가
        (crontab -l 2>/dev/null; cat << 'EOCRON'
# 1001 Stories Health Check - 매 5분마다
*/5 * * * * /opt/monitoring/health-check.sh >> /var/log/health-check.log 2>&1

# 1001 Stories Database Backup - 매일 새벽 2시
0 2 * * * /opt/monitoring/backup-database.sh >> /var/log/backup.log 2>&1

# 1001 Stories Weekly Full Backup - 매주 일요일 새벽 3시
0 3 * * 0 RESTORE_TEST=true /opt/monitoring/backup-database.sh >> /var/log/backup.log 2>&1
EOCRON
        ) | crontab -
        
        echo "✓ Monitoring stack deployed and scheduled"
EOF
    
    log "${GREEN}✓ Monitoring stack deployment completed${NC}"
}

# 사용법 출력
show_help() {
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  deploy [zero-downtime|traditional]  - Deploy application (default: zero-downtime)"
    echo "  rollback [backup-id]                - Rollback to previous version"
    echo "  monitoring                          - Deploy monitoring stack"
    echo "  logs [lines]                        - Show application logs"
    echo "  status                              - Show deployment status"
    echo "  cleanup                             - Clean old backups and images"
    echo ""
    echo "Environment variables:"
    echo "  SERVER_IP        - Target server IP"
    echo "  SERVER_USER      - SSH user (default: ubuntu)"
    echo "  PEM_FILE         - Path to PEM key file"
    echo "  BRANCH           - Git branch to deploy (default: feature/role-system-v2)"
    echo "  AUTO_ROLLBACK    - Auto rollback on failure (default: false)"
    echo "  SLACK_WEBHOOK_URL - Slack webhook for notifications"
}

# 메인 실행 로직
case "${1:-deploy}" in
    deploy)
        main_deploy "${2:-zero-downtime}"
        ;;
    rollback)
        rollback "$2"
        ;;
    monitoring)
        deploy_monitoring
        ;;
    logs)
        ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" \
            "cd $DEPLOY_PATH && docker-compose logs --tail=${2:-50}"
        ;;
    status)
        ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" \
            "cd $DEPLOY_PATH && docker-compose ps && echo && tail -10 /var/log/deployments.log"
        ;;
    cleanup)
        ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" \
            "docker system prune -af --volumes && sudo find $BACKUP_PATH -mtime +30 -delete"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac