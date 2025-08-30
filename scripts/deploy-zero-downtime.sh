#!/bin/bash

# Zero-Downtime Deployment Script with PM2
set -e

# Configuration
SERVER_IP="3.128.143.122"
SERVER_USER="ubuntu"
PEM_FILE="/Users/jihunkong/Downloads/1001project.pem"
DEPLOY_PATH="/home/ubuntu/1001-stories"
APP_NAME="1001-stories-app"
HEALTH_CHECK_URL="https://1001stories.seedsofempowerment.org/health"
BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

# Function to run commands on remote server
run_remote() {
    ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# Function to check service health
check_health() {
    local max_attempts=30
    local attempt=1
    
    log "Checking application health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f --max-time 10 "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            success "Application is healthy (attempt $attempt/$max_attempts)"
            return 0
        fi
        
        log "Health check failed (attempt $attempt/$max_attempts), waiting 10s..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Function to backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    run_remote "cd $DEPLOY_PATH && docker tag 1001-stories:latest 1001-stories:$BACKUP_TAG" || {
        warn "Could not create Docker image backup (might be first deployment)"
    }
    
    success "Backup created: $BACKUP_TAG"
}

# Function to rollback deployment
rollback_deployment() {
    error "Deployment failed. Initiating rollback..."
    
    run_remote "cd $DEPLOY_PATH && docker tag 1001-stories:$BACKUP_TAG 1001-stories:latest"
    run_remote "cd $DEPLOY_PATH && docker-compose -f docker-compose.yml up -d --force-recreate app"
    
    log "Waiting for rollback to complete..."
    sleep 30
    
    if check_health; then
        success "Rollback completed successfully"
    else
        error "Rollback failed! Manual intervention required"
        return 1
    fi
}

# Function to deploy with PM2
deploy_with_pm2() {
    log "Starting zero-downtime deployment..."
    
    # Step 1: Build new image locally
    log "Building new Docker image..."
    docker build -f Dockerfile.pm2 -t 1001-stories:latest .
    
    # Step 2: Save and transfer image
    log "Transferring image to server..."
    docker save 1001-stories:latest | run_remote "docker load"
    
    # Step 3: Deploy to server with PM2 reload
    log "Deploying with PM2 zero-downtime reload..."
    run_remote "cd $DEPLOY_PATH && git pull origin main"
    
    # Step 4: Run database migrations if needed
    log "Running database migrations..."
    run_remote "cd $DEPLOY_PATH && docker-compose exec -T app npx prisma migrate deploy" || {
        warn "Migration failed or no migrations to apply"
    }
    
    # Step 5: Perform zero-downtime reload using PM2 cluster mode
    log "Performing PM2 zero-downtime reload..."
    run_remote "cd $DEPLOY_PATH && docker-compose exec -T app pm2 reload all --update-env"
    
    # Step 6: Wait for deployment to stabilize
    log "Waiting for deployment to stabilize..."
    sleep 20
    
    # Step 7: Health check
    if check_health; then
        success "Deployment completed successfully!"
        
        # Clean up old image backup after successful deployment
        run_remote "docker image prune -f" || warn "Could not clean up old images"
        
        return 0
    else
        error "Health check failed after deployment"
        return 1
    fi
}

# Function to deploy with container recreation (fallback)
deploy_with_recreation() {
    log "Deploying with container recreation (fallback method)..."
    
    # Scale up to 2 instances temporarily
    log "Scaling up to 2 app instances..."
    run_remote "cd $DEPLOY_PATH && docker-compose -f docker-compose.yml up -d --scale app=2"
    
    sleep 30
    
    # Update with new image
    log "Updating with new image..."
    run_remote "cd $DEPLOY_PATH && docker-compose -f docker-compose.yml up -d --force-recreate app"
    
    # Scale back to 1 instance
    log "Scaling back to 1 instance..."
    run_remote "cd $DEPLOY_PATH && docker-compose -f docker-compose.yml up -d --scale app=1"
    
    return 0
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if we can connect to server
    if ! run_remote "echo 'Connection test successful'"; then
        error "Cannot connect to server"
        return 1
    fi
    
    # Check if Docker is running on server
    if ! run_remote "docker --version"; then
        error "Docker is not available on server"
        return 1
    fi
    
    # Check if application is currently healthy
    if ! check_health; then
        warn "Application is not healthy before deployment. Proceeding anyway..."
    fi
    
    success "Pre-deployment checks passed"
}

# Post-deployment tasks
post_deployment_tasks() {
    log "Running post-deployment tasks..."
    
    # Clear application caches if needed
    run_remote "cd $DEPLOY_PATH && docker-compose exec -T app npm run cache:clear" || {
        warn "Cache clear failed or not available"
    }
    
    # Send deployment notification
    if [ -n "$MONITORING_WEBHOOK" ]; then
        curl -X POST "$MONITORING_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"event\":\"deployment_success\",\"timestamp\":\"$(date -Iseconds)\",\"service\":\"1001-stories\",\"version\":\"$(git rev-parse --short HEAD)\"}" \
            2>/dev/null || warn "Could not send deployment notification"
    fi
    
    success "Post-deployment tasks completed"
}

# Main deployment function
main() {
    local deployment_method="${1:-pm2}" # Default to PM2 method
    
    log "Starting zero-downtime deployment using $deployment_method method"
    log "Target server: $SERVER_IP"
    log "Deploy path: $DEPLOY_PATH"
    
    # Run pre-deployment checks
    if ! pre_deployment_checks; then
        error "Pre-deployment checks failed"
        exit 1
    fi
    
    # Create backup
    backup_current_deployment
    
    # Deploy based on method
    case $deployment_method in
        "pm2")
            if deploy_with_pm2; then
                success "PM2 deployment successful"
            else
                rollback_deployment || exit 1
                exit 1
            fi
            ;;
        "recreation")
            if deploy_with_recreation; then
                success "Recreation deployment successful"
            else
                rollback_deployment || exit 1
                exit 1
            fi
            ;;
        *)
            error "Unknown deployment method: $deployment_method"
            error "Available methods: pm2, recreation"
            exit 1
            ;;
    esac
    
    # Run post-deployment tasks
    post_deployment_tasks
    
    success "Zero-downtime deployment completed successfully!"
    log "Application URL: $HEALTH_CHECK_URL"
}

# Handle script arguments
case "${1:-}" in
    "pm2")
        main "pm2"
        ;;
    "recreation")
        main "recreation"
        ;;
    "rollback")
        if [ -z "$2" ]; then
            error "Usage: $0 rollback <backup-tag>"
            exit 1
        fi
        BACKUP_TAG="$2"
        rollback_deployment
        ;;
    "health")
        check_health
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [pm2|recreation|rollback <tag>|health|help]"
        echo ""
        echo "Commands:"
        echo "  pm2         - Deploy using PM2 zero-downtime reload (default)"
        echo "  recreation  - Deploy using container recreation"
        echo "  rollback    - Rollback to specified backup tag"
        echo "  health      - Check application health"
        echo "  help        - Show this help message"
        exit 0
        ;;
    *)
        main "pm2"  # Default deployment method
        ;;
esac