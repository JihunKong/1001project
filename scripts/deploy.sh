#!/bin/bash

# ============================================
# 1001 Stories Deployment Script
# ============================================

# Configuration
SERVER_IP="43.202.3.58"
SERVER_USER="ubuntu"
PEM_FILE="../1001project.pem"
REPO_URL="https://github.com/JihunKong/1001project.git"
DEPLOY_PATH="/var/www/1001-stories"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   1001 Stories Deployment Script      ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function: Check prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"
    
    # Check if PEM file exists
    if [ ! -f "$PEM_FILE" ]; then
        echo -e "${RED}Error: PEM file not found at $PEM_FILE${NC}"
        exit 1
    fi
    
    # Check PEM file permissions
    chmod 400 "$PEM_FILE"
    echo -e "${GREEN}✓ PEM file found and permissions set${NC}"
}

# Function: Deploy to server
deploy_to_server() {
    echo -e "\n${YELLOW}Starting deployment to $SERVER_IP${NC}"
    
    # SSH to server and execute deployment commands
    ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        set -e
        
        # Colors for remote output
        GREEN='\033[0;32m'
        YELLOW='\033[1;33m'
        NC='\033[0m'
        
        echo -e "${YELLOW}Connected to server${NC}"
        
        # Check if deployment directory exists
        if [ ! -d "/var/www/1001-stories" ]; then
            echo "Creating deployment directory..."
            sudo mkdir -p /var/www/1001-stories
            sudo chown -R $USER:$USER /var/www/1001-stories
        fi
        
        # Navigate to deployment directory
        cd /var/www/1001-stories
        
        # Check if git repo exists
        if [ ! -d ".git" ]; then
            echo "Cloning repository..."
            git clone https://github.com/JihunKong/1001project.git .
        else
            echo "Pulling latest changes..."
            git pull origin main
        fi
        
        # Check if .env file exists
        if [ ! -f ".env" ]; then
            echo -e "${YELLOW}Warning: .env file not found. Please create it manually.${NC}"
        fi
        
        # Stop existing containers
        echo "Stopping existing containers..."
        docker-compose down || true
        
        # Build new images
        echo "Building Docker images..."
        docker-compose build --no-cache
        
        # Start services
        echo "Starting services..."
        docker-compose up -d
        
        # Wait for services to start
        echo "Waiting for services to start..."
        sleep 10
        
        # Health check
        echo "Performing health check..."
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Health check passed${NC}"
        else
            echo -e "${RED}✗ Health check failed${NC}"
            exit 1
        fi
        
        # Show running containers
        echo -e "\n${GREEN}Running containers:${NC}"
        docker ps
        
        echo -e "\n${GREEN}✓ Deployment completed successfully!${NC}"
ENDSSH
}

# Function: Rollback deployment
rollback() {
    echo -e "\n${RED}Rolling back deployment...${NC}"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        cd /var/www/1001-stories
        git checkout HEAD~1
        docker-compose down
        docker-compose up -d
        echo "Rollback completed"
ENDSSH
}

# Function: Show logs
show_logs() {
    echo -e "\n${YELLOW}Showing application logs...${NC}"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        cd /var/www/1001-stories
        docker-compose logs --tail=50 app
ENDSSH
}

# Main execution
case "${1:-deploy}" in
    deploy)
        check_prerequisites
        deploy_to_server || rollback
        ;;
    rollback)
        rollback
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|logs}"
        exit 1
        ;;
esac