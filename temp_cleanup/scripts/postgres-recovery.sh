#!/bin/bash

# ============================================
# PostgreSQL Recovery Script for 1001 Stories
# ============================================
# Specialized script for PostgreSQL connection issues

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} PostgreSQL Recovery for 1001 Stories  ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function: Check PostgreSQL container status
check_postgres_status() {
    echo -e "\n${YELLOW}Step 1: Checking PostgreSQL container status...${NC}"
    
    if docker ps | grep -q "1001-stories-db"; then
        echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
        return 0
    else
        echo -e "${RED}✗ PostgreSQL container is not running${NC}"
        return 1
    fi
}

# Function: Check database connectivity
test_database_connection() {
    echo -e "\n${YELLOW}Step 2: Testing database connectivity...${NC}"
    
    if docker exec 1001-stories-db pg_isready -U stories_user -d stories_db 2>/dev/null; then
        echo -e "${GREEN}✓ Database is accepting connections${NC}"
        return 0
    else
        echo -e "${RED}✗ Database is not accepting connections${NC}"
        return 1
    fi
}

# Function: Check database authentication
test_database_auth() {
    echo -e "\n${YELLOW}Step 3: Testing database authentication...${NC}"
    
    if docker exec 1001-stories-db psql -U stories_user -d stories_db -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database authentication successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Database authentication failed${NC}"
        echo -e "${YELLOW}Checking authentication logs...${NC}"
        docker exec 1001-stories-db cat /var/lib/postgresql/data/log/postgresql-*.log 2>/dev/null | tail -10 | grep -i "auth\|password\|login" || echo "No auth logs found"
        return 1
    fi
}

# Function: Recover PostgreSQL service
recover_postgres() {
    echo -e "\n${YELLOW}Starting PostgreSQL recovery process...${NC}"
    
    # Stop all services
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker-compose down
    
    # Check for conflicting processes
    echo -e "${YELLOW}Checking for port conflicts...${NC}"
    if docker ps -a | grep -q ":5432"; then
        echo -e "${YELLOW}Found containers using port 5432, removing them...${NC}"
        docker ps -a | grep ":5432" | awk '{print $1}' | xargs -r docker rm -f
    fi
    
    # Clean up Docker resources
    echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
    docker system prune -f > /dev/null 2>&1
    
    # Check PostgreSQL data volume
    echo -e "${YELLOW}Checking PostgreSQL data volume...${NC}"
    if docker volume ls | grep -q "1001-stories_postgres_data"; then
        echo -e "${GREEN}✓ PostgreSQL data volume exists${NC}"
        
        # Backup volume (just in case)
        echo -e "${YELLOW}Creating volume backup...${NC}"
        docker run --rm -v 1001-stories_postgres_data:/source -v $(pwd)/backups:/backup alpine tar czf /backup/postgres-emergency-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /source .
        echo -e "${GREEN}✓ Volume backup created${NC}"
    else
        echo -e "${RED}✗ PostgreSQL data volume missing - this may indicate data loss${NC}"
    fi
    
    # Start PostgreSQL only
    echo -e "${YELLOW}Starting PostgreSQL container only...${NC}"
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to initialize
    echo -e "${YELLOW}Waiting for PostgreSQL to initialize...${NC}"
    for i in {1..30}; do
        if docker exec 1001-stories-db pg_isready -U stories_user -d stories_db 2>/dev/null; then
            echo -e "${GREEN}✓ PostgreSQL is ready (attempt $i)${NC}"
            break
        else
            echo -n "."
            sleep 2
        fi
        
        if [ $i -eq 30 ]; then
            echo -e "${RED}\n✗ PostgreSQL failed to start after 60 seconds${NC}"
            echo -e "${YELLOW}Checking PostgreSQL logs...${NC}"
            docker-compose logs postgres | tail -20
            return 1
        fi
    done
    
    # Test basic connectivity
    if test_database_connection && test_database_auth; then
        echo -e "${GREEN}✓ PostgreSQL recovery successful${NC}"
        return 0
    else
        echo -e "${RED}✗ PostgreSQL recovery failed${NC}"
        return 1
    fi
}

# Function: Reset PostgreSQL authentication
reset_postgres_auth() {
    echo -e "\n${YELLOW}Resetting PostgreSQL authentication...${NC}"
    
    # Stop PostgreSQL
    docker-compose stop postgres
    
    # Start PostgreSQL in single-user mode to reset auth
    echo -e "${YELLOW}Starting PostgreSQL in recovery mode...${NC}"
    
    # Temporarily modify pg_hba.conf to allow local connections
    docker run --rm -v 1001-stories_postgres_data:/var/lib/postgresql/data postgres:15-alpine sh -c "
        echo 'local all all trust' > /var/lib/postgresql/data/pgdata/pg_hba.conf
        echo 'host all all all trust' >> /var/lib/postgresql/data/pgdata/pg_hba.conf
    " 2>/dev/null || echo "Could not modify pg_hba.conf"
    
    # Restart PostgreSQL
    docker-compose up -d postgres
    sleep 10
    
    # Reset password
    if docker exec 1001-stories-db psql -U stories_user -d stories_db -c "ALTER USER stories_user PASSWORD 'stories_password_123';" 2>/dev/null; then
        echo -e "${GREEN}✓ Password reset successful${NC}"
        
        # Restore proper pg_hba.conf
        docker run --rm -v 1001-stories_postgres_data:/var/lib/postgresql/data postgres:15-alpine sh -c "
            echo 'local all all md5' > /var/lib/postgresql/data/pgdata/pg_hba.conf
            echo 'host all all all md5' >> /var/lib/postgresql/data/pgdata/pg_hba.conf
        " 2>/dev/null
        
        # Restart to apply changes
        docker-compose restart postgres
        sleep 5
        
        return 0
    else
        echo -e "${RED}✗ Password reset failed${NC}"
        return 1
    fi
}

# Function: Recreate PostgreSQL from scratch
recreate_postgres() {
    echo -e "\n${RED}WARNING: This will recreate the PostgreSQL container and may cause data loss!${NC}"
    echo -e "${YELLOW}This should only be used as a last resort.${NC}"
    
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Aborted."
        return 1
    fi
    
    # Stop all services
    docker-compose down
    
    # Remove PostgreSQL container and volume
    echo -e "${YELLOW}Removing PostgreSQL container and volume...${NC}"
    docker rm -f 1001-stories-db 2>/dev/null || true
    docker volume rm 1001-stories_postgres_data 2>/dev/null || true
    
    # Recreate from scratch
    echo -e "${YELLOW}Recreating PostgreSQL from scratch...${NC}"
    docker-compose up -d postgres
    
    # Wait for initialization
    sleep 15
    
    # Run database migrations
    echo -e "${YELLOW}Running database migrations...${NC}"
    if docker-compose up -d app; then
        sleep 10
        docker exec 1001-stories-app npx prisma migrate deploy || echo "Migration failed"
        docker exec 1001-stories-app npx prisma db seed || echo "Seeding failed"
    fi
    
    echo -e "${GREEN}✓ PostgreSQL recreated${NC}"
}

# Function: Check application database connection
test_app_connection() {
    echo -e "\n${YELLOW}Step 4: Testing application database connection...${NC}"
    
    if docker ps | grep -q "1001-stories-app"; then
        if docker exec 1001-stories-app node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.\$connect().then(() => {
                console.log('SUCCESS');
                process.exit(0);
            }).catch((e) => {
                console.log('FAILED:', e.message);
                process.exit(1);
            });
        " 2>/dev/null | grep -q "SUCCESS"; then
            echo -e "${GREEN}✓ Application can connect to database${NC}"
            return 0
        else
            echo -e "${RED}✗ Application cannot connect to database${NC}"
            echo -e "${YELLOW}Checking DATABASE_URL...${NC}"
            docker exec 1001-stories-app printenv DATABASE_URL 2>/dev/null | sed 's/:[^@]*@/:***@/' || echo "DATABASE_URL not set"
            return 1
        fi
    else
        echo -e "${YELLOW}Application container not running${NC}"
        return 1
    fi
}

# Function: Full recovery process
full_recovery() {
    echo -e "\n${BLUE}Starting full PostgreSQL recovery process...${NC}"
    
    local step=1
    local success=0
    
    # Step 1: Basic recovery
    if recover_postgres; then
        echo -e "${GREEN}✓ Step $step: Basic recovery successful${NC}"
        success=1
    else
        echo -e "${RED}✗ Step $step: Basic recovery failed${NC}"
        ((step++))
        
        # Step 2: Auth reset
        echo -e "\n${YELLOW}Step $step: Attempting authentication reset...${NC}"
        if reset_postgres_auth; then
            echo -e "${GREEN}✓ Step $step: Authentication reset successful${NC}"
            success=1
        else
            echo -e "${RED}✗ Step $step: Authentication reset failed${NC}"
            ((step++))
            
            # Step 3: Recreate (last resort)
            echo -e "\n${YELLOW}Step $step: Last resort - recreating PostgreSQL...${NC}"
            if recreate_postgres; then
                echo -e "${GREEN}✓ Step $step: PostgreSQL recreation successful${NC}"
                success=1
            else
                echo -e "${RED}✗ Step $step: PostgreSQL recreation failed${NC}"
            fi
        fi
    fi
    
    if [ $success -eq 1 ]; then
        # Start all services
        echo -e "\n${YELLOW}Starting all services...${NC}"
        docker-compose up -d
        sleep 15
        
        # Final tests
        if test_database_connection && test_app_connection; then
            echo -e "\n${GREEN}🎉 Full recovery successful!${NC}"
            echo -e "${GREEN}All services should now be operational.${NC}"
            return 0
        else
            echo -e "\n${RED}Recovery partially successful but issues remain.${NC}"
            return 1
        fi
    else
        echo -e "\n${RED}All recovery attempts failed.${NC}"
        echo -e "${YELLOW}Manual intervention may be required.${NC}"
        return 1
    fi
}

# Function: Diagnostics only
run_diagnostics() {
    echo -e "\n${BLUE}Running PostgreSQL diagnostics...${NC}"
    
    check_postgres_status
    test_database_connection
    test_database_auth
    test_app_connection
    
    echo -e "\n${YELLOW}Container logs:${NC}"
    echo -e "${BLUE}=== PostgreSQL Logs ===${NC}"
    docker-compose logs postgres | tail -10
    
    echo -e "\n${BLUE}=== Application Logs ===${NC}"
    docker-compose logs app | tail -10 | grep -i -E "(database|prisma|error)"
    
    echo -e "\n${BLUE}=== Environment Check ===${NC}"
    echo "PostgreSQL container environment:"
    docker exec 1001-stories-db env | grep -E "(POSTGRES|PGDATA)" 2>/dev/null || echo "Cannot access container"
    
    echo -e "\n${BLUE}=== Volume Status ===${NC}"
    docker volume ls | grep postgres || echo "No PostgreSQL volumes found"
}

# Main execution
case "${1:-diagnose}" in
    diagnose)
        run_diagnostics
        ;;
    recover)
        full_recovery
        ;;
    reset-auth)
        reset_postgres_auth
        ;;
    recreate)
        recreate_postgres
        ;;
    test-connection)
        test_database_connection && test_app_connection
        ;;
    *)
        echo "Usage: $0 {diagnose|recover|reset-auth|recreate|test-connection}"
        echo ""
        echo "Commands:"
        echo "  diagnose       - Run diagnostics only (safe)"
        echo "  recover        - Full recovery process (recommended)"
        echo "  reset-auth     - Reset PostgreSQL authentication"
        echo "  recreate       - Recreate PostgreSQL from scratch (data loss risk)"
        echo "  test-connection - Test database connections only"
        exit 1
        ;;
esac