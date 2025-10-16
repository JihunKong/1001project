# Serena MCP Guide - 1001 Stories Project

This guide provides comprehensive information for Serena MCP to understand and work with the 1001 Stories educational platform.

## Project Overview

**1001 Stories** is a global non-profit education platform that discovers, publishes, and shares stories from children in underserved communities. All revenue is reinvested through the Seeds of Empowerment program.

### Technology Stack
- **Frontend**: Next.js 15.4.6 with React 19, TailwindCSS
- **Backend**: Next.js API Routes with NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker Compose (Production)
- **Authentication**: NextAuth.js with email magic links + password login
- **AI Integration**: GPT & Upstage models for educational features

## Production Deployment Architecture

### Server Information
- **Domain**: https://1001stories.seedsofempowerment.org
- **IP Address**: 3.128.143.122
- **Platform**: AWS Lightsail
- **OS**: Ubuntu 22.04 LTS
- **SSH Key**: /Users/jihunkong/Downloads/1001project.pem

### Docker Compose Services
```yaml
services:
  nginx:     # Reverse proxy with SSL/TLS (Let's Encrypt)
  app:       # Next.js application (Node.js 20-alpine)
  postgres:  # PostgreSQL 15-alpine database
```

### Key Directories
```
Server: /home/ubuntu/1001project/
├── docker-compose.production.yml
├── .env.production
├── nginx/
│   ├── nginx.conf
│   └── ssl/ (Let's Encrypt certificates)
├── scripts/ (deployment scripts)
└── archived/ (cleaned up unused files)

Local: /Users/jihunkong/1001project/1001-stories/
├── Complete Next.js application
├── Source code and development files
```

## Authentication System

### Supported Login Methods
1. **Magic Link Email** (Primary)
2. **Password Authentication** (Secondary)

### Test Accounts with Passwords
All using crypto-based hashes (PBKDF2-SHA256):

```
volunteer@1001stories.org    : volunteer123
learner@demo.1001stories.org : learner123
teacher@demo.1001stories.org : teacher123
admin@1001stories.org        : admin123
```

### Password Hash Generation
```javascript
const crypto = require('crypto');
const salt = 'seeds-of-empowerment-2025';
const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
```

## User Role System

### Core Educational Roles
1. **LEARNER** - Students who read assigned books
2. **TEACHER** - Educators who manage classes and assign content
3. **VOLUNTEER** - Community contributors

### Content Management Roles
4. **STORY_MANAGER** - Review and approve submissions
5. **BOOK_MANAGER** - Manage publication pipeline
6. **CONTENT_ADMIN** - Final publication approval

### System Role
7. **ADMIN** - Full system administration

## Essential Commands

### Deployment
```bash
# SSH to server
ssh -i /Users/jihunkong/Downloads/1001project.pem ubuntu@3.128.143.122

# Navigate to project
cd /home/ubuntu/1001project

# Check services
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs app

# Restart services
docker-compose -f docker-compose.production.yml up -d --force-recreate

# Build new image
docker-compose -f docker-compose.production.yml build --no-cache app
```

### Database Operations
```bash
# Access database
docker-compose -f docker-compose.production.yml exec -T postgres psql -U stories_user -d stories_db

# Check users
docker-compose -f docker-compose.production.yml exec -T postgres psql -U stories_user -d stories_db -c "SELECT email, role FROM users ORDER BY email;"
```

### File Management
```bash
# Copy files to server
scp -i /Users/jihunkong/Downloads/1001project.pem file.txt ubuntu@3.128.143.122:/home/ubuntu/1001project/

# Copy files to container
docker-compose -f docker-compose.production.yml cp file.txt app:/app/
```

## Environment Configuration

### Production Environment (.env.production)
```bash
# Database
DATABASE_URL=postgresql://stories_user:stories_password_123@postgres:5432/stories_db

# NextAuth
NEXTAUTH_URL=https://1001stories.seedsofempowerment.org
NEXTAUTH_SECRET=production-secret-key-change-in-real-production-xyz789abc456

# Authentication
ALLOW_PASSWORD_LOGIN=true
TEST_MODE_ENABLED=true

# Features
ENABLE_AI_FEATURES=false
ENABLE_BOOK_CLUBS=true
ENABLE_VOCABULARY=true

# Node Environment
NODE_ENV=production
```

### SSL Configuration
- **Certificate Location**: `/home/ubuntu/1001project/nginx/ssl/`
- **Auto-renewal**: Let's Encrypt via nginx configuration
- **Domain**: 1001stories.seedsofempowerment.org

## Development Workflow

### Local Development
```bash
cd /Users/jihunkong/1001project/1001-stories
npm install
npm run dev     # Starts on http://localhost:3000
```

### Testing
```bash
npm run lint                    # ESLint checks
npx playwright test            # E2E tests
npm run build                  # Production build test
```

### Docker Development
```bash
./scripts/test-docker-local.sh  # Test locally in Docker
./scripts/deploy.sh deploy      # Deploy to production
./scripts/deploy.sh logs        # View deployment logs
```

## Content Management

### PDF Storage
- **Location**: `/public/books/` directory
- **No S3**: All PDFs are stored locally, not in cloud storage
- **Access**: Direct file serving through nginx

### Publishing Workflow
1. **Submission** → **Story Review** → **Revision** → **Story Approval**
2. **Format Decision** → **Final Approval** → **Publication** → **Distribution**

### AI Features
- **GPT**: Image generation, TTS functionality
- **Upstage**: Educational chatbot, content parsing
- **Status**: Currently disabled in production (ENABLE_AI_FEATURES=false)

## Database Schema

### Key Tables
- `User` - Authentication and profiles with role enum
- `Book` - PDF/TXT/MD content with metadata
- `Class` - Teacher's classes with join codes
- `BookAssignment` - Teacher assigns books to students
- `ReadingProgress` - Student reading tracking
- `Submission` - Content submissions with approval workflow

### Connection Details
- **Host**: postgres (Docker service)
- **Port**: 5432
- **Database**: stories_db
- **User**: stories_user
- **Password**: stories_password_123

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   - Check nginx SSL configuration
   - Verify Let's Encrypt certificate renewal

2. **Docker Build Issues**
   - Use `--no-cache` flag
   - Check Dockerfile for Alpine Linux compatibility

3. **Authentication Problems**
   - Verify NEXTAUTH_URL matches domain
   - Check password hash format in database

4. **Database Connection**
   - Ensure postgres service is healthy
   - Check DATABASE_URL environment variable

### Service Health Checks
```bash
# Check all containers
docker-compose -f docker-compose.production.yml ps

# Test website accessibility
curl -I https://1001stories.seedsofempowerment.org

# Check database connection
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U stories_user
```

## Recent Updates (2025-09-18)

1. **HTTPS Configuration**: Fixed asset loading with proper domain configuration
2. **Docker Optimization**: Added node_modules, scripts, prisma to runtime container
3. **Server Cleanup**: Moved unused files to archived/ directory
4. **Password Authentication**: Enabled password login for test accounts
5. **Role-based Testing**: Created working test accounts for all user roles

## Security Notes

- **SSH Key Management**: Keep 1001project.pem secure and with proper permissions (600)
- **Environment Variables**: Never commit production secrets to Git
- **Database Access**: Limited to Docker internal network
- **SSL/TLS**: All traffic encrypted via Let's Encrypt certificates
- **Password Hashing**: Using PBKDF2-SHA256 with 10,000 iterations

## Support & Monitoring

### Log Locations
- **Application**: `docker-compose logs app`
- **Database**: `docker-compose logs postgres`
- **Nginx**: `docker-compose logs nginx`

### Performance Monitoring
- **Health Checks**: Built into Docker Compose
- **Resource Usage**: Monitor via `docker stats`
- **Disk Space**: Check `/home/ubuntu/1001project/`

This guide provides Serena MCP with comprehensive understanding of the 1001 Stories platform architecture, deployment process, and operational procedures.