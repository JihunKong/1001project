#!/bin/bash

# ============================================
# 1001 Stories Remote Database Recovery Script
# ============================================
# This script provides SSH-less database recovery
# capabilities using AWS Lightsail web console

# Configuration
SERVER_IP="3.128.143.122"
SERVER_USER="ubuntu"
PEM_FILE="/Users/jihunkong/Downloads/1001project.pem"
DOMAIN="1001stories.seedsofempowerment.org"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} 1001 Stories Remote Recovery Script   ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function: Check if SSH is available (fallback option)
check_ssh_access() {
    echo -e "\n${YELLOW}Testing SSH connectivity...${NC}"
    
    if [ ! -f "$PEM_FILE" ]; then
        echo -e "${RED}SSH key not found. Using alternative methods.${NC}"
        return 1
    fi
    
    if timeout 10 ssh -i "$PEM_FILE" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" 2>/dev/null; then
        echo -e "${GREEN}✓ SSH access available${NC}"
        return 0
    else
        echo -e "${YELLOW}SSH access not available. Using alternative methods.${NC}"
        return 1
    fi
}

# Function: Generate AWS Lightsail commands for web console
generate_lightsail_commands() {
    echo -e "\n${BLUE}=== AWS Lightsail Web Console Commands ===${NC}"
    echo -e "${YELLOW}Use these commands in your AWS Lightsail instance web console:${NC}"
    echo -e "${YELLOW}(Connect via: AWS Console > Lightsail > Your Instance > Connect using SSH)${NC}\n"
    
    cat << 'EOF'
# 1. Check Docker container status
echo "=== Container Status ==="
docker ps -a
docker-compose ps

# 2. Check database container health
echo "=== Database Health Check ==="
docker exec 1001-stories-db pg_isready -U stories_user -d stories_db

# 3. Check database logs for errors
echo "=== Database Logs ==="
docker-compose logs postgres | tail -30

# 4. Check application logs
echo "=== Application Logs ==="
docker-compose logs app | tail -30

# 5. Restart PostgreSQL service only
echo "=== Restarting PostgreSQL ==="
docker-compose restart postgres

# 6. Wait and test database connection
echo "=== Testing Database Connection ==="
sleep 10
docker exec 1001-stories-db psql -U stories_user -d stories_db -c "SELECT 1 as test;"

# 7. If database is healthy, restart application
echo "=== Restarting Application ==="
docker-compose restart app

# 8. Final health check
echo "=== Final Health Check ==="
sleep 15
curl -f http://localhost/health || echo "Health check failed"

# 9. Show container status after restart
echo "=== Final Container Status ==="
docker ps
EOF

    echo -e "\n${GREEN}Copy the above commands and execute them in AWS Lightsail web console.${NC}"
}

# Function: Generate recovery script for download
generate_recovery_script() {
    echo -e "\n${YELLOW}Creating recovery script for server execution...${NC}"
    
    cat > /tmp/server-recovery.sh << 'EOF'
#!/bin/bash

# Server-side recovery script for 1001 Stories
# Execute this on the server via AWS Lightsail web console

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Starting 1001 Stories database recovery...${NC}"

# Navigate to project directory
cd /home/ubuntu/1001-stories || {
    echo -e "${RED}Project directory not found!${NC}"
    exit 1
}

echo -e "${YELLOW}Step 1: Checking current container status...${NC}"
docker ps -a
echo ""

echo -e "${YELLOW}Step 2: Checking Docker Compose status...${NC}"
docker-compose ps
echo ""

echo -e "${YELLOW}Step 3: Checking PostgreSQL logs...${NC}"
docker-compose logs postgres | tail -20
echo ""

echo -e "${YELLOW}Step 4: Testing database connectivity...${NC}"
if docker exec 1001-stories-db pg_isready -U stories_user -d stories_db; then
    echo -e "${GREEN}✓ Database is responding${NC}"
else
    echo -e "${RED}✗ Database is not responding${NC}"
    echo -e "${YELLOW}Attempting database restart...${NC}"
    
    # Stop all services
    docker-compose down
    
    # Remove any orphaned containers
    docker system prune -f
    
    # Start services in order
    docker-compose up -d postgres
    sleep 15
    
    # Test database again
    if docker exec 1001-stories-db pg_isready -U stories_user -d stories_db; then
        echo -e "${GREEN}✓ Database recovered${NC}"
    else
        echo -e "${RED}✗ Database still not responding${NC}"
        echo "Checking for PostgreSQL data corruption..."
        docker exec 1001-stories-db ls -la /var/lib/postgresql/data/
        exit 1
    fi
fi

echo -e "${YELLOW}Step 5: Starting application services...${NC}"
docker-compose up -d app nginx

echo -e "${YELLOW}Step 6: Waiting for services to stabilize...${NC}"
sleep 20

echo -e "${YELLOW}Step 7: Running health checks...${NC}"

# Test database connection from app
if docker exec 1001-stories-app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('Database connection successful');
  process.exit(0);
}).catch((e) => {
  console.error('Database connection failed:', e.message);
  process.exit(1);
});
"; then
    echo -e "${GREEN}✓ Application database connection successful${NC}"
else
    echo -e "${RED}✗ Application cannot connect to database${NC}"
    echo "Checking environment variables..."
    docker exec 1001-stories-app env | grep DATABASE_URL
fi

# Test web health endpoint
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Web health check passed${NC}"
else
    echo -e "${RED}✗ Web health check failed${NC}"
    echo "Checking nginx logs..."
    docker-compose logs nginx | tail -10
fi

echo -e "${YELLOW}Step 8: Final status check...${NC}"
docker ps
echo ""

echo -e "${GREEN}Recovery script completed!${NC}"
echo -e "${YELLOW}If issues persist, check:${NC}"
echo "1. Environment variables in .env.production"
echo "2. Database volume integrity"
echo "3. Docker network connectivity"
echo "4. Firewall settings"
EOF

    chmod +x /tmp/server-recovery.sh
    echo -e "${GREEN}✓ Recovery script created at /tmp/server-recovery.sh${NC}"
    echo -e "${YELLOW}Upload this script to your server and execute it.${NC}"
}

# Function: Create monitoring commands
generate_monitoring_commands() {
    echo -e "\n${BLUE}=== Monitoring Commands ===${NC}"
    echo -e "${YELLOW}Use these commands to monitor recovery progress:${NC}\n"
    
    cat << 'EOF'
# Real-time container monitoring
watch -n 2 'docker ps && echo "--- Health Status ---" && docker-compose ps'

# Database connection monitoring
while true; do
    echo "$(date): Testing DB connection..."
    docker exec 1001-stories-db pg_isready -U stories_user -d stories_db && echo "✓ OK" || echo "✗ FAIL"
    sleep 5
done

# Application log monitoring
docker-compose logs -f app | grep -E "(error|Error|ERROR|database|Database)"

# Health endpoint monitoring
while true; do
    echo "$(date): Testing health endpoint..."
    curl -f http://localhost/health > /dev/null 2>&1 && echo "✓ OK" || echo "✗ FAIL"
    sleep 10
done
EOF
}

# Function: Web-based diagnostics using curl
run_web_diagnostics() {
    echo -e "\n${YELLOW}Running web-based diagnostics...${NC}"
    
    # Test health endpoint
    echo -e "\n${BLUE}Testing health endpoint...${NC}"
    if curl -f -s "http://$SERVER_IP/health" > /dev/null; then
        echo -e "${GREEN}✓ Health endpoint responding${NC}"
    else
        echo -e "${RED}✗ Health endpoint not responding${NC}"
    fi
    
    # Test demo pages (should work without database)
    echo -e "\n${BLUE}Testing demo pages...${NC}"
    if curl -f -s "http://$SERVER_IP/demo" > /dev/null; then
        echo -e "${GREEN}✓ Demo pages responding (app container OK)${NC}"
    else
        echo -e "${RED}✗ Demo pages not responding (app container issue)${NC}"
    fi
    
    # Test database-dependent endpoint
    echo -e "\n${BLUE}Testing database-dependent endpoint...${NC}"
    response=$(curl -s -w "%{http_code}" "http://$SERVER_IP/api/library/books" -o /dev/null)
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ Database connection OK${NC}"
    elif [ "$response" = "500" ]; then
        echo -e "${RED}✗ Database connection failed (500 error)${NC}"
    else
        echo -e "${YELLOW}? Unexpected response: $response${NC}"
    fi
}

# Function: Generate AWS CLI commands for automated recovery
generate_aws_cli_commands() {
    echo -e "\n${BLUE}=== AWS CLI Commands (if AWS CLI is configured) ===${NC}"
    echo -e "${YELLOW}Use these commands if you have AWS CLI configured:${NC}\n"
    
    cat << 'EOF'
# Get instance information
aws lightsail get-instance --instance-name YOUR_INSTANCE_NAME

# Create snapshot before recovery (recommended)
aws lightsail create-instance-snapshot \
    --instance-name YOUR_INSTANCE_NAME \
    --instance-snapshot-name recovery-backup-$(date +%Y%m%d-%H%M%S)

# Reboot instance (last resort)
aws lightsail reboot-instance --instance-name YOUR_INSTANCE_NAME

# Monitor instance state
aws lightsail get-instance --instance-name YOUR_INSTANCE_NAME \
    --query 'instance.state.name' --output text
EOF
}

# Main execution
main() {
    echo -e "${YELLOW}Analyzing recovery options...${NC}"
    
    # Run web diagnostics first
    run_web_diagnostics
    
    # Check if SSH is available
    if check_ssh_access; then
        echo -e "\n${GREEN}SSH access confirmed. Running direct recovery...${NC}"
        # If SSH works, we can run the existing deploy script
        echo -e "${YELLOW}Running existing deploy script with recovery mode...${NC}"
        ./scripts/deploy.sh deploy
    else
        echo -e "\n${YELLOW}SSH not available. Providing alternative recovery methods...${NC}"
        
        # Generate various recovery options
        generate_lightsail_commands
        generate_recovery_script
        generate_monitoring_commands
        generate_aws_cli_commands
        
        echo -e "\n${BLUE}=== Recovery Options Summary ===${NC}"
        echo -e "${GREEN}1. AWS Lightsail Web Console: Use the commands shown above${NC}"
        echo -e "${GREEN}2. Recovery Script: Upload /tmp/server-recovery.sh to your server${NC}"
        echo -e "${GREEN}3. AWS CLI: Use AWS CLI commands if configured${NC}"
        echo -e "${GREEN}4. Manual: Connect via Lightsail web console and run commands manually${NC}"
        
        echo -e "\n${YELLOW}Recommended approach:${NC}"
        echo -e "1. Log into AWS Lightsail console"
        echo -e "2. Navigate to your instance"
        echo -e "3. Click 'Connect using SSH'"
        echo -e "4. Copy and paste the generated commands"
        echo -e "5. Monitor the output for success/failure"
        
        echo -e "\n${GREEN}Recovery script ready at: /tmp/server-recovery.sh${NC}"
    fi
}

# Parse command line arguments
case "${1:-diagnose}" in
    diagnose)
        run_web_diagnostics
        ;;
    commands)
        generate_lightsail_commands
        ;;
    script)
        generate_recovery_script
        ;;
    monitor)
        generate_monitoring_commands
        ;;
    aws)
        generate_aws_cli_commands
        ;;
    full)
        main
        ;;
    *)
        echo "Usage: $0 {diagnose|commands|script|monitor|aws|full}"
        echo ""
        echo "Commands:"
        echo "  diagnose  - Run web-based diagnostics only"
        echo "  commands  - Generate Lightsail web console commands"
        echo "  script    - Create recovery script for server upload"
        echo "  monitor   - Show monitoring commands"
        echo "  aws       - Show AWS CLI commands"
        echo "  full      - Run complete recovery analysis (default)"
        exit 1
        ;;
esac