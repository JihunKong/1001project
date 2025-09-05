#!/bin/bash

# ============================================
# 1001 Stories Deployment Script
# ============================================

# Configuration
SERVER_IP="3.128.143.122"
SERVER_USER="ubuntu"
PEM_FILE="/Users/jihunkong/Downloads/1001project.pem"
REPO_URL="https://github.com/SeedsofEmpowerment/1001storie_online.git"
DEPLOY_PATH="/home/ubuntu/1001project"
DOMAIN="1001stories.seedsofempowerment.org"

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
        if [ ! -d "/home/ubuntu/1001-stories" ]; then
            echo "Creating deployment directory..."
            mkdir -p /home/ubuntu/1001-stories
            chown -R $USER:$USER /home/ubuntu/1001-stories
        fi
        
        # Navigate to deployment directory
        cd /home/ubuntu/1001-stories
        
        # Check if git repo exists
        if [ ! -d ".git" ]; then
            echo "Cloning repository..."
            git clone https://github.com/SeedsofEmpowerment/1001storie_online.git .
        else
            echo "Backing up uploaded files..."
            if [ -d "public/books" ]; then
                sudo cp -R public/books /tmp/books-backup-$(date +%s) || true
                echo "✓ Books backup created"
            fi
            
            echo "Pulling latest changes..."
            git fetch origin
            git checkout feature/role-system-v2
            git pull origin feature/role-system-v2
            
            echo "Restoring uploaded files..."
            LATEST_BACKUP=$(ls -t /tmp/books-backup-* 2>/dev/null | head -n1)
            if [ -n "$LATEST_BACKUP" ] && [ -d "$LATEST_BACKUP" ]; then
                sudo mkdir -p public/books
                sudo cp -R "$LATEST_BACKUP"/* public/books/ || true
                sudo rm -rf "$LATEST_BACKUP"
                sudo chown -R $USER:$USER public/books
                sudo chmod -R 755 public/books
                echo "✓ Books restored from backup"
            fi
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
        sleep 5
        if curl -f http://localhost/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Health check passed${NC}"
        else
            echo -e "${RED}✗ Health check failed${NC}"
            echo "Checking service logs..."
            docker-compose logs --tail=20
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
        cd /home/ubuntu/1001-stories
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
        cd /home/ubuntu/1001-stories
        docker-compose logs --tail=50 app
ENDSSH
}

# Function: Setup SSL certificates
setup_ssl() {
    echo -e "\n${YELLOW}Setting up SSL certificates...${NC}"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        cd /home/ubuntu/1001-stories
        
        # Make SSL script executable
        chmod +x scripts/setup-ssl.sh
        
        # Run SSL setup
        sudo ./scripts/setup-ssl.sh setup
ENDSSH
}

# Function: Configure firewall and security
configure_security() {
    echo -e "\n${YELLOW}Configuring security and firewall...${NC}"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        # Update system packages
        sudo apt update
        
        # Install/update firewall
        sudo apt install -y ufw
        
        # Configure UFW
        sudo ufw --force reset
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        
        # Allow SSH, HTTP, HTTPS
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        # Deny direct access to application ports
        sudo ufw deny 3000/tcp
        sudo ufw deny 5432/tcp
        sudo ufw deny 5050/tcp
        
        # Enable firewall
        sudo ufw --force enable
        
        # Show status
        sudo ufw status verbose
        
        echo "Security configuration completed"
ENDSSH
}

# Function: Full production setup
production_setup() {
    echo -e "\n${BLUE}Starting full production setup...${NC}"
    
    check_prerequisites
    configure_security
    deploy_to_server
    setup_ssl
    
    echo -e "\n${GREEN}🎉 Production setup completed!${NC}"
    echo -e "${GREEN}Your application should be available at: https://$DOMAIN${NC}"
}

# Main execution
case "${1:-deploy}" in
    deploy)
        check_prerequisites
        deploy_to_server || rollback
        ;;
    production)
        production_setup
        ;;
    ssl)
        setup_ssl
        ;;
    security)
        configure_security
        ;;
    rollback)
        rollback
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {deploy|production|ssl|security|rollback|logs}"
        echo ""
        echo "Commands:"
        echo "  deploy     - Deploy application only"
        echo "  production - Full production setup (security + deploy + SSL)"
        echo "  ssl        - Setup SSL certificates only"
        echo "  security   - Configure firewall and security only"
        echo "  rollback   - Rollback to previous version"
        echo "  logs       - Show application logs"
        exit 1
        ;;
esac