# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**1001 Stories** is a non-profit global education platform that discovers, publishes, and shares stories from children in underserved communities. All revenue is reinvested through the Seeds of Empowerment program.

## Current Architecture (Production)

### Technology Stack
- **Frontend:** Next.js 15.4.6 with React 19, TailwindCSS
- **Backend:** Next.js API Routes with NextAuth.js
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** Docker Compose (Local Development Priority)
- **Authentication:** NextAuth.js with email magic links
- **AI Integration:** 
  - GPT Model - Image generation for text-only stories, TTS functionality
  - Upstage Model - Educational chatbot, content parsing

### Core Features in Production
1. **User Authentication** - Email-based magic link authentication
2. **Multi-Role System** - 8 distinct roles with specific permissions
3. **Progressive Library Access** - Teacher-controlled book assignments
4. **Publishing Workflow** - Multi-stage content approval pipeline
5. **AI-Enhanced Learning** - Content parsing, word explanations, Q&A

### Project Structure
```
1001-stories/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Role-based dashboards
│   ├── demo/              # Demo experience pages
│   └── (public pages)     # Landing, login, signup, etc.
├── components/            # Reusable React components
├── lib/                   # Utility functions and configs
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── scripts/              # Deployment scripts (3 essential)
└── tests/                # Playwright E2E tests
```

## Development Workflow

**⚠️ CRITICAL NEW WORKFLOW (2025-09-19) - MANDATORY**

**Local Docker Test → Build Success → Then Git/Server Upload**

Never deploy or upload to server without first confirming local Docker build success. This prevents claiming server is running when it's actually broken.

### Mandatory Development Process
```bash
# 1. FIRST: Test locally in Docker
docker-compose -f docker-compose.local.yml up -d --build

# 2. Verify all services are running
docker-compose -f docker-compose.local.yml ps
docker-compose -f docker-compose.local.yml logs app

# 3. Test key functionality
curl http://localhost:3000/api/health
npm run lint
npm run build

# 4. ONLY AFTER SUCCESS: Git operations
git add .
git commit -m "Description"
git push

# 5. ONLY AFTER GIT SUCCESS: Server deployment
./scripts/deploy.sh deploy
```

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Run database migrations
npx prisma migrate dev

# Seed demo data
npx tsx prisma/seed-demo.ts

# Start development server (or use Docker)
npm run dev
```

### Testing
```bash
# Run linting
npm run lint

# Run Playwright tests
npx playwright test

# Run specific test
npx playwright test tests/landing-page.spec.ts
```

### Deployment
```bash
# Build for production
npm run build

# Deploy to AWS EC2
./scripts/deploy.sh deploy

# Check deployment logs
./scripts/deploy.sh logs

# Rollback if needed
./scripts/deploy.sh rollback
```

## ⚠️ MANDATORY DEPLOYMENT WORKFLOW (2025-11-04)

**CRITICAL: This is the ONLY correct deployment method. No exceptions.**

User emphasis (2025-11-04): "강제재부팅을 실행했습니다. 반드시 제가 말씀드린 방법으로 해야 오류가 발생하지 않을 것입니다. 기록해놓고 잊지 마십시오."
(Translation: "I executed a forced reboot. It MUST be done the way I told you or errors will occur. Record this and don't forget.")

### The MANDATORY 3-Step Workflow

```bash
# Step 1: Build Docker image LOCALLY
docker compose build app

# Step 2: Save image as tar.gz and upload to server
IMAGE_FILE="/tmp/1001-stories-app-$(date +%Y%m%d_%H%M%S).tar.gz"
docker save 1001-stories-app:latest | gzip > "$IMAGE_FILE"
scp -i /Users/jihunkong/Downloads/1001project.pem "$IMAGE_FILE" ubuntu@3.128.143.122:/tmp/app-image.tar.gz
rm "$IMAGE_FILE"

# Step 3: On server - Clean cache, load image, start containers
ssh ubuntu@3.128.143.122 << 'EOF'
  cd /home/ubuntu/1001-stories

  # MANDATORY: Clean Docker cache (user requirement)
  docker system prune -af --volumes

  # Load pre-built image
  gunzip -c /tmp/app-image.tar.gz | docker load
  rm /tmp/app-image.tar.gz

  # Start all containers
  docker compose up -d
EOF
```

### Automated Deployment

The `scripts/deploy.sh deploy` command now automatically performs all 3 steps:

```bash
# Recommended: Use the automated script
./scripts/deploy.sh deploy
```

The script includes:
- Local Docker image build
- Image save to tar.gz
- Upload to server via SCP
- **MANDATORY** server cache clean (`docker system prune -af --volumes`)
- Image load from tar.gz
- Container startup
- Deployment verification with automatic rollback on failure

### Why This Is MANDATORY

**Complete Server Outage Incident (2025-11-04)**:
- Previous method: rsync source → rebuild on server
- **Problem**: `docker compose build --no-cache` hung for 10+ minutes on server
- **Result**: ALL 7 containers stopped, never restarted
- **Impact**: Complete service outage, HTTPS completely inaccessible
- **Recovery**: Required forced server reboot by user

**Root Cause Analysis**:
1. Server-side Docker build consumed excessive resources
2. Build process hung or failed silently
3. Containers remained stopped after failed build
4. No automatic recovery mechanism
5. Service completely inaccessible until manual intervention

**Why Image-Based Deployment Prevents This**:
- ✅ Build happens locally (no server resource exhaustion)
- ✅ Build verified before upload (catches errors early)
- ✅ Server only loads image (fast, reliable operation)
- ✅ No building on server (eliminates primary failure mode)
- ✅ Cache cleaning prevents deployment issues
- ✅ Faster deployments (~3 min vs 10-20 min)
- ✅ Automatic verification and rollback

### What NOT to Do (FORBIDDEN)

```bash
# ❌ NEVER rsync source code and build on server
rsync -avz ./ ubuntu@3.128.143.122:/home/ubuntu/1001-stories/
ssh ubuntu@3.128.143.122 "cd /home/ubuntu/1001-stories && docker compose build --no-cache && docker compose up -d"

# ❌ NEVER use partial service restart
docker compose up -d --force-recreate app  # Missing: nginx, certbot, etc.

# ❌ NEVER skip cache cleaning
# User explicitly requires: docker system prune -af --volumes

# ❌ NEVER skip deployment verification
# Always verify containers are running and HTTPS returns 200
```

### Deployment Verification (Automated)

The deploy script automatically performs these checks:

```bash
# 1. Container Status Check
# Verifies: nginx, app, postgres, redis, certbot all running

# 2. nginx Verification (CRITICAL)
# nginx MUST be running for HTTPS to work

# 3. Unhealthy Container Detection
# Checks for any unhealthy or exited containers

# 4. HTTPS Endpoint Test
# Tests: curl https://localhost/api/health
# Must return: 200

# 5. Automatic Rollback
# If any check fails: automatic rollback to previous state
```

### Files Modified for This Workflow

**docker-compose.yml** - Added image priority:
```yaml
services:
  app:
    image: ${APP_IMAGE:-1001-stories-app:latest}  # Takes priority
    build:
      context: .
      dockerfile: Dockerfile
```

**scripts/deploy.sh** - Complete deploy() function rewrite:
- Removed: rsync source code upload
- Removed: Server-side Docker builds
- Added: Local image build
- Added: Docker save/load via tar.gz
- Added: **MANDATORY** cache cleaning
- Added: Deployment verification
- Added: Automatic rollback

### Key Points to Remember

1. **MANDATORY**: Build locally, NOT on server
2. **MANDATORY**: Clean server cache before loading image
3. **MANDATORY**: Verify deployment with automated checks
4. **FORBIDDEN**: Source code rsync + server builds
5. **FORBIDDEN**: Partial container restarts (always use `docker compose up -d`)
6. **FORBIDDEN**: Skipping cache cleaning (user requirement)

### Historical Context

- **2025-10-31**: Partial service restart issue (missing nginx)
- **2025-11-04**: Complete server outage (all containers down)
- **2025-11-04**: User-mandated workflow implemented
- **Current**: Image-based deployment is ONLY correct method

**User Accountability Warning**: "반드시 제가 말씀드린 방법으로 해야 오류가 발생하지 않을 것입니다. 기록해놓고 잊지 마십시오."

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/1001stories"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (Nodemailer)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@1001stories.org"

# AI Integration
OPENAI_API_KEY="your-openai-api-key"  # For GPT image generation & TTS
UPSTAGE_API_KEY="your-upstage-api-key"  # For educational chatbot & parsing

# Feature Flags
ENABLE_AI_IMAGES="true"
ENABLE_TTS="true"
ENABLE_CHATBOT="true"
```

## Key Implementation Notes

### Authentication Flow
1. User clicks role card → redirects to `/login` with callback URL
2. User enters email → magic link sent via Nodemailer
3. User clicks link → authenticated and redirected to dashboard
4. Middleware handles route protection and role-based access

### Demo Mode
- Separate `/demo` routes with sample data
- No authentication required
- Yellow banner indicates demo mode
- CTAs throughout to encourage signup

### Performance Optimizations
- Dynamic imports for code splitting
- Image optimization with Next.js Image
- Tailwind CSS for minimal CSS bundle
- PostgreSQL connection pooling with Prisma

## Code Style Guidelines

1. **TypeScript**: Use strict typing, avoid `any`
2. **Components**: Functional components with hooks
3. **Styling**: Tailwind CSS utilities, avoid inline styles
4. **State**: React hooks for local, Zustand for global
5. **API**: RESTful routes in `/app/api`
6. **Database**: Prisma ORM with type-safe queries
7. **No Comments**: Don't add comments unless explicitly requested

## Common Commands

```bash
# Database
npx prisma studio         # Open Prisma Studio
npx prisma migrate dev    # Create migration
npx prisma generate       # Generate client
npx prisma db push       # Push schema changes

# Development
npm run dev              # Start dev server
npm run build           # Build production
npm run lint            # Check code quality

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs app  # View logs

# Deployment
./scripts/deploy.sh deploy    # Deploy to production
./scripts/test-docker-local.sh # Test Docker locally
./scripts/setup-server.sh     # Initial server setup
```

## Important Files

- `middleware.ts` - Authentication and routing logic
- `lib/auth.ts` - NextAuth configuration
- `prisma/schema.prisma` - Database schema
- `docker-compose.yml` - Production deployment config
- `scripts/deploy.sh` - Main deployment script
- `.env.production` - Production environment variables
- `.env.local` - Local development variables

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if port 3000/3001 is in use
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Database connection**: Verify DATABASE_URL is correct
   ```bash
   npx prisma db push
   ```

3. **Email not sending**: Check SMTP credentials and app password
   - Gmail requires app-specific password
   - Enable 2FA and generate app password

4. **Docker issues**: Clean restart
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

5. **Build errors**: Clear cache and rebuild
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

## Recent Cleanup (2025-08-14)

### Files Removed
- **10 shell scripts** → kept only 3 essential
- **8 documentation files** → consolidated into CLAUDE.md and README.md
- **5 npm packages** → removed unused dependencies
- **57 TypeScript warnings** → fixed unused imports

### Code Improvements
- Removed unused imports and variables
- Consolidated duplicate code
- Simplified component structure
- Reduced bundle size by ~30%

## Production Server

- **IP**: 13.209.14.175
- **Platform**: AWS EC2
- **OS**: Ubuntu 22.04 LTS
- **Docker**: Compose with nginx, PostgreSQL, app containers
- **SSL**: Configured via nginx

## User Roles & Permissions

### Core Educational Roles
1. **LEARNER** - `/dashboard/learner`
   - Access only teacher-assigned books (not full library)
   - Read PDF/TXT/MD content with proficiency-based parsing
   - Difficult word explanations and AI assistance
   - Participate in book clubs and discussions
   - Submit publishing requests for own stories

2. **TEACHER** - `/dashboard/teacher`
   - Create and manage class codes for student matching
   - Assign specific books to students
   - Monitor student progress and activities
   - Provide learning encouragement and support
   - Submit publishing requests

3. **INSTITUTION** - `/dashboard/institution`
   - Manage multiple teachers within the institution
   - View institution-wide analytics and reports
   - Assign books at institution level to all classes
   - Monitor aggregate student performance across institution
   - Create and manage institution-level curricula
   - Oversee teacher activities and class management

4. **WRITER** - `/dashboard/writer`
   - Submit stories for publishing via rich text editor
   - Track contribution impact and published stories
   - Collaborate on content creation
   - No PDF upload requirement (AI generates images for text-only stories)

### Content Management Roles
5. **STORY_MANAGER** - `/dashboard/story-manager`
   - Review submitted stories in queue
   - Provide feedback to authors
   - Request revisions or edit directly
   - Approve stories for next stage

6. **BOOK_MANAGER** - `/dashboard/book-manager`
   - Decide publication format (book vs text)
   - Manage publication pipeline
   - Coordinate with Story Managers

7. **CONTENT_ADMIN** - `/dashboard/content-admin`
   - Final approval for publishing
   - Set content policies
   - Manage published library

### System Role
8. **ADMIN** - `/admin`
   - Full system administration
   - User management
   - System configuration
   - All permissions

## Publishing Workflow Pipeline

### Content Submission Flow
1. **Submission** - User (Student/Teacher/Writer) submits content
2. **Story Review** - STORY_MANAGER reviews and provides feedback
3. **Revision** - Author revises based on feedback (iterative)
4. **Story Approval** - STORY_MANAGER approves for next stage
5. **Format Decision** - BOOK_MANAGER decides book vs text format
6. **Final Approval** - CONTENT_ADMIN gives final approval
7. **Publication** - Content published to library
8. **Distribution** - Teachers assign to students via class

### AI Enhancement for Text-Only Stories
- Automatic image generation using GPT
- TTS audio generation (with error handling)
- Content difficulty analysis
- Vocabulary extraction

## Student Learning Features

### Progressive Content Access
- Students see only teacher-assigned books
- No access to full library without teacher approval
- Proficiency-based content filtering

### Reading Enhancement Tools
1. **Content Parsing** - Adjust text complexity by proficiency level
2. **Vocabulary Support** - Click/hover for word explanations
3. **AI Chatbot** - Upstage-powered Q&A about content
4. **Discussion Features** - Questions and answers about texts
5. **Book Club** - Collaborative reading and discussion

### Teacher-Student Matching
- 6-character class codes for easy joining
- Teachers create classes with unique codes
- Students join using teacher-provided codes
- Admins can monitor all class relationships

## Database Schema (Extended)

### Core Tables
- `User` - Authentication and profiles with role enum
- `Book` - Digital books with PDF/TXT/MD content
- `Order` - Subscriptions and purchases
- `Donation` - Seeds of Empowerment
- `Session` - NextAuth sessions
- `Review` - Book reviews and ratings

### New Educational Tables
- `Class` - Teacher's classes with join codes
- `ClassEnrollment` - Student-teacher relationships
- `BookAssignment` - Teacher assigns books to class/student
- `ReadingProgress` - Track student reading progress
- `VocabularyBank` - Difficult words per book/student
- `Discussion` - Book discussions and Q&A threads
- `BookClub` - Group reading sessions

### Publishing Tables
- `Submission` - Content submissions with status
- `SubmissionFeedback` - Review feedback history
- `ApprovalWorkflow` - Multi-stage approval tracking
- `AIGeneratedContent` - Images and audio from AI

## PDF.js Version Management (Critical)

### Problem Solved (2025-09-07)
- **Issue**: PDF.js version conflicts between `pdfjs-dist` (5.4.54) and `react-pdf` bundled version (4.8.69)
- **Symptoms**: 
  - "API version does not match Worker version" errors
  - "Cannot use the same canvas during multiple render() operations" 
  - "Invalid or unexpected token" in worker file

### Solution Applied
1. **Remove duplicate pdfjs-dist**: `npm uninstall pdfjs-dist --legacy-peer-deps`
2. **Use react-pdf's bundled version**: All imports from `react-pdf/node_modules/pdfjs-dist`
3. **Standardize worker file**: Use `/pdf.worker.min.mjs` everywhere
4. **Fix canvas conflicts**: Add render task cancellation in EnhancedPDFViewer
5. **Remove unused components**: Deleted PDFReaderWithThumbnails (627 lines of unused code)

### PDF Component Architecture
Keep these components:
- `SafePDFViewer` - Main production viewer with SSR safety
- `PDFViewer` - Simple demo viewer
- `SimplePDFThumbnail` - Basic thumbnails using react-pdf
- `EnhancedPDFThumbnail` - Advanced thumbnails with access control
- `EnhancedPDFViewer` - Feature-rich viewer (wrapped by SafePDFViewer)

### Worker Configuration
```javascript
// Correct configuration (use in all PDF components)
import { GlobalWorkerOptions } from 'react-pdf/node_modules/pdfjs-dist';
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
```

## Important Reminders

1. **Always run lint before committing**
2. **Test authentication flow after changes**
3. **Update Playwright tests for UI changes**
4. **Don't add comments unless requested**
5. **Keep demo mode functional**
6. **Verify mobile responsiveness**
7. **Check Docker build before deploying**
8. **Never install pdfjs-dist directly - use react-pdf's bundled version**
9. **TTS Implementation** - If TTS generation fails, display error message only. NEVER use browser audio callbacks
10. **Docker Priority** - All development should be Docker-first, test locally in Docker environment
11. **PDF Location** - PDFs are stored in `/public/books/` directory
12. **Role Testing** - Always test with multiple roles when implementing features

## Critical Data Management Warning (2025-09-08)

**⚠️ NEVER replace dummy data without careful consideration**

When working with books and PDFs:
1. **Always backup existing data first** - Use database dumps or export scripts
2. **Test data changes in isolated environment** - Don't directly modify production-like data
3. **Preserve PDF functionality** - Ensure PDF reading, parsing, and thumbnail generation remain functional
4. **Use upsert instead of delete/create** - Prevents loss of existing relationships and references
5. **Run seed scripts carefully** - Different seed scripts serve different purposes:
   - `seed-sample-books.ts` - For demo/test data with working PDF samples
   - `seed-real-books.ts` - For selected real PDFs from public/books
   - `seed-all-books.ts` - For complete real PDF collection (31 books)
   - `update-real-books.ts` - For updating existing books with real PDF paths (use upsert)

**Recent incident**: Replacing dummy data with real PDFs broke PDF reading and parsing functionality. Always test thoroughly after data changes.

## ⚠️ CRITICAL DEPLOYMENT FAILURE PATTERNS (2025-11-11)

**🔴 MANDATORY READING: These are ACTUAL failures that occurred and MUST be prevented.**

### The Git Pull Deployment Failure (2025-11-11)

**What Happened**: Complete deployment failure where NO code changes were reflected in production, despite successful Docker image deployment.

**Root Causes**:
1. ❌ **deploy.sh was missing git pull step** - Server source code NEVER updated
2. ❌ **No pre-deployment git state validation** - Allowed deploying wrong code
3. ❌ **No post-deployment completeness check** - Didn't catch git mismatch
4. ❌ **Overly strict error handling** - Script died prematurely on warnings

**Symptoms**:
- Docker containers running and healthy ✅
- Build timestamp updated ✅
- **BUT**: Server git at old commit (f733c68) ❌
- **BUT**: New features not accessible (profile pages missing) ❌
- **BUT**: Wrong code deployed ❌

**Impact**: User correctly reported "수정사항이 전혀 반영되지 않았습니다" (NO changes reflected)

**The Fix** (Now implemented in deploy.sh):

```bash
# CRITICAL: Must pull git BEFORE loading Docker image
echo "🔴 CRITICAL: Updating source code from git repository..."
git fetch origin main
git reset --hard origin/main

# Then proceed with Docker operations
docker system prune -af --volumes  # Cache clean
gunzip -c /tmp/app-image.tar.gz | docker load  # Image load
docker compose up -d  # Start containers
```

### MANDATORY Pre-Deployment Checklist

**Before running `./scripts/deploy.sh deploy`, you MUST verify:**

1. ✅ **Git Status Clean**
   ```bash
   git status
   # Should show: "nothing to commit, working tree clean"
   ```

2. ✅ **All Commits Pushed**
   ```bash
   git log origin/main..HEAD
   # Should show: nothing (no unpushed commits)
   ```

3. ✅ **Local Build Successful**
   ```bash
   docker compose build app
   # OR
   npm run build
   ```

4. ✅ **Docker Daemon Running**
   ```bash
   docker info
   # Should not error
   ```

**If ANY check fails**: Fix it BEFORE deploying. The deploy script now enforces these checks automatically.

### FORBIDDEN Deployment Anti-Patterns

❌ **NEVER deploy with uncommitted changes**
   - deploy.sh now BLOCKS this
   - Error message: "DEPLOYMENT BLOCKED: Uncommitted changes detected!"

❌ **NEVER deploy with unpushed commits**
   - deploy.sh now BLOCKS this
   - Error message: "DEPLOYMENT BLOCKED: Unpushed commits detected!"

❌ **NEVER skip local Docker build**
   - deploy.sh now BLOCKS this
   - Error message: "DEPLOYMENT BLOCKED: No local build found!"

❌ **NEVER assume containers running = deployment succeeded**
   - deploy.sh now validates git commit match
   - deploy.sh now validates build timestamp match
   - deploy.sh now validates critical files exist

### Deployment Script Improvements (2025-11-11)

**New deploy.sh workflow**:
```
Step 0: Pre-deployment validation (NEW)
  ↓ Check: Git uncommitted changes
  ↓ Check: Git unpushed commits
  ↓ Check: Local build exists
  ↓ Check: Docker daemon running

Step 1: Local Docker build
  ↓ Build with error messages

Step 2: Save image to tar.gz
  ↓ With disk space checks

Step 3: Upload to server
  ↓ With retry logic

Step 4: Server deployment (COMPLETELY REWRITTEN)
  ↓ 🔴 Git pull (NEW - was missing!)
  ↓ Docker cache clean (mandatory)
  ↓ nginx cache clean (NEW)
  ↓ Backup current image
  ↓ Load new image (improved error handling)
  ↓ Verify image loaded correctly (NEW)
  ↓ Start containers
  ↓ Verify containers started (NEW)
  ↓ Reload nginx config (NEW)

Step 5: Deployment verification (ENHANCED)
  ↓ Health check (containers, HTTPS)
  ↓ Completeness check (NEW):
     - Git commit match (local vs server)
     - Build timestamp match
     - Critical files exist
```

### Error Messages to Watch For

**If you see these, deployment is BLOCKED (intentionally)**:
```
DEPLOYMENT BLOCKED: Uncommitted changes detected!
DEPLOYMENT BLOCKED: Unpushed commits detected!
DEPLOYMENT BLOCKED: No local build found!
DEPLOYMENT BLOCKED: Docker not running!
```

**If you see these, deployment FAILED (investigate)**:
```
DEPLOYMENT INCOMPLETE: Git commit mismatch!
ERROR: Image load completed but 1001-stories-app:latest not found!
ERROR: Required containers not running: [list]
```

### Recovery from Failed Deployment

The deploy script now has **automatic rollback**:
1. Detects deployment failure
2. Finds most recent backup image
3. Restores backup as latest
4. Restarts app container
5. Verifies HTTPS returns 200

**Manual recovery** (if automatic rollback fails):
```bash
# 1. Check container status
ssh ubuntu@3.128.143.122 "docker ps -a"

# 2. Check git state
ssh ubuntu@3.128.143.122 "cd /home/ubuntu/1001-stories && git status && git log -1"

# 3. Manually restore backup
ssh ubuntu@3.128.143.122 "cd /home/ubuntu/1001-stories && docker images | grep backup"
ssh ubuntu@3.128.143.122 "cd /home/ubuntu/1001-stories && docker tag 1001-stories-app:backup-XXXXX 1001-stories-app:latest"
ssh ubuntu@3.128.143.122 "cd /home/ubuntu/1001-stories && docker compose up -d"

# 4. Verify recovery
curl https://1001stories.seedsofempowerment.org/api/health
```

### Why This Matters

**User's Exact Words**: "디플로이에 실패했습니다. 수정사항이 전혀 반영되지 않았습니다."
Translation: "Deployment failed. NO changes were reflected at all."

**User was 100% correct**. The deployment technically succeeded (containers running) but deployed the WRONG code (old git commit).

### Key Lessons Learned

1. **Container Status ≠ Correct Deployment**
   - Containers can be healthy but running old code
   - MUST verify git commits match (local vs server)

2. **Docker Image ≠ Source Code**
   - Docker image can be new but filesystem has old code
   - MUST git pull on server BEFORE loading image

3. **Build Timestamp ≠ Deployment Success**
   - Timestamp can update but features still missing
   - MUST verify critical files exist

4. **Automated Checks > Manual Verification**
   - Humans forget steps (proven by this incident)
   - Scripts enforce mandatory procedures

## CRITICAL MISTAKES TO AVOID (2025-09-19)

**⚠️ These mistakes have been repeatedly made. Each repetition wastes significant time and damages the project.**

### 1. Infrastructure Mistakes (STOP REPEATING)
- **nginx Configuration**: Always uncomment HTTPS server blocks, check SSL paths
- **Redis Service**: Ensure Redis is included in docker-compose.yml with proper password
- **SSL/HTTPS**: Use Let's Encrypt certificates, verify certificate paths exist
- **SMTP Settings**: Use app-specific passwords for Gmail, not regular passwords
- **Environment Variables**: Use relative paths in docker-compose, absolute paths in code
- **Docker Version**: NEVER specify version: "3.9" in docker-compose.yml (use v2 syntax)

### 2. Server Deployment Lies (CRITICAL)
- **NEVER claim server is running without testing**
- **ALWAYS test with `curl` commands and check actual responses**
- **Container status != working application**
- **Use new workflow: Local Docker → Build Success → Git → Server**

### 3. File Path Confusion (REPEATED ERROR)
- **Correct Path**: `/Users/jihunkong/1001project/1001-stories/`
- **Wrong Path**: `/Users/jihunkong/1001project/1001-stories/1001project/` (NEVER USE)
- **Server Symlink**: `/opt/1001-stories` → `/home/ubuntu/1001project`
- **Always verify paths before claiming files don't exist**

### 4. Publishing Workflow Issues
- **WRITER SUBMISSIONS**: PDF upload must NOT be required
- **Text Editor Only**: Writers should submit via rich text editor
- **PDF Generation**: AI should generate images for text-only stories
- **Never add PDF upload requirement to writer forms**

### 5. File Management Chaos
- **Stop creating duplicate docker-compose files** (test.yml, test-edu.yml, etc.)
- **Stop creating duplicate documentation** (PRD.md, PRD copy.md, etc.)
- **Archive old files instead of duplicating**
- **Use single source of truth for configurations**

### 6. Agent and Tool Usage
- **Always use appropriate agents for tasks** (serena mcp, etc.)
- **Use docker-playwright-tester for containerized testing**
- **Use security-auditor for security reviews**
- **Don't ignore available tools and agents**

### 7. Docker Compose Partial Service Restart (CRITICAL)

**⚠️ ALL Containers Down - Complete Server Failure (2025-11-04)**

**Most Recent Incident (2025-11-04 - SSR Language Deployment)**:
- **Problem**: After deploying SSR language changes, server was completely inaccessible
- **Discovery**: ALL Docker containers were DOWN (not a single container running)
- **Root Cause**: Previous deployment operations likely ran `docker compose down` but never completed `docker compose up -d`
- **Impact**: Complete service outage - HTTPS returned SSL_ERROR_SYSCALL

**Symptoms**:
```bash
# Server shows NO containers running
ssh ubuntu@3.128.143.122 "docker ps"
# CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
# (empty - no containers running at all)

# HTTPS health check fails completely
curl https://1001stories.seedsofempowerment.org/api/health
# curl: (35) error:02FFF036:system library:func(4095):Connection reset by peer
```

**Solution Applied**:
```bash
# Simply start all services
cd /home/ubuntu/1001-stories
docker compose up -d

# Verify all 7 containers started
docker ps
# Should show: nginx, app, postgres, redis, certbot, prometheus, node-exporter (7 containers)

# Test HTTPS endpoint
curl https://1001stories.seedsofempowerment.org/api/health
# Should return: 200
```

**Prevention Implemented (2025-11-04)**:
1. **Enhanced deploy.sh with verification**:
   - Added `verify_deployment()` function
   - Checks all required containers are running
   - Specifically verifies nginx (critical for HTTPS)
   - Tests HTTPS endpoint for 200 response
   - Automatic rollback on verification failure

2. **Mandatory verification checklist**:
   - ✅ Container status: All 5 required containers running
   - ✅ nginx check: CRITICAL for HTTPS access
   - ✅ No unhealthy/exited containers
   - ✅ HTTPS endpoint test: Must return 200

**⚠️ nginx 컨테이너 미실행 문제 - 반복적으로 발생 (2025-10-31)**

**문제**:
- 배포 시 `docker compose up -d --force-recreate app` 사용
- app 서비스만 재시작되어 nginx, certbot, prometheus, node-exporter가 시작되지 않음
- HTTPS 접속 불가 (curl 응답: 000)
- App 컨테이너는 정상이지만 외부 접속 차단됨

**증상**:
```bash
# 컨테이너 확인 시 nginx가 없음
docker ps
# Only shows: app, postgres, redis
# Missing: nginx, certbot, prometheus, node-exporter
```

**근본 원인**:
특정 서비스만 지정하면 다른 서비스는 시작되지 않음

**해결 방법**:
```bash
# ❌ 잘못된 방법
docker compose up -d --force-recreate app

# ✅ 올바른 방법 - 모든 서비스 시작
docker compose up -d

# 또는 특정 서비스만 재빌드하고 모든 서비스 시작
docker compose build app
docker compose up -d
```

**MANDATORY Deployment Verification (Updated 2025-11-04)**:
```bash
# Improved deploy.sh now automatically performs these checks:

# 1. Container Status Check
# - Verifies nginx, app, postgres, redis, certbot are all running
# - Fails if any required container is missing

# 2. nginx Verification (CRITICAL)
# - Specifically checks nginx container is running
# - HTTPS will not work without nginx

# 3. Unhealthy Container Detection
# - Checks for any unhealthy or exited containers

# 4. HTTPS Endpoint Test
# - Tests https://localhost/api/health
# - Must return 200 status code

# 5. Automatic Rollback
# - If any check fails, initiates automatic rollback
# - Prevents broken deployments from staying live
```

**Manual Verification Commands** (if needed):
```bash
# 1. 모든 컨테이너 상태 확인
docker ps --format 'table {{.Names}}\t{{.Status}}'

# 2. nginx 포함 여부 확인
docker ps | grep nginx

# 3. HTTPS 접속 테스트
curl -s -o /dev/null -w "%{http_code}" https://1001stories.seedsofempowerment.org/api/health
# 200 응답 확인

# 4. 필요시 전체 서비스 재시작
docker compose up -d
```

**Key Lessons Learned**:
1. **NEVER assume containers are running** - Always verify after deployment
2. **nginx is CRITICAL** - Service is inaccessible without it
3. **Automated verification is essential** - Manual checks are error-prone
4. **Rollback capability required** - Must be able to recover quickly
5. **Complete outages possible** - Not just partial service failures

### Accountability Warning
- **Repeated mistakes are not accidents - they indicate systematic problems**
- **Each mistake costs significant time and delays the project**
- **Follow the documented processes and learn from previous failures**
- **Use Local Docker → Build Success → Git → Server workflow ALWAYS**

## SSL Certificate Setup (CRITICAL - 2025-11-04)

**⚠️ SSL Restoration Procedures - Documented from Production Incident**

### Initial SSL Certificate Generation

If SSL certificates are missing or need regeneration, use:

```bash
# Method 1: Automated script (Recommended)
./scripts/setup-ssl.sh

# Method 2: Manual generation
docker compose run --rm --entrypoint /bin/sh certbot -c "certbot certonly \
  --webroot -w /var/www/certbot \
  -d 1001stories.seedsofempowerment.org \
  --email noreply@1001stories.org \
  --agree-tos --non-interactive"

# Restart services to apply certificates
docker compose restart nginx
docker compose up -d --force-recreate certbot
```

### Improved docker-compose.yml Certbot Service

**Problem Solved (2025-11-04)**:
- Original certbot entrypoint was infinite renewal loop
- Caused `docker compose run certbot [command]` to hang indefinitely
- Made initial certificate generation impossible

**Solution Applied**:
Modified certbot service entrypoint to check for existing certificates before starting renewal daemon:

```yaml
certbot:
  entrypoint: |
    /bin/sh -c '
      # Check if SSL certificates exist
      if [ ! -d "/etc/letsencrypt/live/1001stories.seedsofempowerment.org" ]; then
        echo "⚠️  No SSL certificates found!"
        echo "Please run initial certificate generation first."
        exit 1
      fi

      echo "✅ SSL certificates found. Starting renewal daemon..."
      trap exit TERM
      while :; do
        certbot renew --webroot -w /var/www/certbot --quiet
        sleep 12h & wait ${!}
      done
    '
```

### SSL Certificate Verification

```bash
# Test HTTPS endpoint
curl -s -o /dev/null -w "%{http_code}" https://1001stories.seedsofempowerment.org/api/health
# Should return: 200

# Check certificate expiry
openssl x509 -enddate -noout -in certbot/conf/live/1001stories.seedsofempowerment.org/cert.pem
# Example: notAfter=Feb  2 03:15:33 2026 GMT

# View certbot logs
docker compose logs certbot --tail=30
# Should show: "✅ SSL certificates found. Starting renewal daemon..."
```

### Troubleshooting SSL Issues

**Issue**: HTTPS not working / nginx crash loop
```bash
# 1. Check certificate files exist
ls -la certbot/conf/live/1001stories.seedsofempowerment.org/
# Should have: fullchain.pem, privkey.pem, cert.pem, chain.pem

# 2. Verify nginx config
docker exec 1001-stories-nginx nginx -t
# Should show: "syntax is ok" and "test is successful"

# 3. Check nginx logs
docker compose logs nginx --tail=50
```

**Issue**: Certbot renewal failing
```bash
# Check certbot can reach Let's Encrypt
docker exec 1001-stories-certbot wget -O- https://acme-v02.api.letsencrypt.org/directory
# Should return JSON response

# Verify ACME challenge path accessible
curl http://1001stories.seedsofempowerment.org/.well-known/acme-challenge/test
# nginx should serve this path
```

**Issue**: Deploy script deleted SSL certificates
- **Root Cause**: `rsync --delete` removed certbot directory not in git
- **Prevention**: Deploy script updated with `--exclude=certbot` and `--exclude=public/generated-images`
- **Recovery**: Run `./scripts/setup-ssl.sh` to regenerate certificates

### Certificate Auto-Renewal

- Certificates valid for 90 days
- Auto-renewal runs every 12 hours (certbot container)
- Renewal triggers when <30 days remaining
- No manual intervention required for renewals

## Support & Resources

- **GitHub Issues**: Report bugs and features
- **Deployment Logs**: `./scripts/deploy.sh logs`
- **Database GUI**: `npx prisma studio`
- **Local Testing**: `./scripts/test-docker-local.sh`
- **SSL Setup**: `./scripts/setup-ssl.sh`
- 항상 적절한 agent, mcp를 불러와서 사용하세요.
- ultra think를 하세요
- ultra think, 적절한 agent를 배치하세요. mcp에서 최신 코드들을 확인하세요.
3.128.143.122
  /Users/jihunkong/Downloads/1001project.pem
https://1001stories.seedsofempowerment.org