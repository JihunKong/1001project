#!/bin/bash

# SSL Certificate Setup Script for 1001 Stories
# This script sets up Let's Encrypt SSL certificates for production deployment

set -euo pipefail

DOMAIN="1001stories.seedsofempowerment.org"
EMAIL="noreply@1001stories.org"
PROJECT_DIR="/opt/1001-stories"
COMPOSE_FILE="docker-compose.yml"
SSL_COMPOSE_FILE="docker-compose.ssl.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if domain resolves to current server
    CURRENT_IP=$(curl -s ifconfig.me)
    DOMAIN_IP=$(dig +short $DOMAIN)
    
    if [[ "$CURRENT_IP" != "$DOMAIN_IP" ]]; then
        log_warning "Domain $DOMAIN resolves to $DOMAIN_IP but current server IP is $CURRENT_IP"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Domain resolution verified"
    fi
}

# Setup directories
setup_directories() {
    log_info "Setting up directories..."
    
    cd $PROJECT_DIR
    
    # Create SSL and www directories
    mkdir -p nginx/ssl nginx/www nginx/logs
    chown -R 1000:1000 nginx/
    
    # Create backups directory
    mkdir -p backups
    chmod 755 backups
    
    log_success "Directories created"
}

# Stop any running services
stop_services() {
    log_info "Stopping existing services..."
    
    # Stop main application if running
    if docker-compose ps | grep -q "Up"; then
        docker-compose down
        log_info "Stopped main application"
    fi
    
    # Stop any nginx containers that might be running
    docker stop $(docker ps -q --filter "name=nginx") 2>/dev/null || true
    docker rm $(docker ps -aq --filter "name=nginx") 2>/dev/null || true
    
    log_success "Services stopped"
}

# Setup SSL certificates
setup_ssl_certificates() {
    log_info "Setting up SSL certificates with Let's Encrypt..."
    
    # Start nginx for SSL verification
    docker-compose -f $SSL_COMPOSE_FILE --profile ssl-setup up -d nginx-ssl-setup
    
    # Wait for nginx to be ready
    sleep 5
    
    # Test if nginx is responding
    if ! curl -f http://localhost/health; then
        log_error "Nginx SSL setup container is not responding"
        return 1
    fi
    
    # Run certbot to get certificates
    log_info "Running Certbot to obtain SSL certificates..."
    docker-compose -f $SSL_COMPOSE_FILE --profile ssl-setup run --rm certbot
    
    # Stop SSL setup nginx
    docker-compose -f $SSL_COMPOSE_FILE --profile ssl-setup down
    
    # Check if certificates were created
    if [[ -f "nginx/ssl/live/$DOMAIN/fullchain.pem" && -f "nginx/ssl/live/$DOMAIN/privkey.pem" ]]; then
        log_success "SSL certificates obtained successfully"
        
        # Create symlinks for nginx
        ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/fullchain.pem
        ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/privkey.pem
        
        log_success "SSL certificate symlinks created"
        return 0
    else
        log_error "Failed to obtain SSL certificates"
        return 1
    fi
}

# Setup certificate renewal
setup_certificate_renewal() {
    log_info "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /etc/cron.d/certbot-renewal << EOF
# Renew Let's Encrypt certificates twice daily
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

0 */12 * * * root cd $PROJECT_DIR && docker-compose -f $SSL_COMPOSE_FILE --profile ssl-setup run --rm certbot renew --quiet && docker-compose exec nginx nginx -s reload
EOF
    
    chmod 644 /etc/cron.d/certbot-renewal
    log_success "Certificate renewal cron job created"
}

# Configure firewall
configure_firewall() {
    log_info "Configuring firewall..."
    
    # Check if ufw is available
    if command -v ufw &> /dev/null; then
        # Allow SSH, HTTP, and HTTPS
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # Block direct access to application port
        ufw deny 3000/tcp
        ufw deny 5432/tcp
        ufw deny 5050/tcp
        
        # Enable firewall if not already enabled
        echo "y" | ufw enable 2>/dev/null || true
        
        log_success "UFW firewall configured"
    else
        log_warning "UFW not available, please configure firewall manually"
    fi
}

# Start production services
start_production_services() {
    log_info "Starting production services..."
    
    # Build and start all services
    docker-compose up -d --build
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are healthy
    if docker-compose ps | grep -q "healthy\|Up"; then
        log_success "Production services started successfully"
        
        # Show service status
        echo
        log_info "Service Status:"
        docker-compose ps
        
        echo
        log_info "Testing endpoints..."
        
        # Test HTTP redirect
        if curl -I http://$DOMAIN 2>/dev/null | grep -q "301\|302"; then
            log_success "HTTP to HTTPS redirect working"
        else
            log_warning "HTTP redirect may not be working"
        fi
        
        # Test HTTPS
        if curl -I https://$DOMAIN 2>/dev/null | grep -q "200"; then
            log_success "HTTPS endpoint working"
        else
            log_warning "HTTPS endpoint may not be working"
        fi
        
        return 0
    else
        log_error "Some services failed to start properly"
        docker-compose logs
        return 1
    fi
}

# Backup existing certificates if any
backup_existing_certs() {
    if [[ -d "nginx/ssl/live" ]]; then
        log_info "Backing up existing certificates..."
        tar -czf "backups/ssl-backup-$(date +%Y%m%d-%H%M%S).tar.gz" nginx/ssl/
        log_success "Certificates backed up"
    fi
}

# Main execution
main() {
    log_info "Starting SSL setup for 1001 Stories"
    log_info "Domain: $DOMAIN"
    log_info "Email: $EMAIL"
    echo
    
    check_root
    check_prerequisites
    setup_directories
    backup_existing_certs
    stop_services
    
    if setup_ssl_certificates; then
        setup_certificate_renewal
        configure_firewall
        
        if start_production_services; then
            echo
            log_success "🎉 SSL setup completed successfully!"
            log_info "Your application is now available at: https://$DOMAIN"
            log_info "Certificate renewal is configured to run automatically"
            echo
            log_info "Next steps:"
            echo "  - Update DNS if needed"
            echo "  - Configure monitoring"
            echo "  - Set up backup procedures"
            echo "  - Review security settings"
        else
            log_error "Failed to start production services"
            exit 1
        fi
    else
        log_error "SSL certificate setup failed"
        log_info "You can:"
        log_info "  1. Check DNS configuration"
        log_info "  2. Verify domain ownership"
        log_info "  3. Check firewall settings"
        log_info "  4. Review logs in nginx/logs/"
        exit 1
    fi
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "renew")
        log_info "Renewing SSL certificates..."
        cd $PROJECT_DIR
        docker-compose -f $SSL_COMPOSE_FILE --profile ssl-setup run --rm certbot renew
        docker-compose exec nginx nginx -s reload
        log_success "Certificate renewal completed"
        ;;
    "status")
        log_info "SSL Certificate Status:"
        if [[ -f "nginx/ssl/live/$DOMAIN/fullchain.pem" ]]; then
            openssl x509 -in "nginx/ssl/live/$DOMAIN/fullchain.pem" -text -noout | grep -E "(Subject|Not After)"
        else
            log_warning "No SSL certificates found"
        fi
        ;;
    *)
        echo "Usage: $0 {setup|renew|status}"
        echo "  setup  - Initial SSL certificate setup"
        echo "  renew  - Renew existing certificates"
        echo "  status - Show certificate status"
        exit 1
        ;;
esac