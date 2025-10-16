#!/bin/bash

# SSL-enabled deployment script for 1001 Stories
# This script deploys the application to AWS Lightsail with SSL support

set -e

SERVER_IP="3.128.143.122"
SERVER_USER="ubuntu"
SERVER_PATH="/home/ubuntu/1001project"
PEM_PATH="/Users/jihunkong/Downloads/1001project.pem"
DOMAIN="1001stories.seedsofempowerment.org"

echo "🚀 Deploying 1001 Stories with SSL support..."

# Function to run commands on server
run_remote() {
    ssh -i "$PEM_PATH" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# Function to copy files to server
copy_to_server() {
    scp -i "$PEM_PATH" -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_IP:$2"
}

echo "📦 Building application locally..."
npm run build

echo "📁 Copying files to server..."
copy_to_server "." "$SERVER_PATH/"

echo "🔧 Setting up SSL on server..."
run_remote "cd $SERVER_PATH && chmod +x scripts/setup-ssl.sh"

echo "🐳 Stopping existing containers..."
run_remote "cd $SERVER_PATH && docker-compose down || true"

echo "🔄 Starting services..."
run_remote "cd $SERVER_PATH && docker-compose up -d postgres redis app"

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🔐 Setting up SSL certificates..."
run_remote "cd $SERVER_PATH && ./scripts/setup-ssl.sh"

echo "🧪 Testing deployment..."
if curl -f -k "https://$DOMAIN/api/health"; then
    echo "✅ Deployment successful!"
    echo "🌐 Site is available at: https://$DOMAIN"
else
    echo "❌ Deployment may have issues. Checking logs..."
    run_remote "cd $SERVER_PATH && docker-compose logs --tail=50"
    exit 1
fi

echo ""
echo "📋 Post-deployment checklist:"
echo "1. ✅ HTTPS is working"
echo "2. 🔍 Check all pages load correctly"
echo "3. 🔐 Verify SSL certificate grade: https://www.ssllabs.com/ssltest/"
echo "4. 📱 Test mobile responsiveness"
echo "5. 🔄 Verify auto-renewal: ssh -i $PEM_PATH $SERVER_USER@$SERVER_IP 'cd $SERVER_PATH && docker-compose exec certbot certbot renew --dry-run'"

echo ""
echo "🔍 Monitoring commands:"
echo "  Logs: ssh -i $PEM_PATH $SERVER_USER@$SERVER_IP 'cd $SERVER_PATH && docker-compose logs -f'"
echo "  Status: ssh -i $PEM_PATH $SERVER_USER@$SERVER_IP 'cd $SERVER_PATH && docker-compose ps'"
echo "  SSL Test: curl -I https://$DOMAIN"