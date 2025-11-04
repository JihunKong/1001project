#!/bin/bash

# 1001 Stories SSL Certificate Setup Script
# This script helps generate initial SSL certificates for HTTPS access

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="1001stories.seedsofempowerment.org"
EMAIL="noreply@1001stories.org"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if docker compose is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi

    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        error "docker-compose.yml not found. Please run this script from the project root directory"
        exit 1
    fi

    # Check if certbot directories exist
    if [ ! -d "certbot" ]; then
        log "Creating certbot directories..."
        mkdir -p certbot/conf certbot/www certbot/logs
    fi

    success "Prerequisites check passed"
}

# Check if certificates already exist
check_existing_certs() {
    log "Checking for existing SSL certificates..."

    if [ -d "certbot/conf/live/$DOMAIN" ]; then
        warn "SSL certificates already exist for $DOMAIN"

        # Show certificate expiry
        if [ -f "certbot/conf/live/$DOMAIN/cert.pem" ]; then
            EXPIRY=$(openssl x509 -enddate -noout -in "certbot/conf/live/$DOMAIN/cert.pem" | cut -d= -f2)
            echo "  Certificate expires: $EXPIRY"
        fi

        read -p "Do you want to regenerate the certificates? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Skipping certificate generation"
            return 1
        fi

        # Backup existing certificates
        BACKUP_DIR="certbot/conf/backup-$(date +%Y%m%d-%H%M%S)"
        log "Backing up existing certificates to $BACKUP_DIR..."
        mkdir -p "$BACKUP_DIR"
        cp -r "certbot/conf/live/$DOMAIN" "$BACKUP_DIR/"
        success "Backup created"
    fi

    return 0
}

# Ensure nginx is running for ACME challenge
ensure_nginx() {
    log "Ensuring nginx service is running..."

    # Check if nginx container is running
    if ! docker ps | grep -q "1001-stories-nginx"; then
        log "Starting nginx service..."
        docker compose up -d nginx
        sleep 5
    fi

    # Verify nginx is accessible
    if ! docker exec 1001-stories-nginx nginx -t &> /dev/null; then
        error "nginx configuration test failed"
        docker exec 1001-stories-nginx nginx -t
        exit 1
    fi

    success "nginx is running and healthy"
}

# Generate SSL certificates
generate_certificates() {
    log "Generating SSL certificates for $DOMAIN..."

    # Run certbot with entrypoint override
    # This avoids the infinite loop in the docker-compose.yml entrypoint
    docker compose run --rm --entrypoint /bin/sh certbot -c "certbot certonly \
        --webroot -w /var/www/certbot \
        -d $DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --non-interactive \
        --force-renewal"

    if [ $? -eq 0 ]; then
        success "SSL certificates generated successfully"

        # Show certificate details
        if [ -f "certbot/conf/live/$DOMAIN/cert.pem" ]; then
            EXPIRY=$(openssl x509 -enddate -noout -in "certbot/conf/live/$DOMAIN/cert.pem" | cut -d= -f2)
            echo "  Certificate expires: $EXPIRY"
        fi

        return 0
    else
        error "Certificate generation failed"
        return 1
    fi
}

# Restart nginx to apply certificates
restart_nginx() {
    log "Restarting nginx to apply SSL certificates..."

    docker compose restart nginx
    sleep 3

    # Verify nginx reloaded successfully
    if docker ps | grep -q "1001-stories-nginx"; then
        success "nginx restarted successfully"
    else
        error "nginx restart failed"
        docker compose logs nginx --tail=20
        exit 1
    fi
}

# Restart certbot to apply new configuration
restart_certbot() {
    log "Restarting certbot service..."

    docker compose up -d --force-recreate certbot
    sleep 2

    # Check certbot logs
    log "Certbot status:"
    docker compose logs certbot --tail=5
}

# Test HTTPS endpoint
test_https() {
    log "Testing HTTPS endpoint..."

    sleep 5

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        success "HTTPS endpoint is working! (HTTP $HTTP_CODE)"
        success "SSL setup completed successfully!"
        echo ""
        echo "You can now access the application at: https://$DOMAIN"
    else
        warn "HTTPS endpoint test failed (HTTP $HTTP_CODE)"
        echo "Please check:"
        echo "  1. nginx configuration: docker compose logs nginx"
        echo "  2. Certificate files exist in: certbot/conf/live/$DOMAIN/"
        echo "  3. Domain DNS points to this server"
    fi
}

# Main execution
main() {
    echo "======================================"
    echo "1001 Stories SSL Certificate Setup"
    echo "======================================"
    echo ""

    check_prerequisites

    if ! check_existing_certs; then
        exit 0
    fi

    ensure_nginx
    generate_certificates

    if [ $? -eq 0 ]; then
        restart_nginx
        restart_certbot
        test_https
    else
        error "SSL setup failed"
        exit 1
    fi
}

# Run main function
main