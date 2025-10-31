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

# Deploy to AWS Lightsail
./scripts/deploy.sh deploy

# Check deployment logs
./scripts/deploy.sh logs

# Rollback if needed
./scripts/deploy.sh rollback
```

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
- **Platform**: AWS Lightsail
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

### 7. Docker Compose Partial Service Restart (CRITICAL - 2025-10-31)

**⚠️ nginx 컨테이너 미실행 문제 - 반복적으로 발생**

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

**배포 체크리스트**:
1. 배포 후 반드시 모든 컨테이너 확인
2. nginx 컨테이너 실행 여부 확인
3. HTTPS 접속 테스트 (200 응답 확인)
4. 서비스 명시 시 주의 - 가급적 서비스명 생략

**검증 명령어**:
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

### Accountability Warning
- **Repeated mistakes are not accidents - they indicate systematic problems**
- **Each mistake costs significant time and delays the project**
- **Follow the documented processes and learn from previous failures**
- **Use Local Docker → Build Success → Git → Server workflow ALWAYS**

## Support & Resources

- **GitHub Issues**: Report bugs and features
- **Deployment Logs**: `./scripts/deploy.sh logs`
- **Database GUI**: `npx prisma studio`
- **Local Testing**: `./scripts/test-docker-local.sh`
- 항상 적절한 agent, mcp를 불러와서 사용하세요.
- ultra think를 하세요
- ultra think, 적절한 agent를 배치하세요. mcp에서 최신 코드들을 확인하세요.
3.128.143.122
  /Users/jihunkong/Downloads/1001project.pem
https://1001stories.seedsofempowerment.org