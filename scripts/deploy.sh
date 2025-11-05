#!/bin/bash

# 1001 Stories Deployment Script
# Optimized for Docker-first workflow with proper error handling

set -euo pipefail

# Configuration
REMOTE_HOST="3.128.143.122"
REMOTE_USER="ubuntu"
REMOTE_PATH="/home/ubuntu/1001-stories"
SSH_KEY="/Users/jihunkong/Downloads/1001project.pem"
DOMAIN="1001stories.seedsofempowerment.org"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# SSH command wrapper
ssh_exec() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "$@"
}

# Copy files to remote server
rsync_deploy() {
    log "Syncing files to remote server..."
    rsync -avz --delete \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=.env.local \
        --exclude=.env \
        --exclude=uploads \
        --exclude=nginx/logs \
        --exclude=nginx/ssl \
        --exclude=certbot \
        --exclude=public/generated-images \
        -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
        ./ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
}

# Verify deployment health
verify_deployment() {
    log "Verifying deployment health..."

    # Run verification on remote server
    if ! ssh_exec << 'EOF'
        set -euo pipefail
        cd /home/ubuntu/1001-stories

        echo "=== Container Status Check ==="
        REQUIRED_CONTAINERS="nginx app postgres redis certbot"
        RUNNING_CONTAINERS=$(docker compose ps --format json | jq -r '.Name' 2>/dev/null || docker compose ps --services --filter "status=running")

        # Check each required container
        for container in $REQUIRED_CONTAINERS; do
            if ! echo "$RUNNING_CONTAINERS" | grep -q "$container"; then
                echo "ERROR: Required container '$container' is not running!"
                docker compose ps
                exit 1
            fi
        done

        # Verify nginx specifically (CRITICAL for HTTPS)
        if ! docker ps --format '{{.Names}}' | grep -q "nginx"; then
            echo "CRITICAL ERROR: nginx container is not running!"
            echo "HTTPS will not work without nginx!"
            docker compose ps
            exit 1
        fi

        echo "✅ All required containers are running"

        # Check for unhealthy or exited containers
        if docker compose ps | grep -q "unhealthy\|Exit"; then
            echo "ERROR: Some containers are unhealthy or exited"
            docker compose ps
            docker compose logs --tail=100
            exit 1
        fi

        echo "✅ No unhealthy containers detected"

        echo ""
        echo "=== HTTPS Endpoint Test ==="
        # Wait for nginx and app to be fully ready
        echo "Waiting 30 seconds for services to stabilize..."
        sleep 30

        # Test HTTPS endpoint with retry logic
        MAX_RETRIES=3
        RETRY_COUNT=0
        HTTP_STATUS="000"

        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            echo "Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES: Testing HTTPS endpoint..."
            HTTP_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/api/health 2>&1 || echo "000")

            if [ "$HTTP_STATUS" = "200" ]; then
                echo "✅ HTTPS endpoint test passed (200 OK)"
                break
            fi

            echo "Status: $HTTP_STATUS (Expected: 200)"
            RETRY_COUNT=$((RETRY_COUNT + 1))

            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "Retrying in 10 seconds..."
                sleep 10
            fi
        done

        if [ "$HTTP_STATUS" != "200" ]; then
            echo "ERROR: HTTPS health check failed after $MAX_RETRIES attempts (status: $HTTP_STATUS)"
            echo "Expected: 200, Got: $HTTP_STATUS"
            echo ""
            echo "=== Debugging Information ==="
            echo "Container status:"
            docker compose ps
            echo ""
            echo "Nginx logs (last 50 lines):"
            docker compose logs nginx --tail=50
            echo ""
            echo "App logs (last 50 lines):"
            docker compose logs app --tail=50
            exit 1
        fi
        echo ""
        echo "=== Deployment Verification: SUCCESSFUL ==="
        exit 0
EOF
    then
        error "Deployment verification FAILED!"
        return 1
    fi

    success "Deployment verification PASSED!"
    return 0
}

# Build and deploy application using MANDATORY image-based workflow
# This is the ONLY correct deployment method - prevents server outages
deploy() {
    log "Starting deployment to production..."
    warn "⚠️  Using MANDATORY image-based deployment workflow"
    log "Workflow: 1) Local Docker build → 2) Server cache clean → 3) Image upload"

    # Step 1: 로컬 Docker 빌드
    log "Step 1/4: Building Docker image locally..."
    if ! docker compose build app; then
        error "Local Docker build failed. Aborting deployment."
        exit 1
    fi
    success "Local Docker image built successfully"

    # Step 2: 이미지를 tar.gz로 저장
    log "Step 2/4: Saving Docker image to tar.gz..."
    IMAGE_NAME="1001-stories-app:latest"
    IMAGE_FILE="/tmp/1001-stories-app-$(date +%Y%m%d_%H%M%S).tar.gz"

    if ! docker save "$IMAGE_NAME" | gzip > "$IMAGE_FILE"; then
        error "Failed to save Docker image"
        exit 1
    fi
    IMAGE_SIZE=$(du -h "$IMAGE_FILE" | cut -f1)
    success "Docker image saved ($IMAGE_SIZE)"

    # Step 3: 이미지 업로드
    log "Step 3/4: Uploading Docker image to server..."
    if ! scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$IMAGE_FILE" "$REMOTE_USER@$REMOTE_HOST:/tmp/app-image.tar.gz"; then
        error "Failed to upload Docker image"
        rm "$IMAGE_FILE"
        exit 1
    fi
    success "Docker image uploaded to server"

    # 로컬 임시 파일 정리
    rm "$IMAGE_FILE"

    # Step 4: 서버 배포 - 캐시 정리 + 이미지 로드 + 시작
    log "Step 4/4: Server deployment (cache clean + image load + start)..."
    if ! ssh_exec << 'EOF'
        set -euo pipefail
        cd /home/ubuntu/1001-stories

        # 서버 캐시 정리 (사용자 필수 요구사항)
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Cleaning Docker cache on server..."
        echo "This is MANDATORY to prevent deployment issues"
        docker system prune -af --volumes
        echo "✅ Cache cleaned successfully"

        # 이미지 로드
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Loading pre-built Docker image..."
        gunzip -c /tmp/app-image.tar.gz | docker load
        rm /tmp/app-image.tar.gz
        echo "✅ Image loaded successfully"

        # 컨테이너 시작
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Starting containers from uploaded image..."
        docker compose up -d
        echo "✅ Containers started successfully"

        # 서비스 초기화 대기
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Waiting for services to initialize (30s)..."
        sleep 30

        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ Container startup completed successfully!"
EOF
    then
        error "Server deployment failed during container startup!"
        warn "Initiating automatic rollback..."

        # rollback 시도
        if rollback; then
            error "Deployment failed but rollback succeeded"
            error "Please check logs and try again"
            exit 1
        else
            error "CRITICAL: Deployment failed AND rollback failed!"
            error "Manual intervention required on server"
            exit 1
        fi
    fi

    # 배포 검증 (Step 4 continued)
    log "Verifying deployment..."
    if ! verify_deployment; then
        error "Deployment verification failed!"
        warn "Initiating automatic rollback..."

        if rollback; then
            error "Deployment failed but rollback succeeded"
            error "Please check logs and try again"
            exit 1
        else
            error "CRITICAL: Deployment failed AND rollback failed!"
            error "Manual intervention required on server"
            exit 1
        fi
    fi

    success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "Deployment completed successfully using MANDATORY workflow!"
    success "Application verified and available at: https://$DOMAIN"
    success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."

    ssh_exec << 'EOF'
        set -euo pipefail
        cd /home/ubuntu/1001-stories

        # Start nginx for ACME challenge
        echo "Starting nginx for ACME challenge..."
        docker compose --profile ssl-setup up -d nginx-ssl-setup

        # Wait for nginx to start
        sleep 10

        # Get SSL certificate
        echo "Requesting SSL certificate..."
        docker compose --profile ssl-setup run --rm certbot

        # Stop ACME nginx
        docker compose --profile ssl-setup down

        # Start production services with SSL
        echo "Starting production services with SSL..."
        docker compose up -d

        echo "SSL setup completed!"
EOF

    success "SSL setup completed!"
}

# View deployment logs
logs() {
    log "Fetching application logs..."
    ssh_exec "cd $REMOTE_PATH && docker compose logs --tail=100 -f"
}

# Rollback to previous deployment
rollback() {
    warn "Rolling back deployment..."
    ssh_exec << 'EOF'
        set -euo pipefail
        cd /home/ubuntu/1001-stories

        # Stop current containers
        docker compose down

        # Restore from latest backup if available
        LATEST_BACKUP=$(ls -t backups/*.sql 2>/dev/null | head -1 || echo "")
        if [ -n "$LATEST_BACKUP" ]; then
            echo "Restoring database from: $LATEST_BACKUP"
            # Start only postgres for restore
            docker compose up -d postgres
            sleep 15

            # Restore database
            docker exec -i 1001-stories-postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-stories_db} < "$LATEST_BACKUP"
        else
            echo "No backup found for rollback"
        fi

        # Start services
        docker compose up -d

        echo "Rollback completed"
EOF

    success "Rollback completed!"
}

# Check deployment status
status() {
    log "Checking deployment status..."
    ssh_exec << 'EOF'
        cd /home/ubuntu/1001-stories
        echo "=== Docker Containers ==="
        docker compose ps

        echo -e "\n=== Service Health ==="
        curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "Health check failed"

        echo -e "\n=== Disk Usage ==="
        df -h

        echo -e "\n=== Memory Usage ==="
        free -h

        echo -e "\n=== Recent Logs ==="
        docker compose logs --tail=10
EOF
}

# Test Docker configuration locally
test_local() {
    log "Testing Docker configuration locally..."

    if [ ! -f ".env.docker" ]; then
        error ".env.docker file not found. Please create it from .env.local"
        exit 1
    fi

    # Test local docker compose
    log "Testing local Docker Compose configuration..."
    docker compose -f docker compose.local.yml config

    # Start local containers
    log "Starting local containers for testing..."
    docker compose -f docker compose.local.yml up -d

    # Wait for services
    sleep 30

    # Test health
    if curl -s http://localhost:3000/health > /dev/null; then
        success "Local Docker test successful!"
    else
        error "Local Docker test failed - application not responding"
        docker compose -f docker compose.local.yml logs
        exit 1
    fi

    # Cleanup
    log "Cleaning up test containers..."
    docker compose -f docker compose.local.yml down
}

# Database operations
db_backup() {
    log "Creating database backup..."
    ssh_exec << 'EOF'
        cd /home/ubuntu/1001-stories
        mkdir -p backups
        BACKUP_FILE="backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec postgres pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-stories_db} > "$BACKUP_FILE"
        echo "Backup created: $BACKUP_FILE"
        ls -la backups/ | tail -5
EOF
}

# Main script logic
case "${1:-help}" in
    "deploy")
        deploy
        ;;
    "ssl")
        setup_ssl
        ;;
    "logs")
        logs
        ;;
    "rollback")
        rollback
        ;;
    "status")
        status
        ;;
    "test")
        test_local
        ;;
    "backup")
        db_backup
        ;;
    "help"|*)
        echo "1001 Stories Deployment Script"
        echo ""
        echo "Usage: $0 {deploy|ssl|logs|rollback|status|test|backup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy application to production"
        echo "  ssl      - Setup SSL certificates"
        echo "  logs     - View application logs"
        echo "  rollback - Rollback to previous deployment"
        echo "  status   - Check deployment status"
        echo "  test     - Test Docker configuration locally"
        echo "  backup   - Create manual database backup"
        echo ""
        echo "Examples:"
        echo "  $0 test     # Test locally before deploying"
        echo "  $0 deploy   # Deploy to production"
        echo "  $0 logs     # Monitor application logs"
        echo "  $0 status   # Check if everything is running"
        ;;
esac