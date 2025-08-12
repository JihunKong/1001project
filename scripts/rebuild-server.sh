#!/bin/bash

# Simple rebuild script for 1001 Stories
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
echo -e "${BLUE}   Simple Rebuild Script               ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check PEM file
if [ ! -f "$PEM_FILE" ]; then
    echo -e "${RED}Error: PEM file not found at $PEM_FILE${NC}"
    exit 1
fi

chmod 400 "$PEM_FILE"

echo -e "\n${YELLOW}Rebuilding server application...${NC}"

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    set -e
    
    # Colors for remote output
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m'
    
    echo -e "${YELLOW}Connected to server${NC}"
    
    # Navigate to project directory
    cd /var/www/1001-stories
    
    # Stop containers
    echo -e "\n${YELLOW}Stopping containers...${NC}"
    docker-compose down || true
    
    # Build without cache
    echo -e "\n${YELLOW}Building Docker images...${NC}"
    docker-compose build --no-cache
    
    # Start services
    echo -e "\n${YELLOW}Starting services...${NC}"
    docker-compose up -d
    
    # Wait for startup
    echo -e "\n${YELLOW}Waiting for services to start...${NC}"
    sleep 15
    
    # Show status
    echo -e "\n${YELLOW}Container status:${NC}"
    docker ps
    
    # Check logs
    echo -e "\n${YELLOW}Recent logs:${NC}"
    docker-compose logs --tail=30
    
    # Test connections
    echo -e "\n${YELLOW}Testing connections...${NC}"
    
    # Test app
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ App running on port 3000${NC}"
    else
        echo -e "${RED}✗ App not responding on port 3000${NC}"
    fi
    
    # Test nginx
    if curl -f http://localhost > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Nginx running on port 80${NC}"
    else
        echo -e "${RED}✗ Nginx not responding on port 80${NC}"
    fi
    
    # Check iptables
    echo -e "\n${YELLOW}Checking firewall rules:${NC}"
    sudo iptables -L INPUT -n | grep -E "80|3000" || echo "No specific rules for ports 80/3000"
    
    # Check if ports are listening
    echo -e "\n${YELLOW}Checking listening ports:${NC}"
    sudo netstat -tlnp | grep -E ":80|:3000" || echo "Ports not listening"
    
    echo -e "\n${GREEN}Rebuild complete!${NC}"
ENDSSH

echo -e "\n${GREEN}✓ Rebuild script completed${NC}"

# Test from local
echo -e "${YELLOW}Testing external access...${NC}"
if curl -I -L http://$SERVER_IP 2>/dev/null | head -n 1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Server is accessible at http://$SERVER_IP${NC}"
else
    echo -e "${RED}✗ Server not accessible externally${NC}"
    echo -e "${YELLOW}Checking AWS Security Group recommendations:${NC}"
    echo "  - Ensure port 80 is open for HTTP traffic"
    echo "  - Ensure port 443 is open for HTTPS traffic (if needed)"
    echo "  - Check instance is running and healthy"
fi