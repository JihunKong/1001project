#!/bin/bash

# Infrastructure Configuration Verification Script
# Validates that all infrastructure fixes have been properly applied

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

check_passed=0
check_failed=0

# Function to track check results
check_result() {
    if [ $? -eq 0 ]; then
        success "$1"
        ((check_passed++))
    else
        error "$1"
        ((check_failed++))
    fi
}

# Check Docker Compose version specifications
check_docker_compose_versions() {
    log "Checking Docker Compose version specifications..."

    local compose_files=(
        "docker-compose.local.yml"
        "docker-compose.dev.yml"
        "docker/docker-compose.ssl.yml"
    )

    for file in "${compose_files[@]}"; do
        if [ -f "$file" ]; then
            if ! grep -q "^version:" "$file"; then
                success "No version specification in $file"
                ((check_passed++))
            else
                error "Version specification found in $file"
                ((check_failed++))
            fi
        else
            warn "Docker Compose file not found: $file"
        fi
    done
}

# Check Redis service configuration
check_redis_configuration() {
    log "Checking Redis service configuration..."

    # Check local docker-compose has Redis
    if grep -q "redis:" docker-compose.local.yml; then
        success "Redis service found in local configuration"
        ((check_passed++))
    else
        error "Redis service missing in local configuration"
        ((check_failed++))
    fi

    # Check if Redis has password authentication
    if grep -q "requirepass" docker-compose.local.yml; then
        success "Redis password authentication configured"
        ((check_passed++))
    else
        error "Redis password authentication not configured"
        ((check_failed++))
    fi

    # Check production Redis configuration
    if [ -f "docker/docker-compose.ssl.yml" ]; then
        if grep -q "redis:" docker/docker-compose.ssl.yml; then
            success "Redis service found in production configuration"
            ((check_passed++))
        else
            error "Redis service missing in production configuration"
            ((check_failed++))
        fi
    fi
}

# Check nginx configuration files
check_nginx_configuration() {
    log "Checking nginx configuration files..."

    local nginx_files=(
        "nginx/ssl-setup.conf"
        "nginx/nginx-ssl.conf"
    )

    for file in "${nginx_files[@]}"; do
        if [ -f "$file" ]; then
            success "nginx configuration file exists: $file"
            ((check_passed++))
        else
            error "nginx configuration file missing: $file"
            ((check_failed++))
        fi
    done

    # Check nginx SSL configuration
    if [ -f "nginx/nginx-ssl.conf" ]; then
        if grep -q "ssl_certificate" nginx/nginx-ssl.conf; then
            success "SSL configuration found in nginx"
            ((check_passed++))
        else
            error "SSL configuration missing in nginx"
            ((check_failed++))
        fi

        if grep -q "limit_req" nginx/nginx-ssl.conf; then
            success "Rate limiting configured in nginx"
            ((check_passed++))
        else
            warn "Rate limiting not found in nginx configuration"
        fi
    fi
}

# Check deployment scripts
check_deployment_scripts() {
    log "Checking deployment scripts..."

    local scripts=(
        "scripts/deploy.sh"
        "scripts/test-docker-local.sh"
        "scripts/setup-server.sh"
    )

    for script in "${scripts[@]}"; do
        if [ -f "$script" ] && [ -x "$script" ]; then
            success "Deployment script exists and is executable: $script"
            ((check_passed++))
        else
            error "Deployment script missing or not executable: $script"
            ((check_failed++))
        fi
    done

    # Check deploy script commands
    if [ -f "scripts/deploy.sh" ]; then
        local commands=("deploy" "ssl" "logs" "rollback" "status" "test" "backup")
        for cmd in "${commands[@]}"; do
            if grep -q "\"$cmd\")" scripts/deploy.sh; then
                success "Deploy script has $cmd command"
                ((check_passed++))
            else
                error "Deploy script missing $cmd command"
                ((check_failed++))
            fi
        done
    fi
}

# Check environment variable consistency
check_environment_variables() {
    log "Checking environment variable consistency..."

    # Check required environment files
    local env_files=(
        ".env.docker"
        ".env.production.example"
    )

    for file in "${env_files[@]}"; do
        if [ -f "$file" ]; then
            success "Environment file exists: $file"
            ((check_passed++))
        else
            error "Environment file missing: $file"
            ((check_failed++))
        fi
    done

    # Check for Redis configuration in environment files
    if [ -f ".env.docker" ]; then
        if grep -q "REDIS_URL" .env.docker; then
            success "Redis URL configured in .env.docker"
            ((check_passed++))
        else
            error "Redis URL missing in .env.docker"
            ((check_failed++))
        fi
    fi

    if [ -f ".env.production.example" ]; then
        if grep -q "REDIS_URL" .env.production.example; then
            success "Redis URL configured in .env.production.example"
            ((check_passed++))
        else
            error "Redis URL missing in .env.production.example"
            ((check_failed++))
        fi

        if grep -q "OPENAI_API_KEY" .env.production.example; then
            success "AI configuration found in production example"
            ((check_passed++))
        else
            error "AI configuration missing in production example"
            ((check_failed++))
        fi
    fi
}

# Check health check configurations
check_health_checks() {
    log "Checking health check configurations..."

    local compose_files=(
        "docker-compose.local.yml"
        "docker/docker-compose.ssl.yml"
    )

    for file in "${compose_files[@]}"; do
        if [ -f "$file" ]; then
            if grep -q "healthcheck:" "$file"; then
                success "Health checks configured in $file"
                ((check_passed++))
            else
                warn "Health checks not found in $file"
            fi
        fi
    done
}

# Check security configurations
check_security_configurations() {
    log "Checking security configurations..."

    # Check nginx security headers
    if [ -f "nginx/nginx-ssl.conf" ]; then
        local security_headers=(
            "X-Frame-Options"
            "X-Content-Type-Options"
            "X-XSS-Protection"
            "Strict-Transport-Security"
        )

        for header in "${security_headers[@]}"; do
            if grep -q "$header" nginx/nginx-ssl.conf; then
                success "Security header configured: $header"
                ((check_passed++))
            else
                error "Security header missing: $header"
                ((check_failed++))
            fi
        done
    fi

    # Check for HTTPS redirect
    if [ -f "nginx/nginx-ssl.conf" ]; then
        if grep -q "return 301 https" nginx/nginx-ssl.conf; then
            success "HTTPS redirect configured"
            ((check_passed++))
        else
            error "HTTPS redirect not configured"
            ((check_failed++))
        fi
    fi
}

# Check documentation
check_documentation() {
    log "Checking infrastructure documentation..."

    if [ -f "INFRASTRUCTURE.md" ]; then
        success "Infrastructure documentation exists"
        ((check_passed++))
    else
        error "Infrastructure documentation missing"
        ((check_failed++))
    fi

    if [ -f "CLAUDE.md" ]; then
        if grep -q "Docker" CLAUDE.md; then
            success "Docker documentation found in CLAUDE.md"
            ((check_passed++))
        else
            warn "Docker documentation sparse in CLAUDE.md"
        fi
    fi
}

# Main verification function
main() {
    echo "=============================================="
    echo "1001 Stories Infrastructure Verification"
    echo "=============================================="
    echo ""

    check_docker_compose_versions
    check_redis_configuration
    check_nginx_configuration
    check_deployment_scripts
    check_environment_variables
    check_health_checks
    check_security_configurations
    check_documentation

    echo ""
    echo "=============================================="
    echo "Verification Summary"
    echo "=============================================="
    echo -e "${GREEN}Checks Passed: $check_passed${NC}"
    echo -e "${RED}Checks Failed: $check_failed${NC}"
    echo ""

    if [ $check_failed -eq 0 ]; then
        success "All infrastructure checks passed!"
        echo ""
        echo "Your infrastructure is properly configured with:"
        echo "• Docker Compose files without version specifications"
        echo "• Redis service with password authentication"
        echo "• nginx with SSL and security configurations"
        echo "• Complete deployment script suite"
        echo "• Consistent environment variable management"
        echo "• Comprehensive health checks"
        echo "• Security hardening configurations"
        echo ""
        return 0
    else
        error "Some infrastructure checks failed!"
        echo ""
        echo "Please review and fix the failed checks above."
        echo "Refer to INFRASTRUCTURE.md for detailed guidance."
        echo ""
        return 1
    fi
}

# Run verification
main "$@"