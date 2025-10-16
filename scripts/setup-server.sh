#!/bin/bash

# Initial Server Setup Script for 1001 Stories Production Server
# Run this once on a fresh Ubuntu server to prepare for Docker deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Run as ubuntu user."
        exit 1
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    sudo apt-get update
    sudo apt-get upgrade -y
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        htop \
        tree \
        vim \
        bc
    success "System packages updated"
}

# Install Docker
install_docker() {
    log "Installing Docker..."

    # Remove old versions
    sudo apt-get remove -y docker docker-engine docker.io containerd runc || true

    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io

    # Add ubuntu user to docker group
    sudo usermod -aG docker ubuntu

    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker

    success "Docker installed"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."

    # Download and install Docker Compose
    local compose_version="v2.20.2"
    sudo curl -L "https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Create symlink for easier access
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

    success "Docker Compose installed"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."

    # Reset UFW to defaults
    sudo ufw --force reset

    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing

    # Allow SSH
    sudo ufw allow 22/tcp

    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp

    # Enable UFW
    sudo ufw --force enable

    success "Firewall configured"
}

# Configure fail2ban
configure_fail2ban() {
    log "Configuring fail2ban..."

    # Create custom SSH jail
    sudo tee /etc/fail2ban/jail.d/ssh.conf > /dev/null << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

    # Create nginx jail for future use
    sudo tee /etc/fail2ban/jail.d/nginx.conf > /dev/null << 'EOF'
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600
EOF

    # Restart fail2ban
    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban

    success "Fail2ban configured"
}

# Create application directory structure
create_directories() {
    log "Creating directory structure..."

    # Create main application directory
    mkdir -p /home/ubuntu/1001project
    cd /home/ubuntu/1001project

    # Create subdirectories
    mkdir -p {nginx/logs,nginx/ssl,nginx/www,backups,uploads}

    # Set proper permissions
    chmod 755 /home/ubuntu/1001project
    chmod -R 755 nginx
    chmod -R 755 backups
    chmod -R 755 uploads

    success "Directory structure created"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."

    sudo tee /etc/logrotate.d/1001stories > /dev/null << 'EOF'
/home/ubuntu/1001project/nginx/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker kill --signal="USR1" $(docker ps -q --filter name=nginx) 2>/dev/null || true
    endscript
}

/home/ubuntu/1001project/backups/*.log {
    weekly
    missingok
    rotate 12
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF

    success "Log rotation configured"
}

# Setup automated backups
setup_backups() {
    log "Setting up automated backups..."

    # Create backup script
    tee /home/ubuntu/1001project/scripts/backup-db.sh > /dev/null << 'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/home/ubuntu/1001project/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/auto_backup_$DATE.sql"

# Create backup
docker exec postgres pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-stories_db} > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "auto_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

    chmod +x /home/ubuntu/1001project/scripts/backup-db.sh

    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/1001project/scripts/backup-db.sh >> /home/ubuntu/1001project/backups/backup.log 2>&1") | crontab -

    success "Automated backups configured"
}

# Install monitoring tools
install_monitoring() {
    log "Installing monitoring tools..."

    # Install Node Exporter for Prometheus monitoring
    local node_exporter_version="1.6.1"
    cd /tmp
    wget "https://github.com/prometheus/node_exporter/releases/download/v${node_exporter_version}/node_exporter-${node_exporter_version}.linux-amd64.tar.gz"
    tar xvfz "node_exporter-${node_exporter_version}.linux-amd64.tar.gz"
    sudo mv "node_exporter-${node_exporter_version}.linux-amd64/node_exporter" /usr/local/bin/
    rm -rf "node_exporter-${node_exporter_version}.linux-amd64"*

    # Create node_exporter user
    sudo useradd --no-create-home --shell /bin/false node_exporter || true

    # Create systemd service
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null << 'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    # Start and enable node_exporter
    sudo systemctl daemon-reload
    sudo systemctl start node_exporter
    sudo systemctl enable node_exporter

    success "Monitoring tools installed"
}

# Configure SSH security
configure_ssh() {
    log "Configuring SSH security..."

    # Backup original sshd_config
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

    # Apply security configurations
    sudo tee -a /etc/ssh/sshd_config > /dev/null << 'EOF'

# 1001 Stories Security Configuration
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2
Protocol 2
EOF

    # Restart SSH service
    sudo systemctl restart ssh

    success "SSH security configured"
}

# Install system performance optimizations
optimize_system() {
    log "Applying system optimizations..."

    # Optimize sysctl settings
    sudo tee /etc/sysctl.d/99-1001stories.conf > /dev/null << 'EOF'
# Network optimizations
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr

# Security
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# File system
fs.file-max = 65536
vm.swappiness = 10
EOF

    # Apply sysctl settings
    sudo sysctl -p /etc/sysctl.d/99-1001stories.conf

    # Set limits
    sudo tee /etc/security/limits.d/99-1001stories.conf > /dev/null << 'EOF'
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

    success "System optimizations applied"
}

# Create environment template
create_env_template() {
    log "Creating environment template..."

    tee /home/ubuntu/1001project/.env.production > /dev/null << 'EOF'
# Production Environment Variables
# Configure these values before deploying

# Database Configuration
DATABASE_URL="postgresql://postgres:CHANGE_THIS_PASSWORD@postgres:5432/stories_db"
POSTGRES_DB="stories_db"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="CHANGE_THIS_PASSWORD"

# Redis Configuration
REDIS_URL="redis://:CHANGE_THIS_PASSWORD@redis:6379"
REDIS_PASSWORD="CHANGE_THIS_PASSWORD"

# NextAuth Configuration
NEXTAUTH_URL="https://1001stories.seedsofempowerment.org"
NEXTAUTH_SECRET="CHANGE_THIS_TO_RANDOM_32_CHAR_STRING"

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@1001stories.org"

# AI Configuration
OPENAI_API_KEY="your-openai-api-key"
UPSTAGE_API_KEY="your-upstage-api-key"

# Application Settings
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://1001stories.seedsofempowerment.org"

# Feature Flags
ENABLE_AI_IMAGES="true"
ENABLE_TTS="true"
ENABLE_CHATBOT="true"
ENABLE_ESL_FEATURES="true"
ENABLE_SEEDS_THEME="true"
DISABLE_ECOMMERCE="true"
EOF

    chmod 600 /home/ubuntu/1001project/.env.production

    success "Environment template created"
}

# Show completion summary
show_summary() {
    log "Server setup completed successfully!"
    echo ""
    echo "=== Next Steps ==="
    echo "1. Configure environment variables in: /home/ubuntu/1001project/.env.production"
    echo "2. Deploy the application using: ./scripts/deploy.sh deploy"
    echo "3. Setup SSL certificates using: ./scripts/deploy.sh ssl"
    echo ""
    echo "=== Important Notes ==="
    echo "- Change all passwords in .env.production"
    echo "- Setup domain DNS to point to this server"
    echo "- Monitor logs with: docker-compose logs -f"
    echo "- Backups run automatically at 2 AM daily"
    echo ""
    echo "=== Security Status ==="
    echo "- Firewall: Configured (ports 22, 80, 443)"
    echo "- Fail2ban: Active"
    echo "- SSH: Key-only authentication"
    echo "- Monitoring: Node Exporter on port 9100"
    echo ""
    success "Server is ready for deployment!"
}

# Main execution
main() {
    log "Starting 1001 Stories server setup..."

    check_root
    update_system
    install_docker
    install_docker_compose
    configure_firewall
    configure_fail2ban
    create_directories
    setup_log_rotation
    setup_backups
    install_monitoring
    configure_ssh
    optimize_system
    create_env_template
    show_summary

    warn "IMPORTANT: Log out and log back in for Docker group changes to take effect!"
}

# Run main function
main "$@"