# PRD - 1001 Stories Platform
## Product Requirements Document with File & Router Specifications

### 1. 시스템 개요 (System Overview)
- **프로젝트명**: 1001 Stories Educational Platform
- **기술스택**: Next.js 15.4.6, React 19, PostgreSQL, Prisma ORM
- **배포환경**: Docker Compose, AWS EC2 (3.128.143.122)
- **인증방식**: NextAuth.js with Magic Links

### 2. 파일 구조 명세 (File Structure Specification)

#### 2.1 현재 구현 상태 (Current Implementation)
```
app/
├── api/                          # API Routes
│   ├── health/route.ts          # Health check endpoint
│   ├── volunteer/
│   │   ├── submissions/route.ts # GET/POST volunteer submissions
│   │   └── stats/route.ts       # GET volunteer statistics
│   └── [12 empty directories]   # TO BE REMOVED
├── dashboard/
│   ├── layout.tsx               # Dashboard layout wrapper
│   └── volunteer/
│       └── page.tsx             # Volunteer dashboard UI
└── [core files]
    ├── layout.tsx               # Root layout
    ├── providers.tsx            # Context providers
    └── globals.css              # Global styles
```

#### 2.2 필요 구현 사항 (Required Implementation)
```
app/
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts  # NextAuth handlers
│   │   ├── signup/route.ts         # User registration
│   │   └── verify/route.ts         # Email verification
│   ├── books/
│   │   ├── route.ts                # GET/POST books
│   │   ├── [id]/route.ts          # GET/PUT/DELETE single book
│   │   ├── assign/route.ts        # Teacher book assignments
│   │   └── progress/route.ts      # Reading progress tracking
│   ├── classes/
│   │   ├── route.ts                # GET/POST classes
│   │   ├── [code]/join/route.ts   # Student class joining
│   │   └── [id]/students/route.ts # Class enrollment management
│   ├── admin/
│   │   ├── users/route.ts         # User management
│   │   ├── content/route.ts       # Content moderation
│   │   └── analytics/route.ts     # Platform analytics
│   └── publishing/
│       ├── submit/route.ts        # Story submission
│       ├── review/route.ts        # Review workflow
│       └── approve/route.ts       # Approval workflow
├── dashboard/
│   ├── learner/page.tsx          # Student dashboard
│   ├── teacher/page.tsx          # Teacher dashboard
│   ├── volunteer/page.tsx        # Volunteer dashboard (EXISTS)
│   ├── institution/page.tsx      # Institution dashboard
│   └── admin/page.tsx             # Admin dashboard
├── library/
│   ├── page.tsx                   # Library browser
│   └── [id]/page.tsx             # Book reader
├── demo/
│   ├── page.tsx                   # Demo landing
│   ├── library/page.tsx         # Demo library
│   └── reader/page.tsx           # Demo reader
└── (auth)/
    ├── login/page.tsx            # Login page
    ├── signup/page.tsx           # Registration page
    └── verify/page.tsx           # Email verification
```

### 3. API 라우터 명세 (API Router Specification)

#### 3.1 인증 관련 (Authentication)
| Route | Method | Purpose | Request Body | Response |
|-------|--------|---------|--------------|----------|
| /api/auth/signup | POST | Create account | `{email, name, role}` | `{user, message}` |
| /api/auth/verify | POST | Verify email | `{token}` | `{verified: boolean}` |
| /api/auth/session | GET | Get session | - | `{user, expires}` |

#### 3.2 콘텐츠 관리 (Content Management)
| Route | Method | Purpose | Request Body | Response |
|-------|--------|---------|--------------|----------|
| /api/books | GET | List books | - | `{books[]}` |
| /api/books | POST | Create book | `{title, content, type}` | `{book}` |
| /api/books/[id] | GET | Get book | - | `{book}` |
| /api/books/[id] | PUT | Update book | `{updates}` | `{book}` |
| /api/books/[id] | DELETE | Delete book | - | `{success}` |
| /api/books/assign | POST | Assign to class | `{bookId, classId}` | `{assignment}` |

#### 3.3 자원봉사자 (Volunteer) - IMPLEMENTED
| Route | Method | Purpose | Request Body | Response |
|-------|--------|---------|--------------|----------|
| /api/volunteer/submissions | GET | List submissions | - | `{submissions[]}` |
| /api/volunteer/submissions | POST | Create submission | `{title, content, ...}` | `{submission}` |
| /api/volunteer/stats | GET | Get statistics | - | `{stats}` |

#### 3.4 클래스 관리 (Class Management)
| Route | Method | Purpose | Request Body | Response |
|-------|--------|---------|--------------|----------|
| /api/classes | GET | List classes | - | `{classes[]}` |
| /api/classes | POST | Create class | `{name, description}` | `{class, code}` |
| /api/classes/[code]/join | POST | Join class | `{studentId}` | `{enrollment}` |
| /api/classes/[id]/students | GET | List students | - | `{students[]}` |

### 4. 컴포넌트 구조 (Component Structure)

#### 4.1 현재 구현 (Current)
```
components/
├── ui/
│   ├── RichTextEditor.tsx    # TipTap rich text editor
│   └── StorySubmissionForm.tsx # Story submission form
└── [EMPTY - Need implementation]
```

#### 4.2 필요 컴포넌트 (Required)
```
components/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Dialog.tsx
│   ├── Form.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   └── Table.tsx
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── book/
│   ├── BookCard.tsx
│   ├── BookReader.tsx
│   ├── PDFViewer.tsx
│   └── TextViewer.tsx
├── dashboard/
│   ├── StatsCard.tsx
│   ├── ActivityFeed.tsx
│   └── ProgressChart.tsx
└── auth/
    ├── LoginForm.tsx
    ├── SignupForm.tsx
    └── RoleSelector.tsx
```

### 5. 중복 제거 계획 (Duplicate Removal Plan)

#### 5.1 API 라우터 중복
- **현재 문제**: 12개의 빈 API 디렉토리
- **제거 대상**:
  - /api/ab-testing/
  - /api/books/workflow/
  - /api/content/
  - /api/data/
  - /api/demo/
  - /api/metrics/
  - /api/notifications/
  - /api/profile/
  - /api/resources/
  - /api/security/
  - /api/system/
  - /api/webhooks/

#### 5.2 데이터베이스 모델 중복
- **Story → Book 통합**: 중복 콘텐츠 모델 제거
- **Product → ShopProduct 통합**: 중복 상품 모델 제거
- **Quest System 제거**: 15개 미사용 모델 삭제
- **School Management 제거**: 8개 미사용 모델 삭제

### 6. 라우팅 보안 정책 (Routing Security Policy)

#### 6.1 Public Routes
- `/` - Landing page
- `/demo/*` - Demo experience
- `/login` - Authentication
- `/signup` - Registration
- `/api/health` - Health check

#### 6.2 Protected Routes (by Role)
```javascript
// middleware.ts implementation
const roleRoutes = {
  LEARNER: ['/dashboard/learner', '/library', '/book/*'],
  TEACHER: ['/dashboard/teacher', '/classes/*', '/students/*'],
  WRITER: ['/dashboard/writer', '/submissions/*'],
  INSTITUTION: ['/dashboard/institution', '/organization/*'],
  STORY_MANAGER: ['/dashboard/story-manager', '/reviews/*'],
  BOOK_MANAGER: ['/dashboard/book-manager', '/publications/*'],
  CONTENT_ADMIN: ['/dashboard/content-admin', '/final-reviews/*'],
  ADMIN: ['/*'] // Full access
}
```

### 7. 파일 네이밍 규칙 (File Naming Convention)
- **Pages**: `page.tsx` (App Router convention)
- **Layouts**: `layout.tsx` (App Router convention)
- **API Routes**: `route.ts` (App Router convention)
- **Components**: PascalCase (e.g., `BookCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Hooks**: `use` prefix (e.g., `useAuth.ts`)

### 8. 빌드 아티팩트 정리 (Build Artifact Cleanup)
```bash
# Clean build process
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

### 9. PDF 업로드 이슈 해결 (PDF Upload Issue Resolution)
- **문제**: volunteer/submit 경로가 빌드 아티팩트에 남아있음
- **원인**: `.next/server/app/dashboard/volunteer/submit/` 디렉토리 잔존
- **해결**:
  1. 빌드 아티팩트 완전 제거
  2. 텍스트 전용 제출 확인
  3. PDF 관련 코드 제거 확인

### 10. 배포 구조 (Deployment Structure)
```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL
      - NEXTAUTH_URL
  postgres:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
  nginx:
    image: nginx
    ports: ["80:80", "443:443"]
```