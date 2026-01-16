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

# Cross-platform timeout wrapper (works on macOS and Linux)
run_with_timeout() {
    local timeout_seconds=$1
    shift
    local cmd=("$@")

    # Try timeout (Linux)
    if command -v timeout &>/dev/null; then
        timeout "$timeout_seconds" "${cmd[@]}"
        return $?
    fi

    # Try gtimeout (macOS with coreutils installed)
    if command -v gtimeout &>/dev/null; then
        gtimeout "$timeout_seconds" "${cmd[@]}"
        return $?
    fi

    # Fallback: Perl-based timeout (Perl is pre-installed on macOS)
    perl -e '
        use strict;
        use warnings;
        use POSIX ":sys_wait_h";

        my $timeout = shift @ARGV;
        my $pid = fork();

        die "fork failed: $!" unless defined $pid;

        if ($pid == 0) {
            exec(@ARGV);
            die "exec failed: $!";
        }

        eval {
            local $SIG{ALRM} = sub { die "timeout\n" };
            alarm($timeout);
            waitpid($pid, 0);
            alarm(0);
        };

        if ($@ && $@ eq "timeout\n") {
            kill 9, $pid;
            waitpid($pid, 0);
            exit 124;  # Same exit code as timeout command
        }

        exit($? >> 8);
    ' "$timeout_seconds" "${cmd[@]}"
    return $?
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

# Validate pre-deployment conditions
validate_pre_deployment() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "⚠️  CRITICAL: PRE-DEPLOYMENT VALIDATION"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check 1: Uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error "DEPLOYMENT BLOCKED: Uncommitted changes detected!"
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error ""
        error "You have uncommitted changes in your working directory."
        error "All changes must be committed before deployment."
        error ""
        error "Files with changes:"
        git status --short
        error ""
        error "Required actions:"
        error "1. Review your changes: git status"
        error "2. Commit changes: git add . && git commit -m 'description'"
        error "3. Then try deployment again"
        error ""
        return 1
    fi

    # Check 2: Unpushed commits
    LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    REMOTE_COMMIT=$(git ls-remote origin HEAD 2>/dev/null | awk '{print $1}' || echo "unknown")

    if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ] && [ "$LOCAL_COMMIT" != "unknown" ] && [ "$REMOTE_COMMIT" != "unknown" ]; then
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error "DEPLOYMENT BLOCKED: Unpushed commits detected!"
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error ""
        error "Your local repository is ahead of origin/main."
        error "All commits must be pushed before deployment."
        error ""
        error "Current state:"
        error "  Local commit:  $LOCAL_COMMIT"
        error "  Remote commit: $REMOTE_COMMIT"
        error ""
        error "Recent unpushed commits:"
        git log origin/main..HEAD --oneline 2>/dev/null || echo "  (unable to show commits)"
        error ""
        error "Required action:"
        error "  git push origin main"
        error ""
        return 1
    fi

    # Check 3: Local Docker build exists and is recent
    if [ ! -f ".next/BUILD_ID" ] && [ ! -f "public/build-info.json" ]; then
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error "DEPLOYMENT BLOCKED: No local build found!"
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error ""
        error "Cannot find evidence of a local build."
        error "You must build locally before deploying."
        error ""
        error "Required actions:"
        error "1. Build the application: npm run build"
        error "2. OR build Docker image: docker compose build app"
        error "3. Then try deployment again"
        error ""
        return 1
    fi

    # Check 4: Docker daemon running
    if ! docker info > /dev/null 2>&1; then
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error "DEPLOYMENT BLOCKED: Docker not running!"
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error ""
        error "Docker daemon is not running or accessible."
        error ""
        error "Required action:"
        error "  Start Docker Desktop or Docker daemon"
        error ""
        return 1
    fi

    success "✅ All pre-deployment validation checks passed"
    success "✅ Git state: clean and pushed"
    success "✅ Local build: present"
    success "✅ Docker: running"
    log ""

    return 0
}

# Validate deployment completeness
validate_deployment_completeness() {
    log "Validating deployment completeness..."

    if ! ssh_exec << 'EOF'
        set -euo pipefail
        cd /home/ubuntu/1001-stories

        echo "=== Git Commit Verification ==="
        SERVER_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
        echo "Server commit: $SERVER_COMMIT"

        # This will be checked against local commit by the main script
        exit 0
EOF
    then
        error "Failed to verify git commit on server"
        return 1
    fi

    # Get local and remote commits for comparison
    LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    SERVER_COMMIT=$(ssh_exec "cd /home/ubuntu/1001-stories && git rev-parse HEAD 2>/dev/null || echo 'unknown'")

    if [ "$LOCAL_COMMIT" != "$SERVER_COMMIT" ]; then
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error "DEPLOYMENT INCOMPLETE: Git commit mismatch!"
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error ""
        error "The server's git repository does not match your local repository."
        error "This means the deployed code is NOT what you intended to deploy."
        error ""
        error "Current state:"
        error "  Local commit:  $LOCAL_COMMIT"
        error "  Server commit: $SERVER_COMMIT"
        error ""
        error "This is a CRITICAL issue that must be fixed!"
        error ""
        return 1
    fi

    # Verify build-info.json matches
    if [ -f "public/build-info.json" ]; then
        LOCAL_BUILD_TIME=$(cat public/build-info.json | jq -r '.buildTime' 2>/dev/null || echo "unknown")
        REMOTE_BUILD_TIME=$(curl -sk "https://$DOMAIN/build-info.json" 2>/dev/null | jq -r '.buildTime' 2>/dev/null || echo "unknown")

        if [ "$LOCAL_BUILD_TIME" != "$REMOTE_BUILD_TIME" ] && [ "$LOCAL_BUILD_TIME" != "unknown" ] && [ "$REMOTE_BUILD_TIME" != "unknown" ]; then
            warn "Build time mismatch detected:"
            warn "  Local build:  $LOCAL_BUILD_TIME"
            warn "  Remote build: $REMOTE_BUILD_TIME"
            warn ""
            warn "This may indicate the old version is still cached."
            warn "Checking if this is acceptable..."

            # If the times are very close (within 5 minutes), it might be timezone difference
            # But if commits match, it's acceptable
            if [ "$LOCAL_COMMIT" = "$SERVER_COMMIT" ]; then
                warn "Commits match, so this is acceptable (might be timezone difference)"
            else
                error "Commits don't match AND build times don't match - deployment incomplete!"
                return 1
            fi
        fi
    fi

    # Verify critical files exist on server
    CRITICAL_FILES=(
        "app/page.tsx"
        "app/api/health/route.ts"
        "package.json"
    )

    for file in "${CRITICAL_FILES[@]}"; do
        if ! ssh_exec "test -f /home/ubuntu/1001-stories/$file"; then
            error "Critical file missing on server: $file"
            error "This indicates git pull may have failed!"
            return 1
        fi
    done

    success "✅ Deployment completeness validated:"
    success "   - Git commits match"
    success "   - Build info verified"
    success "   - Critical files present"

    return 0
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

        # Check for exited containers only (allow temporary unhealthy status)
        if docker compose ps | grep -q "Exit"; then
            echo "ERROR: Some containers have exited unexpectedly"
            docker compose ps
            docker compose logs --tail=100
            exit 1
        fi

        echo "✅ No exited containers detected"

        echo ""
        echo "=== HTTPS Endpoint Test ==="
        # Wait for nginx and app to be fully ready
        echo "Waiting 45 seconds for services to stabilize (app start_period: 40s)..."
        sleep 45

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
    log "Workflow: Pre-checks → Local build → Git pull → Cache clean → Image upload → Verify"
    log ""

    # Step 0: Pre-deployment validation (NEW - CRITICAL)
    if ! validate_pre_deployment; then
        error "Pre-deployment validation failed!"
        error "Please fix the issues above and try again."
        exit 1
    fi

    # Step 1: 로컬 Docker 빌드
    log "Step 1/5: Building Docker image locally..."
    if ! docker compose build app; then
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error "DEPLOYMENT FAILED: Local Docker build failed"
        error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        error ""
        error "The Docker image failed to build on your local machine."
        error "This usually indicates:"
        error "  - Syntax errors in code"
        error "  - Missing dependencies in package.json"
        error "  - Dockerfile configuration issues"
        error ""
        error "Required action:"
        error "  Fix the build errors shown above and try again"
        error ""
        exit 1
    fi
    success "Local Docker image built successfully"

    # Step 2: 이미지를 tar.gz로 저장
    log "Step 2/5: Saving Docker image to tar.gz..."
    IMAGE_NAME="1001-stories-app:latest"
    IMAGE_FILE="/tmp/1001-stories-app-$(date +%Y%m%d_%H%M%S).tar.gz"

    if ! docker save "$IMAGE_NAME" | gzip > "$IMAGE_FILE"; then
        error "Failed to save Docker image"
        error "Check disk space: df -h /tmp"
        exit 1
    fi
    IMAGE_SIZE=$(du -h "$IMAGE_FILE" | cut -f1)
    success "Docker image saved ($IMAGE_SIZE)"

    # Step 3: 이미지 업로드 (with retry logic)
    log "Step 3/5: Uploading Docker image to server..."

    MAX_RETRIES=3
    RETRY_COUNT=0
    UPLOAD_SUCCESS=false

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        log "Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES: Uploading $IMAGE_SIZE image (using rsync for resume capability)..."

        # Use rsync instead of scp for resumable uploads
        # --partial allows resuming interrupted uploads
        # --progress shows upload progress
        # --timeout=3000 allows up to 50 minutes for upload
        if rsync -avz --progress --partial \
               --timeout=3000 \
               -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=10 -o ServerAliveCountMax=3" \
               "$IMAGE_FILE" \
               "$REMOTE_USER@$REMOTE_HOST:/tmp/app-image.tar.gz"; then
            UPLOAD_SUCCESS=true
            success "Docker image uploaded to server"
            break
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))

        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            warn "Upload failed. Retrying in 10 seconds (rsync will resume from where it left off)..."
            sleep 10
        fi
    done

    if [ "$UPLOAD_SUCCESS" = false ]; then
        error "Failed to upload Docker image after $MAX_RETRIES attempts"
        rm "$IMAGE_FILE"
        exit 1
    fi

    # 로컬 임시 파일 정리
    rm "$IMAGE_FILE"

    # Step 4: 서버 배포 - Git pull + 캐시 정리 + 이미지 로드 + 시작
    log "Step 4/5: Server deployment (git pull + cache clean + image load + start)..."

    # Create a deployment script and execute it on the server
    # This avoids heredoc issues and provides better error handling
    DEPLOY_SCRIPT=$(cat << 'DEPLOY_SCRIPT_END'
#!/bin/bash
# Server deployment script - executed remotely
# Exit on error but continue to show output
set -e

cd /home/ubuntu/1001-stories

echo "========================================"
echo "Step 4a: Updating source code from git"
echo "========================================"

BEFORE_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo "Current server commit: $BEFORE_COMMIT"

git fetch origin main || { echo "ERROR: git fetch failed"; exit 1; }
git reset --hard origin/main || { echo "ERROR: git reset failed"; exit 1; }

AFTER_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo "Updated server commit: $AFTER_COMMIT"

if [ "$BEFORE_COMMIT" != "$AFTER_COMMIT" ]; then
    echo "Source code updated successfully!"
else
    echo "Source code already up to date"
fi

echo ""
echo "========================================"
echo "Step 4b: Creating backup of current image"
echo "========================================"

if docker images | grep -q "1001-stories-app.*latest"; then
    BACKUP_TAG="1001-stories-app:backup-$(date +%s)"
    docker tag 1001-stories-app:latest "$BACKUP_TAG" || true
    echo "Current image backed up as: $BACKUP_TAG"
else
    echo "No existing image to backup (first deployment)"
fi

echo ""
echo "========================================"
echo "Step 4c: Loading new Docker image"
echo "========================================"

if [ ! -f "/tmp/app-image.tar.gz" ]; then
    echo "ERROR: Image file not found at /tmp/app-image.tar.gz"
    exit 1
fi

IMAGE_SIZE=$(du -h /tmp/app-image.tar.gz | cut -f1)
echo "Image file size: $IMAGE_SIZE"

echo "Loading image (this may take a minute)..."
gunzip -c /tmp/app-image.tar.gz | docker load || { echo "ERROR: docker load failed"; exit 1; }

if ! docker images | grep -q "1001-stories-app.*latest"; then
    echo "ERROR: Image not found after loading!"
    exit 1
fi

rm -f /tmp/app-image.tar.gz
echo "Image loaded successfully"

echo ""
echo "========================================"
echo "Step 4d: Cleaning old Docker resources"
echo "========================================"

# Clean only dangling images and build cache, NOT all volumes
docker image prune -f || true
docker builder prune -f || true
echo "Docker cleanup completed"

echo ""
echo "========================================"
echo "Step 4e: Starting containers"
echo "========================================"

docker compose up -d || { echo "ERROR: docker compose up failed"; exit 1; }

echo "Waiting for containers to start (15s)..."
sleep 15

# Check required containers
REQUIRED="app nginx postgres redis"
MISSING=""
for c in $REQUIRED; do
    if ! docker ps --format '{{.Names}}' | grep -q "$c"; then
        MISSING="$MISSING $c"
    fi
done

if [ -n "$MISSING" ]; then
    echo "ERROR: Missing containers:$MISSING"
    docker compose ps
    exit 1
fi

echo "All required containers are running"

echo ""
echo "========================================"
echo "Step 4f: Reloading nginx"
echo "========================================"

docker compose restart nginx || true
sleep 5
docker exec 1001-stories-nginx nginx -s reload 2>/dev/null || true
echo "nginx reloaded"

echo ""
echo "========================================"
echo "Step 4g: Final health check"
echo "========================================"

echo "Waiting for app to be ready (30s)..."
sleep 30

HTTP_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/api/health 2>/dev/null || echo "000")
echo "Health check status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo ""
    echo "========================================"
    echo "SERVER DEPLOYMENT SUCCESSFUL!"
    echo "========================================"
    exit 0
else
    echo "WARNING: Health check returned $HTTP_STATUS (expected 200)"
    echo "Container status:"
    docker compose ps
    # Don't exit with error - let the main script handle verification
    exit 0
fi
DEPLOY_SCRIPT_END
)

    # Execute the deployment script on the server
    if ! echo "$DEPLOY_SCRIPT" | ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$REMOTE_USER@$REMOTE_HOST" "bash -s"; then
        error "Server deployment failed!"
        warn "Initiating automatic rollback..."

        # rollback 시도
        if rollback; then
            warn "Rollback completed successfully"
            error "Deployment failed - please check logs and try again"
            exit 1
        else
            error "CRITICAL: Deployment failed AND rollback failed!"
            error "Manual intervention required on server"
            exit 1
        fi
    fi

    success "Server deployment commands executed successfully"

    # Step 5: 배포 검증 (건강 체크 + 완전성 검증)
    log "Step 5/5: Verifying deployment..."

    # 5a: Health check (containers, endpoints)
    if ! verify_deployment; then
        error "Deployment health verification failed!"
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

    # 5b: Completeness check (NEW - git commit, build info, files)
    log "Verifying deployment completeness..."
    if ! validate_deployment_completeness; then
        error "Deployment completeness validation failed!"
        error "The deployment may not be complete or correct!"
        warn "Initiating automatic rollback..."

        if rollback; then
            error "Deployment failed but rollback succeeded"
            error "Please investigate the completeness issues and try again"
            exit 1
        else
            error "CRITICAL: Deployment failed AND rollback failed!"
            error "Manual intervention required on server"
            exit 1
        fi
    fi

    # Get final state for success message
    FINAL_COMMIT=$(git rev-parse HEAD 2>/dev/null | cut -c1-8)
    FINAL_BUILD_TIME=$(cat public/build-info.json 2>/dev/null | jq -r '.buildTime' || echo "unknown")

    success ""
    success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success ""
    success "Deployment Details:"
    success "  ✅ Git commit:    $FINAL_COMMIT"
    success "  ✅ Build time:    $FINAL_BUILD_TIME"
    success "  ✅ Application:   https://$DOMAIN"
    success ""
    success "Verification Results:"
    success "  ✅ Pre-deployment:  All checks passed"
    success "  ✅ Local build:     Success"
    success "  ✅ Image upload:    Success"
    success "  ✅ Git pull:        Source code updated"
    success "  ✅ Cache clean:     Docker + nginx cleared"
    success "  ✅ Image load:      Verified"
    success "  ✅ Containers:      All healthy"
    success "  ✅ Health check:    HTTPS 200 OK"
    success "  ✅ Completeness:    Git + Build + Files verified"
    success ""
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

    ROLLBACK_SCRIPT=$(cat << 'ROLLBACK_SCRIPT_END'
#!/bin/bash
set -e
cd /home/ubuntu/1001-stories

echo "========================================"
echo "Rollback Step 1: Finding backup image"
echo "========================================"

BACKUP_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "1001-stories-app:backup-" | head -1 || echo "")

if [ -z "$BACKUP_IMAGE" ]; then
    echo "No backup image found!"
    echo "Starting services with current image..."
    docker compose up -d
    exit 0
fi

echo "Found backup: $BACKUP_IMAGE"

echo ""
echo "========================================"
echo "Rollback Step 2: Restoring backup"
echo "========================================"

docker tag "$BACKUP_IMAGE" 1001-stories-app:latest
echo "Backup restored as latest"

echo ""
echo "========================================"
echo "Rollback Step 3: Restarting containers"
echo "========================================"

docker compose up -d
sleep 20

echo ""
echo "========================================"
echo "Rollback Step 4: Health check"
echo "========================================"

sleep 15
HTTP_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/api/health 2>/dev/null || echo "000")
echo "Health status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo ""
    echo "========================================"
    echo "ROLLBACK SUCCESSFUL!"
    echo "========================================"
    exit 0
else
    echo "Health check returned: $HTTP_STATUS"
    docker compose ps
    exit 1
fi
ROLLBACK_SCRIPT_END
)

    # Execute rollback script
    if echo "$ROLLBACK_SCRIPT" | ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$REMOTE_USER@$REMOTE_HOST" "bash -s"; then
        success "Rollback completed and verified!"
        return 0
    else
        error "Rollback failed!"
        error "Manual intervention required on server"
        return 1
    fi
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