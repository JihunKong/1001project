#!/bin/bash

# SSL Certificate Renewal Script with Certbot
set -e

DOMAIN="1001stories.seedsofempowerment.org"
EMAIL="admin@1001stories.org"
NGINX_CONTAINER="1001-stories-nginx"
CERT_PATH="/etc/nginx/ssl"
WEBHOOK_URL="${MONITORING_WEBHOOK}"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

log() {
    echo "${LOG_PREFIX} $1"
}

notify_monitoring() {
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"event\":\"$1\",\"timestamp\":\"$(date -Iseconds)\",\"service\":\"ssl-renewer\",\"details\":\"$2\"}" \
            2>/dev/null || log "Failed to send monitoring notification"
    fi
}

# Function to check certificate expiry
check_cert_expiry() {
    log "Checking SSL certificate expiry..."
    
    if [ -f "$CERT_PATH/fullchain.pem" ]; then
        expiry_date=$(openssl x509 -enddate -noout -in "$CERT_PATH/fullchain.pem" | cut -d= -f2)
        expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s)
        current_epoch=$(date +%s)
        days_until_expiry=$(( ($expiry_epoch - $current_epoch) / 86400 ))
        
        log "Certificate expires in $days_until_expiry days"
        
        if [ $days_until_expiry -gt 30 ]; then
            log "Certificate is still valid. No renewal needed."
            notify_monitoring "ssl_check_valid" "Certificate valid for $days_until_expiry days"
            exit 0
        fi
        
        log "Certificate will expire in $days_until_expiry days. Proceeding with renewal..."
    else
        log "Certificate file not found. Proceeding with initial certificate request..."
    fi
}

# Function to stop nginx temporarily
stop_nginx() {
    log "Stopping nginx temporarily for certificate renewal..."
    docker stop $NGINX_CONTAINER || log "Warning: Could not stop nginx container"
    sleep 5
}

# Function to start nginx
start_nginx() {
    log "Starting nginx..."
    docker start $NGINX_CONTAINER || log "Warning: Could not start nginx container"
    sleep 10
}

# Function to renew certificate
renew_certificate() {
    log "Starting SSL certificate renewal..."
    
    # Stop nginx to free port 80
    stop_nginx
    
    # Run certbot in standalone mode
    docker run --rm \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/lib/letsencrypt:/var/lib/letsencrypt \
        -v /var/www/certbot:/var/www/certbot \
        -p 80:80 \
        certbot/certbot:latest \
        certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        --force-renewal
    
    if [ $? -eq 0 ]; then
        log "Certificate renewed successfully"
        
        # Copy new certificates to nginx ssl directory
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_PATH/
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_PATH/
        sudo chown -R root:root $CERT_PATH
        sudo chmod 644 $CERT_PATH/fullchain.pem
        sudo chmod 600 $CERT_PATH/privkey.pem
        
        log "Certificates copied to nginx ssl directory"
        
        # Start nginx with new certificates
        start_nginx
        
        # Test nginx configuration
        if docker exec $NGINX_CONTAINER nginx -t; then
            log "Nginx configuration test passed"
            # Reload nginx without downtime
            docker exec $NGINX_CONTAINER nginx -s reload
            log "Nginx reloaded with new certificates"
            
            # Verify SSL is working
            sleep 5
            if curl -f --max-time 10 https://$DOMAIN/health >/dev/null 2>&1; then
                log "SSL verification successful - HTTPS is working"
                notify_monitoring "ssl_renewal_success" "Certificate renewed and verified for $DOMAIN"
            else
                log "Warning: SSL renewal completed but HTTPS verification failed"
                notify_monitoring "ssl_renewal_warning" "Certificate renewed but verification failed"
            fi
        else
            log "Error: Nginx configuration test failed"
            notify_monitoring "ssl_renewal_failure" "Nginx configuration test failed after renewal"
            exit 1
        fi
        
    else
        log "Certificate renewal failed"
        # Make sure nginx is running even if renewal failed
        start_nginx
        notify_monitoring "ssl_renewal_failure" "Certbot certificate renewal failed"
        exit 1
    fi
}

# Function to cleanup old certificates
cleanup_old_certs() {
    log "Cleaning up old certificate backups..."
    find /etc/letsencrypt/archive/$DOMAIN -name "*.pem" -mtime +90 -delete 2>/dev/null || true
    log "Old certificate cleanup completed"
}

# Main execution
log "SSL certificate renewal process started"

# Check if running in container
if [ -f /.dockerenv ]; then
    log "Running inside Docker container"
    # Adjust paths for container environment
    CERT_PATH="/etc/nginx/ssl"
fi

# Verify domain is accessible
if ! ping -c 1 $DOMAIN >/dev/null 2>&1; then
    log "Warning: Domain $DOMAIN is not reachable"
    notify_monitoring "ssl_renewal_warning" "Domain not reachable during renewal check"
fi

# Run the renewal process
check_cert_expiry
renew_certificate
cleanup_old_certs

log "SSL certificate renewal process completed successfully"
notify_monitoring "ssl_renewal_complete" "All SSL operations completed successfully"