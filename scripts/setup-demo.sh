#!/bin/bash

echo "Setting up demo accounts on server..."

# Create .env.production if not exists
cat > .env.production << 'EOF'
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://43.202.3.58

# Demo Mode Configuration
DEMO_MODE_ENABLED=true
DEMO_BYPASS_EMAIL=true
DEMO_ACCOUNTS_ENABLED=true
NEXT_PUBLIC_DEMO_MODE=true

# NextAuth Configuration
NEXTAUTH_URL=http://43.202.3.58
NEXTAUTH_SECRET=your-nextauth-secret-key-generate-with-openssl-rand-base64-32

# Database (PostgreSQL) - Docker internal network
DATABASE_URL=postgresql://stories_user:stories_password_123@postgres:5432/stories_db

# Email Service (Optional - disabled for demo mode)
EMAIL_SERVICE_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=1001 Stories <noreply@1001stories.org>

# pgAdmin
PGADMIN_EMAIL=admin@1001stories.org
PGADMIN_PASSWORD=admin123
EOF

# Install dependencies if needed
npm install jsonwebtoken @types/jsonwebtoken

# Run database migrations
npx prisma migrate deploy

# Seed demo accounts
npx tsx prisma/seed-demo.ts

echo "Demo setup complete!"