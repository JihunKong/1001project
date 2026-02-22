# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**1001 Stories** is a non-profit global education platform that discovers, publishes, and shares stories from children in underserved communities. All revenue is reinvested through the Seeds of Empowerment program.

## Current Architecture (Production)

### Technology Stack
- **Frontend:** Next.js 15.4.6 with React 19, TailwindCSS
- **Backend:** Next.js API Routes with NextAuth.js
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** GCP Compute Engine + Docker Compose (nginx, PostgreSQL, Redis)
- **Authentication:** NextAuth.js with email magic links
- **AI Integration:**
  - OpenAI GPT - Image generation for text-only stories, TTS functionality, AI Review

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

## Internationalization (i18n) System

### Overview

The platform supports 12 languages with a custom i18n implementation using React hooks and JSON translation files.

**Supported Languages:**
- English (en) - Primary
- Korean (ko)
- Spanish (es)
- Arabic (ar)
- Hindi (hi)
- French (fr)
- German (de)
- Japanese (ja)
- Portuguese (pt)
- Russian (ru)
- Italian (it)
- Chinese (zh)

**⚠️ IMPORTANT Language Priority (2025-11-25):**
- **English is the PRIMARY language** - All UI text should be designed in English first
- **Initial Release:** Only English (en) and Korean (ko) are actively used
- **Translation Source:** English (`en.json`) is the source of truth for all translations
- **Landing Page Text:** Must match the Figma design - do NOT change during i18n conversion
- When adding new translations, always update `en.json` first, then translate to other languages

### Directory Structure

```
/locales/generated/
├── en.json           # English (source of truth)
├── ko.json           # Korean
├── es.json           # Spanish
├── ar.json           # Arabic (RTL)
├── hi.json           # Hindi
├── fr.json           # French
├── de.json           # German
├── ja.json           # Japanese
├── pt.json           # Portuguese
├── ru.json           # Russian
├── it.json           # Italian
└── zh.json           # Chinese

/docs/
└── i18n-tracking.csv  # Translation gap tracking (143 entries)

/lib/i18n/
├── config.ts          # Language configuration
├── useTranslation.ts  # Translation hook
└── ...                # Other i18n utilities
```

### Translation Key Conventions

Translation keys follow a hierarchical structure using dot notation:

```typescript
// Pattern: page.section.element.property
{
  "about": {
    "header": {
      "title": "About Us",
      "subtitle": "Our Mission"
    },
    "section1": {
      "title": "Who We Are",
      "content": "Description text..."
    }
  }
}
```

**Key Naming Rules:**
1. Use lowercase with camelCase for multi-word names
2. Group related keys under common parent
3. Use descriptive names (e.g., `createAccount.question` not `faq1`)
4. Keep nesting to 3-4 levels maximum
5. Use consistent naming across similar sections

### Component Conversion Workflow

**Converting Server Components to Client Components:**

```typescript
// BEFORE (Server Component)
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description'
};

export default function Page() {
  return <h1>Hardcoded Text</h1>;
}

// AFTER (Client Component)
'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Page() {
  const { t } = useTranslation();
  return <h1>{t('page.header.title')}</h1>;
}
```

**Step-by-Step Conversion Process:**

1. **Remove Metadata Export**
   - Delete `import { Metadata }` statement
   - Remove `export const metadata` block

2. **Add Client Directive**
   - Add `'use client';` as first line
   - Import useTranslation hook

3. **Initialize Translation Function**
   ```typescript
   const { t } = useTranslation();
   ```

4. **Replace Hardcoded Strings**
   ```typescript
   // Before
   <h1>About Us</h1>

   // After
   <h1>{t('about.header.title')}</h1>
   ```

5. **Handle Placeholders**
   ```typescript
   // Before
   <input placeholder="Search for help..." />

   // After
   <input placeholder={t('help.search.placeholder')} />
   ```

### Adding New Translations

**Workflow for New Features:**

1. **Update CSV Tracking**
   ```csv
   Page,Section,Key,English,Korean,Status,Priority,Location,Line
   NewPage,Header,newPage.header.title,Page Title,페이지 제목,TODO,HIGH,/app/new/page.tsx,20
   ```

2. **Add Keys to en.json**
   ```json
   "newPage": {
     "header": {
       "title": "Page Title",
       "subtitle": "Page subtitle"
     }
   }
   ```

3. **Copy Structure to All Languages**
   ```bash
   # Add same structure to ko.json, es.json, ar.json, etc.
   # Use English as temporary placeholder for professional translation
   ```

4. **Convert Component**
   - Follow Component Conversion Workflow above
   - Verify all strings are wrapped in t() calls

5. **Verify Build**
   ```bash
   npm run build
   # Should compile successfully with no errors
   ```

### CSV Tracking System

The `/docs/i18n-tracking.csv` file tracks all 143 translation entries across 5 public pages:

**Format:**
```csv
Page,Section,Key,English,Korean,Status,Priority,Location,Line
About,Header,about.header.title,About 1001 Stories,1001 이야기 소개,DONE,HIGH,/app/about/page.tsx,22
```

**Status Values:**
- `DONE` - Translated in all 12 languages
- `TODO` - Not yet implemented
- `PARTIAL` - Some languages missing

**Priority Levels:**
- `HIGH` - Essential UI elements (titles, buttons, navigation)
- `MEDIUM` - Important content (descriptions, labels)
- `LOW` - Optional content (placeholders, examples)

**Usage:**
- Track translation gaps systematically
- Plan refactoring phases for large updates
- Coordinate with translation team

### Testing and Verification

**Pre-Deployment Checklist:**

1. **Build Verification**
   ```bash
   npm run build
   # Should show: ✓ Compiled successfully
   # Should generate 74+ routes
   ```

2. **Count Translation Calls**
   ```bash
   # Verify t() count matches CSV requirements
   grep -o "t('" /app/page/path.tsx | wc -l
   ```

3. **Check Translation Keys**
   ```bash
   # Verify all keys exist in en.json
   grep "page.section.key" /locales/generated/en.json
   ```

4. **Test Language Switching**
   - Test all 12 language options
   - Verify text updates immediately
   - Check RTL layout for Arabic (ar)

5. **Verify No Missing Keys**
   ```bash
   # No console errors like "Missing translation key"
   npm run dev
   # Visit all translated pages
   ```

### Common Patterns

**Navigation Items:**
```typescript
<Link href="/about">{t('nav.about')}</Link>
<Link href="/contact">{t('nav.contact')}</Link>
```

**Form Elements:**
```typescript
<input
  placeholder={t('form.email.placeholder')}
  aria-label={t('form.email.label')}
/>
<button>{t('form.submit.button')}</button>
```

**Conditional Content:**
```typescript
{isLoggedIn ? t('dashboard.welcome') : t('landing.cta')}
```

**Lists and Arrays:**
```typescript
<ul>
  <li>{t('features.item1')}</li>
  <li>{t('features.item2')}</li>
  <li>{t('features.item3')}</li>
</ul>
```

### Completed Pages (2025-11-13)

All 5 public pages fully internationalized:

| Page    | Translation Keys | t() Calls | Status |
|---------|-----------------|-----------|--------|
| About   | 46             | 46        | ✅     |
| Contact | 36             | 36        | ✅     |
| Privacy | 22             | 22        | ✅     |
| Terms   | 29             | 29        | ✅     |
| Help    | 26             | 26        | ✅     |
| **Total** | **159**      | **159**   | **✅** |

**Build Status:** ✅ 76 routes generated successfully

### Best Practices

1. **ALWAYS use t() for user-facing text**
   - No hardcoded English strings in components
   - Exception: Developer-facing code comments

2. **Maintain consistent key structure**
   - Follow established patterns from existing pages
   - Group related translations logically

3. **Test with multiple languages**
   - English + Korean minimum
   - Arabic for RTL layout testing
   - Check for text overflow issues

4. **Update CSV when adding translations**
   - Keep tracking system current
   - Coordinate with translation team

5. **Verify build after i18n changes**
   - Run `npm run build` before committing
   - Check for TypeScript errors
   - Test affected pages

## Development Workflow

**⚠️ CRITICAL WORKFLOW - MANDATORY**

**Local Build → Git Push → Server Deploy**

Never deploy without first confirming local Docker build success.

### Mandatory Development Process
```bash
# 1. FIRST: Test locally
npm run lint
npm run build

# 2. ONLY AFTER SUCCESS: Git operations
git add .
git commit -m "Description"
git push

# 3. ONLY AFTER GIT SUCCESS: Server deployment
ssh -i ~/.ssh/google_compute_engine jihunkong_pknic_club@34.121.45.14
cd /home/jihunkong_pknic_club/1001-stories
git pull && docker compose up -d --build
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

# Deploy to GCE (SSH into server)
ssh -i ~/.ssh/google_compute_engine jihunkong_pknic_club@34.121.45.14
cd /home/jihunkong_pknic_club/1001-stories
git pull && docker compose up -d --build

# Check deployment
docker compose ps
curl https://1001stories.seedsofempowerment.org/api/health

# View logs
docker compose logs app --tail=50

# Rollback (revert git and rebuild)
git log --oneline -5
git revert <commit>
docker compose up -d --build
```

## GCE Docker Compose Deployment (2026-02-22)

### Architecture

- **Platform**: GCP Compute Engine (Docker Compose)
- **Instance**: the1001stories (e2-medium, 4GB RAM, us-central1-c)
- **External IP**: 34.121.45.14
- **Database**: PostgreSQL (Docker container)
- **Cache**: Redis (Docker container)
- **Reverse Proxy**: nginx (Docker container)
- **SSL**: Let's Encrypt (certbot container, auto-renewal)
- **Monitoring**: Prometheus + Node Exporter (Docker containers)

### GCP Configuration

| Resource | Value |
|----------|-------|
| Project | smile-the-ultimate |
| Instance | the1001stories |
| Zone | us-central1-c |
| Machine Type | e2-medium (4GB RAM) |
| External IP | 34.121.45.14 (static) |
| Domain | 1001stories.seedsofempowerment.org |
| gcloud Account | jihunkong@pknic.club |

### SSH Access

```bash
# Direct SSH
ssh -i ~/.ssh/google_compute_engine jihunkong_pknic_club@34.121.45.14

# Or via gcloud (ensure correct account is active)
gcloud config set account jihunkong@pknic.club
gcloud compute ssh the1001stories --project=smile-the-ultimate --zone=us-central1-c
```

### Docker Containers (7)

| Container | Purpose | Health Check |
|-----------|---------|-------------|
| app | Next.js application | Port 3000 |
| postgres | PostgreSQL database | Port 5432 |
| redis | Session/cache store | Port 6379 |
| nginx | Reverse proxy + SSL | Port 80/443 |
| certbot | SSL certificate renewal | - |
| prometheus | Metrics collection | Port 9090 |
| node-exporter | System metrics | Port 9100 |

### Server File Structure

```
/home/jihunkong_pknic_club/1001-stories/
├── docker-compose.yml      # Container orchestration
├── nginx-current.conf      # Active nginx config (symlink to ssl or http)
├── nginx/
│   ├── nginx-ssl.conf      # HTTPS config (production)
│   └── nginx-http.conf     # HTTP-only config (for initial setup)
├── certbot/
│   ├── conf/               # Let's Encrypt certificates
│   ├── www/                # ACME challenge files
│   └── logs/               # Certbot logs
├── .env.production         # Environment variables (on server only)
└── ...                     # Application source code
```

### Common Server Commands

```bash
# Check all containers
docker compose ps

# View app logs
docker compose logs app --tail=50 -f

# Restart a specific service
docker compose restart nginx

# Full rebuild (after code changes)
git pull && docker compose up -d --build

# Database backup
docker exec 1001-stories-postgres pg_dump -U stories_user -d stories_db -Fc > backup.dump

# Database restore
cat backup.dump | docker exec -i 1001-stories-postgres pg_restore -U stories_user -d stories_db --clean --if-exists

# Disk space management (30GB disk - watch usage!)
df -h
docker system prune -af  # WARNING: removes all unused images/containers
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
OPENAI_API_KEY="your-openai-api-key"  # For GPT image generation, TTS, AI Review

# Feature Flags
ENABLE_AI_IMAGES="true"
ENABLE_TTS="true"
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

# Docker (local)
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs app  # View logs

# Deployment (GCE server)
ssh -i ~/.ssh/google_compute_engine jihunkong_pknic_club@34.121.45.14
cd /home/jihunkong_pknic_club/1001-stories
git pull && docker compose up -d --build   # Deploy
docker compose ps                          # Check status
docker compose logs app --tail=50          # View logs
```

## Important Files

- `middleware.ts` - Authentication and routing logic
- `lib/auth.ts` - NextAuth configuration
- `prisma/schema.prisma` - Database schema
- `docker-compose.yml` - Production container orchestration
- `Dockerfile` - Multi-stage production build
- `nginx-current.conf` - Active nginx config (on server, not in git)
- `nginx/nginx-ssl.conf` - HTTPS nginx config template
- `nginx/nginx-http.conf` - HTTP-only nginx config template
- `.env.production` - Production env vars (on server only, not in git)
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

- **Platform**: GCP Compute Engine (Docker Compose)
- **Project**: smile-the-ultimate
- **Instance**: the1001stories (e2-medium, us-central1-c)
- **External IP**: 34.121.45.14
- **Domain**: https://1001stories.seedsofempowerment.org
- **SSH**: `ssh -i ~/.ssh/google_compute_engine jihunkong_pknic_club@34.121.45.14`
- **Database**: PostgreSQL (Docker container, port 5432)
- **SSL**: Let's Encrypt via certbot (auto-renewal, expires May 2026)
- **Containers**: 7 (app, postgres, redis, nginx, certbot, prometheus, node-exporter)

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
3. **AI Chatbot** - AI-powered Q&A about content
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

## Deployment Best Practices

### Pre-Deployment Checklist

1. `npm run lint` passes locally
2. `npm run build` succeeds locally
3. Git status clean, all changes pushed
4. SSH access to server verified

### Rollback

```bash
# SSH into server
ssh -i ~/.ssh/google_compute_engine jihunkong_pknic_club@34.121.45.14
cd /home/jihunkong_pknic_club/1001-stories

# Check recent commits
git log --oneline -5

# Revert to previous commit
git revert <commit-hash>
docker compose up -d --build
```

### Recovery from Failed Deployment

```bash
# Check container status
docker compose ps

# View app logs
docker compose logs app --tail=100

# If app won't start, check disk space
df -h

# If disk full, prune Docker (WARNING: removes all unused data)
docker compose down
docker system prune -af
docker compose up -d --build

# If VM network is down (can't SSH), reset via gcloud
gcloud config set account jihunkong@pknic.club
gcloud compute instances reset the1001stories --project=smile-the-ultimate --zone=us-central1-c
```

### Important Deployment Notes

- **nginx-current.conf**: This is the ACTIVE config nginx reads. It's NOT tracked in git. After `git pull`, you may need to re-copy from `nginx/nginx-ssl.conf`
- **After container recreation**: Always restart nginx (`docker compose restart nginx`) to refresh upstream DNS resolution
- **Disk space**: 30GB disk fills quickly with Docker builds. Monitor with `df -h` and prune regularly
- **CSP/HSTS headers**: Managed by nginx, NOT by next.config.js (Next.js headers() is build-time only)
- **Dockerfile NEXTAUTH_URL**: Default is `http://localhost:3000`. Runtime value comes from `.env.production` via docker-compose env_file

## CRITICAL MISTAKES TO AVOID

### 1. SMTP Settings
- Use app-specific passwords for Gmail, not regular passwords

### 2. Deployment Verification
- **NEVER claim server is running without testing**
- **ALWAYS test with `curl` commands and check actual responses**

### 3. File Path Confusion
- **Correct Path**: `/Users/jihunkong/1001project/1001-stories/`
- **Wrong Path**: `/Users/jihunkong/1001project/1001-stories/1001project/` (NEVER USE)

### 4. Publishing Workflow
- **WRITER SUBMISSIONS**: PDF upload must NOT be required
- **Text Editor Only**: Writers should submit via rich text editor
- **PDF Generation**: AI should generate images for text-only stories

### 5. File Management
- **Use single source of truth for configurations**
- **Archive old files instead of duplicating**

## SSL/HTTPS

- **Provider**: Let's Encrypt (certbot container)
- **Certificate Path**: `/certbot/conf/live/1001stories.seedsofempowerment.org/`
- **Auto-Renewal**: certbot container handles renewal automatically
- **nginx Config**: `nginx/nginx-ssl.conf` → copied to `nginx-current.conf` on server
- **HTTP→HTTPS**: Automatic 301 redirect via nginx

### SSL Setup (for fresh server)
```bash
# 1. Start with HTTP-only nginx config
cp nginx/nginx-http.conf nginx-current.conf
docker compose up -d

# 2. Run certbot to get certificate (domain must point to this server)
docker compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot -d 1001stories.seedsofempowerment.org --email noreply@1001stories.org --agree-tos --non-interactive" certbot

# 3. Switch to SSL nginx config
cp nginx/nginx-ssl.conf nginx-current.conf
docker compose restart nginx
```

## Korean Annotations Success Factors (2025-11-12)

**Status**: ✅ Working (100% Success Rate)

### Quick Summary

Korean annotation highlighting now works correctly due to a two-phase fix addressing Unicode normalization and sequential position tracking. The root cause was a timing mismatch between character mapping creation and text normalization.

**Key Results**:
- **Before**: 60% success rate, wrong positions
- **After**: 100% success rate, perfect highlighting
- **Fix Commits**: 083f6745 (sequential tracking) + 86a844de (Unicode normalization)

### The Problem

Korean text uses combining characters that expand under NFD normalization:
- **NFC**: "안녕" = 2 characters
- **NFD**: "ㅇㅏㄴㄴㅕㅇ" = 6 characters (3x expansion!)

This caused mapping array index mismatches when searching for annotation positions.

### The Solution

**Phase 1** (Commit 083f6745): Track last annotation end position to prevent duplicate matches

**Phase 2** (Commit 86a844de): Normalize HTML BEFORE creating character mapping

```typescript
// ✅ CORRECT: Normalize first, then create mapping
let normalizedHTML = htmlContent.normalize('NFC');
const { text, mapping } = convertHTMLToPlainText(normalizedHTML);
```

### Prevention Rules

✅ **DO**: Always normalize BEFORE creating mapping
✅ **DO**: Use explicit NFC normalization for Korean/Japanese/accented text
✅ **DO**: Test with non-ASCII characters (Korean: "안녕하세요", Japanese: "こんにちは")

❌ **DON'T**: Normalize AFTER creating mapping (will break Korean text)
❌ **DON'T**: Use inconsistent normalization forms

### Code References

- **Primary Fix**: `/lib/ai-review-trigger.ts` (lines 61-333)
- **Frontend**: `/components/story-publication/writer/AnnotatedStoryViewer.tsx` (lines 193-194)
- **Detailed Analysis**: `/docs/KOREAN_ANNOTATION_SUCCESS_ANALYSIS.md`

### Success Metrics

- **Language Support**: Korean, Japanese, Chinese, English, French, German, Arabic (all 100%)
- **Production Logs**: 5/5 annotations successful (0 failures)
- **User Confirmation**: "Korean annotations are now working correctly" ✅

## Support & Resources

- **GitHub Issues**: Report bugs and features
- **Production URL**: https://1001stories.seedsofempowerment.org
- **Server SSH**: `ssh -i ~/.ssh/google_compute_engine jihunkong_pknic_club@34.121.45.14`
- **Server Logs**: `docker compose logs app --tail=50`
- **Container Status**: `docker compose ps`
- **Database GUI**: `npx prisma studio`
- 항상 적절한 agent, mcp를 불러와서 사용하세요.
- ultra think를 하세요
- ultra think, 적절한 agent를 배치하세요. mcp에서 최신 코드들을 확인하세요.