#!/bin/bash

# SSL Certificate Setup Script for 1001 Stories
# Uses Let's Encrypt with certbot

set -e

DOMAIN="1001stories.seedsofempowerment.org"
EMAIL="admin@seedsofempowerment.org"
WEBROOT="/var/www/certbot"
SSL_DIR="/etc/nginx/ssl"

echo "========================================="
echo "  1001 Stories SSL Certificate Setup    "
echo "========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Please run as root (use sudo)"
    exit 1
fi

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot
    elif command -v yum &> /dev/null; then
        yum install -y certbot
    else
        echo "❌ Could not install certbot. Please install manually."
        exit 1
    fi
fi

# Create webroot directory
echo "📁 Creating webroot directory..."
mkdir -p $WEBROOT

# Create SSL directory
echo "📁 Creating SSL directory..."
mkdir -p $SSL_DIR

# Stop nginx temporarily for standalone mode
echo "🛑 Stopping nginx..."
systemctl stop nginx || service nginx stop || true

# Request certificate using standalone mode (since nginx is stopped)
echo "🔐 Requesting SSL certificate for $DOMAIN..."
certbot certonly \
    --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN \
    --non-interactive

# Copy certificates to nginx SSL directory
echo "📋 Copying certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 600 $SSL_DIR/privkey.pem
chmod 644 $SSL_DIR/fullchain.pem

# Restart nginx
echo "🚀 Starting nginx..."
systemctl start nginx || service nginx start

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate setup completed successfully!"
    echo "🌐 Your site should now be accessible via HTTPS"
    echo "📅 Certificate expires: $(openssl x509 -enddate -noout -in $SSL_DIR/fullchain.pem)"
else
    echo "❌ Nginx configuration test failed. Please check the configuration."
    exit 1
fi

# Setup auto-renewal
echo "⏰ Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo ""
echo "🎉 Setup complete!"
echo "📋 Next steps:"
echo "   1. Test HTTPS: https://$DOMAIN"
echo "   2. Auto-renewal is configured to run daily at 12:00 PM"
echo "   3. Manual renewal: certbot renew"
echo ""