#!/bin/bash

# Server fix script for 1001 Stories
SERVER_IP="43.202.3.58"
SERVER_USER="ubuntu"
PEM_FILE="../1001project.pem"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Server Recovery & Fix Script        ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check PEM file
if [ ! -f "$PEM_FILE" ]; then
    echo -e "${RED}Error: PEM file not found at $PEM_FILE${NC}"
    exit 1
fi

chmod 400 "$PEM_FILE"

echo -e "\n${YELLOW}Connecting to server and fixing issues...${NC}"

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    set -e
    
    # Colors for remote output
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m'
    
    echo -e "${YELLOW}Connected to server - Starting recovery process${NC}"
    
    # Navigate to project directory
    cd /var/www/1001-stories
    
    # Step 1: Stop all Docker containers
    echo -e "\n${YELLOW}Step 1: Stopping all Docker containers...${NC}"
    docker-compose down || true
    docker stop $(docker ps -aq) 2>/dev/null || true
    
    # Step 2: Clean up Docker resources
    echo -e "\n${YELLOW}Step 2: Cleaning Docker resources...${NC}"
    docker system prune -f || true
    docker volume prune -f || true
    
    # Step 3: Clear Next.js cache
    echo -e "\n${YELLOW}Step 3: Clearing Next.js cache...${NC}"
    rm -rf .next 2>/dev/null || true
    rm -rf node_modules/.cache 2>/dev/null || true
    
    # Step 4: Pull latest changes
    echo -e "\n${YELLOW}Step 4: Pulling latest code...${NC}"
    git fetch origin
    git reset --hard origin/main
    
    # Step 5: Create .env file if missing
    echo -e "\n${YELLOW}Step 5: Checking .env file...${NC}"
    if [ ! -f ".env" ]; then
        echo "NEXT_PUBLIC_API_URL=http://43.202.3.58" > .env
        echo "NODE_ENV=production" >> .env
        echo -e "${GREEN}✓ Created .env file${NC}"
    fi
    
    # Step 6: Build Docker images with no cache
    echo -e "\n${YELLOW}Step 6: Building Docker images (no cache)...${NC}"
    docker-compose build --no-cache --progress=plain
    
    # Step 7: Start services
    echo -e "\n${YELLOW}Step 7: Starting services...${NC}"
    docker-compose up -d
    
    # Step 8: Check container status
    echo -e "\n${YELLOW}Step 8: Checking container status...${NC}"
    sleep 10
    docker ps
    
    # Step 9: Check logs
    echo -e "\n${YELLOW}Step 9: Checking recent logs...${NC}"
    docker-compose logs --tail=20
    
    # Step 10: Test connection
    echo -e "\n${YELLOW}Step 10: Testing local connection...${NC}"
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is running on port 3000${NC}"
    else
        echo -e "${RED}✗ Application not responding on port 3000${NC}"
        echo -e "${YELLOW}Checking app container logs...${NC}"
        docker-compose logs --tail=50 app
    fi
    
    # Check nginx
    if curl -f http://localhost > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Nginx is running on port 80${NC}"
    else
        echo -e "${RED}✗ Nginx not responding on port 80${NC}"
        echo -e "${YELLOW}Checking nginx container logs...${NC}"
        docker-compose logs --tail=50 nginx
    fi
    
    echo -e "\n${GREEN}Recovery process completed!${NC}"
ENDSSH

echo -e "\n${GREEN}✓ Server fix script completed${NC}"
echo -e "${YELLOW}Testing external connection...${NC}"

# Test from local machine
if curl -I -L http://$SERVER_IP 2>/dev/null | head -n 1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Server is accessible from external network${NC}"
    echo -e "${GREEN}✓ Application is running at http://$SERVER_IP${NC}"
else
    echo -e "${RED}✗ Server is not accessible from external network${NC}"
    echo -e "${YELLOW}This might be an AWS security group issue. Check:${NC}"
    echo -e "  1. AWS EC2 Security Group allows inbound traffic on port 80"
    echo -e "  2. AWS EC2 Security Group allows inbound traffic on port 443 (if using HTTPS)"
    echo -e "  3. EC2 instance is running and healthy"
fi