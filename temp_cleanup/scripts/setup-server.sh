#!/bin/bash

# ============================================
# 1001 Stories Server Setup Script
# Run this once on a fresh Ubuntu server
# ============================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   1001 Stories Server Setup Script    ${NC}"
echo -e "${BLUE}========================================${NC}"

# Update system
echo -e "\n${YELLOW}Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
echo -e "${GREEN}✓ System updated${NC}"

# Install essential tools
echo -e "\n${YELLOW}Installing essential tools...${NC}"
sudo apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    build-essential \
    software-properties-common
echo -e "${GREEN}✓ Essential tools installed${NC}"

# Install Docker
echo -e "\n${YELLOW}Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "\n${YELLOW}Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Install Node.js (for running scripts locally if needed)
echo -e "\n${YELLOW}Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed${NC}"
fi

# Install Nginx (as backup or for additional configuration)
echo -e "\n${YELLOW}Installing Nginx...${NC}"
sudo apt-get install -y nginx
sudo systemctl stop nginx  # Stop since we'll use Docker nginx
sudo systemctl disable nginx
echo -e "${GREEN}✓ Nginx installed (disabled in favor of Docker)${NC}"

# Install Certbot for SSL certificates
echo -e "\n${YELLOW}Installing Certbot for SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot 2>/dev/null || true
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi

# Create deployment directory
echo -e "\n${YELLOW}Creating deployment directory...${NC}"
sudo mkdir -p /var/www/1001-stories
sudo chown -R $USER:$USER /var/www/1001-stories
echo -e "${GREEN}✓ Deployment directory created${NC}"

# Setup firewall
echo -e "\n${YELLOW}Configuring firewall...${NC}"
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Next.js (development)
sudo ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

# Create swap file (helpful for small servers)
echo -e "\n${YELLOW}Creating swap file...${NC}"
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo -e "${GREEN}✓ 2GB Swap file created${NC}"
else
    echo -e "${GREEN}✓ Swap file already exists${NC}"
fi

# Create SSL directory
echo -e "\n${YELLOW}Creating SSL directory...${NC}"
sudo mkdir -p /var/www/1001-stories/nginx/ssl
sudo chown -R $USER:$USER /var/www/1001-stories/nginx
echo -e "${GREEN}✓ SSL directory created${NC}"

# Setup log rotation
echo -e "\n${YELLOW}Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/1001-stories > /dev/null << 'EOF'
/var/www/1001-stories/nginx/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 root adm
    sharedscripts
    postrotate
        docker exec 1001-stories-nginx nginx -s reload > /dev/null 2>&1 || true
    endscript
}
EOF
echo -e "${GREEN}✓ Log rotation configured${NC}"

# Display system information
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   System Information                   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Docker version: $(docker --version)"
echo -e "Docker Compose version: $(docker-compose --version)"
echo -e "Node.js version: $(node --version)"
echo -e "NPM version: $(npm --version)"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Server setup completed!              ${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Clone your repository to /var/www/1001-stories"
echo -e "2. Create .env file with production settings"
echo -e "3. Run the deployment script"
echo -e "4. Configure DNS to point to this server"
echo -e "5. Setup SSL certificate with: sudo certbot --nginx"

echo -e "\n${YELLOW}IMPORTANT: Logout and login again for Docker permissions to take effect${NC}"