#!/bin/bash

# Check server status script
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
echo -e "${BLUE}   Server Status Check                 ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check PEM file
if [ ! -f "$PEM_FILE" ]; then
    echo -e "${RED}Error: PEM file not found at $PEM_FILE${NC}"
    exit 1
fi

chmod 400 "$PEM_FILE"

echo -e "\n${YELLOW}Checking server status...${NC}"

ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    # Colors for remote output
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m'
    
    echo -e "${YELLOW}=== Docker Status ===${NC}"
    docker ps -a
    
    echo -e "\n${YELLOW}=== Port Status ===${NC}"
    sudo netstat -tlnp | grep -E ":80|:3000|:443" || echo "No services on expected ports"
    
    echo -e "\n${YELLOW}=== Firewall Status ===${NC}"
    sudo ufw status || echo "UFW not active"
    
    echo -e "\n${YELLOW}=== IPTables Rules ===${NC}"
    sudo iptables -L INPUT -n -v | head -20
    
    echo -e "\n${YELLOW}=== System Resources ===${NC}"
    free -h
    df -h /
    
    echo -e "\n${YELLOW}=== Docker Logs (last 20 lines) ===${NC}"
    cd /var/www/1001-stories
    docker-compose logs --tail=20 2>&1 || echo "No logs available"
    
    echo -e "\n${YELLOW}=== Attempting Quick Fix ===${NC}"
    
    # Try to start containers if they're not running
    if ! docker ps | grep -q "1001-stories"; then
        echo "Containers not running, attempting to start..."
        cd /var/www/1001-stories
        docker-compose up -d
        sleep 10
        docker ps
    else
        echo "Containers are running"
    fi
    
    # Test local connectivity
    echo -e "\n${YELLOW}=== Local Connectivity Test ===${NC}"
    curl -I http://localhost:3000 2>&1 | head -5 || echo "App not responding"
    curl -I http://localhost 2>&1 | head -5 || echo "Nginx not responding"
    
ENDSSH

echo -e "\n${GREEN}✓ Status check completed${NC}"