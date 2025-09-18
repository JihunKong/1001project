#!/bin/bash

# Production Deployment Script for v3-ui-overhaul
# Server: AWS Lightsail 3.128.143.122
# This script orchestrates the deployment with safety checks

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="3.128.143.122"
SERVER_USER="ubuntu"
PROJECT_DIR="/home/ubuntu/1001project"
BACKUP_BASE="/home/ubuntu/backups"
PEM_FILE="$HOME/Downloads/1001project.pem"
TARGET_BRANCH="v3-ui-overhaul"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Operation cancelled by user"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check PEM file exists
    if [ ! -f "$PEM_FILE" ]; then
        log_error "PEM file not found at $PEM_FILE"
        exit 1
    fi
    
    # Test SSH connection
    if ! ssh -i "$PEM_FILE" -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'" > /dev/null 2>&1; then
        log_error "Cannot connect to server via SSH"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Create backup
create_backup() {
    log_info "Creating backup on server..."
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        set -e
        BACKUP_DIR="/home/ubuntu/backups/$(date +%Y%m%d_%H%M%S)"
        sudo mkdir -p "$BACKUP_DIR"
        
        echo "Backup directory: $BACKUP_DIR"
        
        # Backup database
        echo "Backing up database..."
        docker exec 1001-stories-db pg_dump -U postgres stories_db > "$BACKUP_DIR/database_backup.sql"
        
        # Backup files
        echo "Backing up uploaded files..."
        sudo cp -r /home/ubuntu/1001project/public/books "$BACKUP_DIR/" 2>/dev/null || true
        sudo cp -r /home/ubuntu/1001project/public/books-upload "$BACKUP_DIR/" 2>/dev/null || true
        
        # Backup current code state
        echo "Backing up current code state..."
        cd /home/ubuntu/1001project
        git rev-parse HEAD > "$BACKUP_DIR/current_commit.txt"
        
        # Backup environment
        echo "Backing up environment file..."
        sudo cp /home/ubuntu/1001project/.env "$BACKUP_DIR/.env.backup"
        
        # Backup Docker volumes
        echo "Backing up Docker volumes..."
        docker run --rm -v 1001-stories_postgres_data:/data -v "$BACKUP_DIR":/backup alpine tar -czf /backup/postgres_volume.tar.gz -C /data .
        
        echo "$BACKUP_DIR"
ENDSSH
    
    log_info "Backup completed"
}

# Enable maintenance mode
enable_maintenance() {
    log_info "Enabling maintenance mode..."
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        cd /home/ubuntu/1001project
        
        # Create maintenance page
        cat > maintenance.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance - 1001 Stories</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; opacity: 0.9; }
        .progress {
            width: 200px;
            height: 4px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            margin: 2rem auto;
            overflow: hidden;
        }
        .progress-bar {
            height: 100%;
            background: white;
            animation: progress 2s ease-in-out infinite;
        }
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 System Upgrade in Progress</h1>
        <p>We're making 1001 Stories even better!</p>
        <p>We'll be back in a few minutes.</p>
        <div class="progress">
            <div class="progress-bar"></div>
        </div>
        <p style="font-size: 0.9rem; opacity: 0.7;">Estimated time: 15-20 minutes</p>
    </div>
</body>
</html>
EOF
        
        # Configure nginx for maintenance mode (backup current config first)
        sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
        
        # Note: This would need manual nginx configuration update
        echo "Maintenance page created. Please manually update nginx configuration if needed."
ENDSSH
    
    log_info "Maintenance mode enabled"
}

# Deploy new version
deploy_v3() {
    log_info "Starting deployment of v3-ui-overhaul..."
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        set -e
        cd /home/ubuntu/1001project
        
        # Stop application (keep database running)
        echo "Stopping application container..."
        docker-compose stop app || true
        
        # Stash local changes
        echo "Stashing local changes..."
        git stash save "Production changes before v3 deployment $(date +%Y%m%d_%H%M%S)"
        
        # Fetch and checkout new branch
        echo "Fetching latest code..."
        git fetch origin
        
        echo "Checking out v3-ui-overhaul branch..."
        git checkout v3-ui-overhaul
        git pull origin v3-ui-overhaul
        
        # Restore production environment file
        echo "Restoring production environment..."
        git checkout stash -- .env 2>/dev/null || true
        
        # Restore uploaded files if they exist in backup
        if [ -d "$BACKUP_DIR/books" ]; then
            echo "Restoring uploaded books..."
            cp -r "$BACKUP_DIR/books" public/ 2>/dev/null || true
        fi
        if [ -d "$BACKUP_DIR/books-upload" ]; then
            echo "Restoring uploaded books-upload..."
            cp -r "$BACKUP_DIR/books-upload" public/ 2>/dev/null || true
        fi
        
        # Generate Prisma client
        echo "Generating Prisma client..."
        docker-compose run --rm app npx prisma generate
        
        # Run database migrations
        echo "Running database migrations..."
        docker-compose run --rm app npx prisma migrate deploy
        
        # Build new image
        echo "Building new Docker image..."
        docker-compose build app
        
        # Start services
        echo "Starting services..."
        docker-compose up -d
        
        # Wait for app to be ready
        echo "Waiting for application to be ready..."
        sleep 30
        
        # Check if app is running
        if docker-compose ps | grep -q "app.*Up"; then
            echo "Application started successfully"
        else
            echo "Application failed to start"
            docker-compose logs app
            exit 1
        fi
ENDSSH
    
    log_info "Deployment completed"
}

# Disable maintenance mode
disable_maintenance() {
    log_info "Disabling maintenance mode..."
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        cd /home/ubuntu/1001project
        
        # Remove maintenance page
        rm -f maintenance.html
        
        # Restore nginx configuration if it was backed up
        if [ -f /etc/nginx/sites-available/default.backup ]; then
            sudo mv /etc/nginx/sites-available/default.backup /etc/nginx/sites-available/default
            sudo nginx -t && sudo systemctl reload nginx
        fi
        
        echo "Maintenance mode disabled"
ENDSSH
    
    log_info "Maintenance mode disabled"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        set -e
        
        echo "Checking Docker containers..."
        docker-compose ps
        
        echo ""
        echo "Checking application logs (last 20 lines)..."
        docker-compose logs --tail=20 app
        
        echo ""
        echo "Testing health endpoint..."
        curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/api/health || echo "Health check failed"
        
        echo ""
        echo "Checking database connection..."
        docker-compose run --rm app npx prisma db pull > /dev/null 2>&1 && echo "Database connection: OK" || echo "Database connection: FAILED"
        
        echo ""
        echo "Recent error logs:"
        docker-compose logs app 2>&1 | grep -i error | tail -5 || echo "No recent errors"
ENDSSH
    
    log_info "Verification completed"
}

# Rollback function
rollback() {
    log_error "Initiating rollback..."
    
    read -p "Enter backup directory path (e.g., /home/ubuntu/backups/20250905_120000): " BACKUP_DIR
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << ENDSSH
        set -e
        
        if [ ! -d "$BACKUP_DIR" ]; then
            echo "Backup directory not found: $BACKUP_DIR"
            exit 1
        fi
        
        cd /home/ubuntu/1001project
        
        # Stop services
        echo "Stopping services..."
        docker-compose down
        
        # Restore code
        echo "Restoring code..."
        COMMIT=\$(cat "$BACKUP_DIR/current_commit.txt")
        git checkout \$COMMIT
        
        # Restore database
        echo "Restoring database..."
        docker-compose up -d db
        sleep 10
        docker exec -i 1001-stories-db psql -U postgres -c "DROP DATABASE IF EXISTS stories_db;"
        docker exec -i 1001-stories-db psql -U postgres -c "CREATE DATABASE stories_db;"
        docker exec -i 1001-stories-db psql -U postgres stories_db < "$BACKUP_DIR/database_backup.sql"
        
        # Restore files
        echo "Restoring files..."
        cp "$BACKUP_DIR/.env.backup" .env
        cp -r "$BACKUP_DIR/books" public/ 2>/dev/null || true
        cp -r "$BACKUP_DIR/books-upload" public/ 2>/dev/null || true
        
        # Rebuild and start
        echo "Rebuilding and starting services..."
        docker-compose build app
        docker-compose up -d
        
        echo "Rollback completed"
ENDSSH
    
    log_info "Rollback completed"
}

# Main menu
show_menu() {
    echo "========================================="
    echo "   1001 Stories v3 Deployment Script"
    echo "========================================="
    echo "1) Full deployment (with backup)"
    echo "2) Create backup only"
    echo "3) Deploy without backup (dangerous!)"
    echo "4) Enable maintenance mode"
    echo "5) Disable maintenance mode"
    echo "6) Verify deployment"
    echo "7) Rollback to backup"
    echo "8) Exit"
    echo "========================================="
}

# Main execution
main() {
    check_prerequisites
    
    while true; do
        show_menu
        read -p "Select option [1-8]: " option
        
        case $option in
            1)
                log_warn "This will deploy v3-ui-overhaul to production!"
                confirm "Are you sure you want to proceed?"
                BACKUP_DIR=$(create_backup)
                enable_maintenance
                deploy_v3
                disable_maintenance
                verify_deployment
                log_info "Full deployment completed successfully!"
                ;;
            2)
                create_backup
                ;;
            3)
                log_warn "Deploying without backup is dangerous!"
                confirm "Are you absolutely sure?"
                enable_maintenance
                deploy_v3
                disable_maintenance
                verify_deployment
                ;;
            4)
                enable_maintenance
                ;;
            5)
                disable_maintenance
                ;;
            6)
                verify_deployment
                ;;
            7)
                rollback
                ;;
            8)
                log_info "Exiting..."
                exit 0
                ;;
            *)
                log_error "Invalid option"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main