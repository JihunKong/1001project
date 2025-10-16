#!/bin/bash

# SSL Certificate Setup Script for 1001 Stories
# This script sets up Let's Encrypt SSL certificates with Docker and nginx

set -e

DOMAIN="1001stories.seedsofempowerment.org"
EMAIL="admin@seedsofempowerment.org"  # Replace with your email
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo "🔐 Setting up SSL certificates for $DOMAIN"

# Create necessary directories
echo "📁 Creating certificate directories..."
mkdir -p ./certbot/conf
mkdir -p ./certbot/www
mkdir -p ./certbot/logs
mkdir -p ./nginx/logs

# Create initial dummy certificate to start nginx
echo "🔧 Creating dummy certificate for initial setup..."
mkdir -p "./certbot/conf/live/$DOMAIN"

# Generate dummy certificates
openssl req -x509 -nodes -newkey rsa:4096 \
    -days 1 \
    -keyout "./certbot/conf/live/$DOMAIN/privkey.pem" \
    -out "./certbot/conf/live/$DOMAIN/fullchain.pem" \
    -subj "/CN=$DOMAIN"

# Create dummy chain file
cp "./certbot/conf/live/$DOMAIN/fullchain.pem" "./certbot/conf/live/$DOMAIN/chain.pem"

echo "🐳 Starting containers with dummy certificates..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d nginx

# Wait for nginx to start
echo "⏳ Waiting for nginx to start..."
sleep 10

# Test if nginx is running
if ! curl -f http://localhost/.well-known/acme-challenge/test 2>/dev/null; then
    echo "⚠️  nginx may not be ready, but continuing..."
fi

# Remove dummy certificate
echo "🗑️  Removing dummy certificate..."
rm -rf "./certbot/conf/live/$DOMAIN"

# Obtain real certificate
echo "🔒 Obtaining real SSL certificate from Let's Encrypt..."
docker-compose -f $DOCKER_COMPOSE_FILE run --rm certbot \
    certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

# Reload nginx with real certificate
echo "🔄 Reloading nginx with real certificate..."
docker-compose -f $DOCKER_COMPOSE_FILE exec nginx nginx -s reload

# Test SSL certificate
echo "🧪 Testing SSL certificate..."
if curl -f https://$DOMAIN/api/health; then
    echo "✅ SSL certificate setup completed successfully!"
    echo "🌐 Your site is now available at: https://$DOMAIN"
else
    echo "❌ SSL setup may have issues. Check the logs:"
    echo "   docker-compose logs nginx"
    echo "   docker-compose logs certbot"
fi

echo ""
echo "📋 Next steps:"
echo "1. Verify your site works: https://$DOMAIN"
echo "2. Test automatic renewal: docker-compose exec certbot certbot renew --dry-run"
echo "3. Monitor logs: docker-compose logs -f"

echo ""
echo "🔄 Certificate auto-renewal is configured to run every 12 hours"
echo "📅 Certificates are valid for 90 days and will auto-renew when they have 30 days left"