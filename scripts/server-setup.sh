#!/bin/bash

# Server Setup Script for 1001 Stories Platform
# This script sets up the production environment on Ubuntu server

set -e

echo "🚀 Starting server setup for 1001 Stories..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build essentials
echo "📦 Installing build essentials..."
sudo apt-get install -y build-essential

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Docker and Docker Compose
echo "🐳 Installing Docker..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install nginx for reverse proxy
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install certbot for SSL
echo "🔒 Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/1001-stories
sudo chown ubuntu:ubuntu /var/www/1001-stories

# Clone repository
echo "📥 Cloning repository..."
cd /var/www
git clone https://github.com/JihunKong/1001project.git 1001-stories || echo "Repository already exists"
cd 1001-stories

# Checkout latest tag
echo "🏷️ Checking out v0.2.0..."
git fetch --all --tags
git checkout v0.2.0

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Setup PostgreSQL with Docker
echo "🐳 Setting up PostgreSQL with Docker..."
sudo docker compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Create Nginx configuration
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/1001-stories > /dev/null <<EOF
server {
    listen 80;
    server_name 43.202.3.58;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/1001-stories /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000/tcp
sudo ufw allow 5432/tcp
sudo ufw --force enable

# Create systemd service for the application
echo "🎭 Creating systemd service..."
sudo tee /etc/systemd/system/1001-stories.service > /dev/null <<EOF
[Unit]
Description=1001 Stories Next.js Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/1001-stories
ExecStart=/usr/bin/npm run start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable 1001-stories

echo "✅ Server setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Create .env.production file with environment variables"
echo "2. Run database migrations: npm run db:migrate"
echo "3. Build the application: npm run build"
echo "4. Start the application: sudo systemctl start 1001-stories"
echo "5. Check status: sudo systemctl status 1001-stories"
echo ""
echo "🔑 Don't forget to:"
echo "- Set up environment variables in .env.production"
echo "- Configure domain name and SSL certificate"
echo "- Set up backup strategy"
echo "- Configure monitoring"