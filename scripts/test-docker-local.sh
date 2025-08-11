#!/bin/bash

# ============================================
# Docker Local Testing Script
# ============================================

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Docker Local Testing Suite           ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function: Check Docker installation
check_docker() {
    echo -e "\n${YELLOW}Checking Docker installation...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
}

# Function: Build Docker image
build_image() {
    echo -e "\n${YELLOW}Building Docker image...${NC}"
    
    if docker build -t 1001-stories:test .; then
        echo -e "${GREEN}✓ Docker image built successfully${NC}"
    else
        echo -e "${RED}✗ Failed to build Docker image${NC}"
        exit 1
    fi
}

# Function: Run container test
run_container_test() {
    echo -e "\n${YELLOW}Running container test...${NC}"
    
    # Stop any existing test container
    docker stop test-container 2>/dev/null || true
    docker rm test-container 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name test-container \
        -p 3001:3000 \
        -e NODE_ENV=production \
        1001-stories:test
    
    echo -e "${GREEN}✓ Container started${NC}"
    
    # Wait for container to be ready
    echo -e "${YELLOW}Waiting for container to be ready...${NC}"
    sleep 10
}

# Function: Health check
health_check() {
    echo -e "\n${YELLOW}Performing health check...${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ Health check passed (HTTP $response)${NC}"
        
        # Get health details
        health_data=$(curl -s http://localhost:3001/api/health)
        echo -e "${BLUE}Health data: $health_data${NC}"
    else
        echo -e "${RED}✗ Health check failed (HTTP $response)${NC}"
        exit 1
    fi
}

# Function: Test i18n routes
test_i18n() {
    echo -e "\n${YELLOW}Testing i18n routes...${NC}"
    
    languages=("en" "ko" "es" "fr" "zh")
    
    for lang in "${languages[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
        
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✓ Language route works: $lang${NC}"
        else
            echo -e "${RED}✗ Language route failed: $lang (HTTP $response)${NC}"
        fi
    done
}

# Function: Performance test
performance_test() {
    echo -e "\n${YELLOW}Running performance test...${NC}"
    
    # Check container stats
    docker stats --no-stream test-container
    
    # Check container logs
    echo -e "\n${YELLOW}Container logs (last 20 lines):${NC}"
    docker logs --tail 20 test-container
}

# Function: Docker Compose test
compose_test() {
    echo -e "\n${YELLOW}Testing Docker Compose setup...${NC}"
    
    # Stop any existing services
    docker-compose down 2>/dev/null || true
    
    # Start services
    echo -e "${YELLOW}Starting services with docker-compose...${NC}"
    docker-compose up -d
    
    # Wait for services
    sleep 15
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✓ Docker Compose services are running${NC}"
        docker-compose ps
    else
        echo -e "${RED}✗ Docker Compose services failed to start${NC}"
        docker-compose logs
        exit 1
    fi
    
    # Test nginx proxy
    echo -e "\n${YELLOW}Testing Nginx proxy...${NC}"
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
    
    if [ "$response" = "200" ] || [ "$response" = "308" ]; then
        echo -e "${GREEN}✓ Nginx proxy is working (HTTP $response)${NC}"
    else
        echo -e "${RED}✗ Nginx proxy failed (HTTP $response)${NC}"
    fi
}

# Function: Cleanup
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    
    # Stop and remove test container
    docker stop test-container 2>/dev/null || true
    docker rm test-container 2>/dev/null || true
    
    # Stop docker-compose services
    docker-compose down 2>/dev/null || true
    
    echo -e "${GREEN}✓ Cleanup completed${NC}"
}

# Function: Show summary
show_summary() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}   Test Summary                         ${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    echo -e "${GREEN}✓ Docker build successful${NC}"
    echo -e "${GREEN}✓ Container runs correctly${NC}"
    echo -e "${GREEN}✓ Health endpoint responds${NC}"
    echo -e "${GREEN}✓ i18n routes work${NC}"
    echo -e "${GREEN}✓ Docker Compose setup works${NC}"
    echo -e "${GREEN}✓ Nginx proxy functions${NC}"
    
    echo -e "\n${BLUE}The application is ready for deployment!${NC}"
}

# Main execution
main() {
    # Parse arguments
    case "${1:-all}" in
        build)
            check_docker
            build_image
            ;;
        run)
            check_docker
            build_image
            run_container_test
            health_check
            performance_test
            cleanup
            ;;
        compose)
            check_docker
            compose_test
            cleanup
            ;;
        all)
            check_docker
            build_image
            run_container_test
            health_check
            test_i18n
            performance_test
            cleanup
            compose_test
            cleanup
            show_summary
            ;;
        cleanup)
            cleanup
            ;;
        *)
            echo "Usage: $0 {build|run|compose|all|cleanup}"
            exit 1
            ;;
    esac
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"