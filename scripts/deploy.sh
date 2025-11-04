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

# Build and deploy application
deploy() {
    log "Starting deployment to production..."

    # Verify local build
    log "Building application locally for verification..."
    if ! npm run build; then
        error "Local build failed. Aborting deployment."
        exit 1
    fi
    success "Local build successful"

    # Sync files
    rsync_deploy

    # Remote deployment steps
    log "Executing remote deployment steps..."
    ssh_exec << 'EOF'
        set -euo pipefail
        cd /home/ubuntu/1001-stories

        # Pull latest environment if exists
        if [ -f .env.production ]; then
            echo "Using existing production environment"
        else
            echo "WARNING: No .env.production file found"
            echo "Copy .env.production.example to .env.production and configure"
        fi

        # Stop existing containers
        echo "Stopping existing containers..."
        docker compose down || true

        # Backup database (if running)
        if docker ps -q -f name=postgres; then
            echo "Creating database backup..."
            mkdir -p backups
            docker exec postgres pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-stories_db} > "backups/backup_$(date +%Y%m%d_%H%M%S).sql" || echo "Backup failed (container may not be running)"
        fi

        # Clean up old images
        echo "Cleaning up Docker images..."
        docker image prune -f

        # Build and start new containers
        echo "Building and starting containers..."
        docker compose build --no-cache
        docker compose up -d

        # Wait for services to be healthy
        echo "Waiting for services to start..."
        sleep 30

        # Check service health
        if docker compose ps | grep -q "unhealthy\|Exit"; then
            echo "ERROR: Some services are unhealthy"
            docker compose ps
            docker compose logs --tail=50
            exit 1
        fi

        echo "Deployment completed successfully!"
EOF

    success "Deployment completed successfully!"
    log "Application should be available at: https://$DOMAIN"
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
            docker exec -i postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-stories_db} < "$LATEST_BACKUP"
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