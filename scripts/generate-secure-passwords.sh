#!/bin/bash
# Secure Password Generation Script for 1001 Stories
# Generates cryptographically secure passwords for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate secure password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

# Function to generate NextAuth secret (64 characters)
generate_nextauth_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

echo -e "${GREEN}🔐 Generating secure passwords for 1001 Stories production deployment${NC}"
echo -e "${YELLOW}⚠️  Store these passwords securely - they will not be displayed again!${NC}"
echo

# Generate passwords
DB_PASSWORD=$(generate_password 32)
REDIS_PASSWORD=$(generate_password 32)
NEXTAUTH_SECRET=$(generate_nextauth_secret)
PGADMIN_PASSWORD=$(generate_password 24)

# Create secure environment file
SECURE_ENV_FILE=".env.production.secure.generated"

cat > "$SECURE_ENV_FILE" << EOF
# SECURE Production Environment Variables
# Generated on: $(date)
# WARNING: Keep this file secure and never commit to version control

# Docker Environment Enforcement (REQUIRED)
DOCKER_REQUIRED=true

# Database - SECURE CREDENTIALS
DATABASE_URL=postgresql://stories_user:${DB_PASSWORD}@postgres:5432/stories_db
DB_USER=stories_user
DB_PASSWORD=${DB_PASSWORD}

# NextAuth - SECURE SECRET
NEXTAUTH_URL=https://1001stories.seedsofempowerment.org
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Email (Nodemailer) - Gmail SMTP Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=\${EMAIL_SERVER_USER}
EMAIL_SERVER_PASSWORD=\${EMAIL_SERVER_PASSWORD}
EMAIL_FROM=seedsofempowerment@gmail.com
MAIL_PASSWORD=\${EMAIL_SERVER_PASSWORD}

# Redis Cache - SECURE PASSWORD
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# AI Services (Optional - will work without these)
OPENAI_API_KEY=\${OPENAI_API_KEY}

# Feature Flags
ENABLE_AI_FEATURES=false
ENABLE_BOOK_CLUBS=true
ENABLE_VOCABULARY=true

# Authentication
ALLOW_PASSWORD_LOGIN=true
TEST_MODE_ENABLED=false  # CRITICAL: Disable in production

# Admin Access - SECURE PASSWORD
PGADMIN_EMAIL=admin@1001stories.org
PGADMIN_PASSWORD=${PGADMIN_PASSWORD}

# Node Environment
NODE_ENV=production

# Security Headers
SECURITY_HEADERS_ENABLED=true
RATE_LIMITING_ENABLED=true
CSRF_PROTECTION_ENABLED=true
EOF

echo -e "${GREEN}✅ Secure passwords generated successfully!${NC}"
echo -e "${GREEN}📁 Secure environment file created: ${SECURE_ENV_FILE}${NC}"
echo
echo -e "${YELLOW}🔑 Generated Credentials Summary:${NC}"
echo -e "Database Password: ${GREEN}${DB_PASSWORD}${NC}"
echo -e "Redis Password: ${GREEN}${REDIS_PASSWORD}${NC}"
echo -e "NextAuth Secret: ${GREEN}${NEXTAUTH_SECRET:0:16}...${NC} (truncated)"
echo -e "PgAdmin Password: ${GREEN}${PGADMIN_PASSWORD}${NC}"
echo
echo -e "${RED}⚠️  IMPORTANT SECURITY REMINDERS:${NC}"
echo -e "1. Copy ${SECURE_ENV_FILE} to .env.production before deployment"
echo -e "2. Update docker-compose.yml with new passwords"
echo -e "3. Never commit this file to version control"
echo -e "4. Store passwords in a secure password manager"
echo -e "5. Set EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD manually"
echo
echo -e "${GREEN}🚀 Ready for secure production deployment!${NC}"