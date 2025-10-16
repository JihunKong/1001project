# 🧹 CLEANUP PLAN - 1001 Stories Platform
## Comprehensive Duplicate Removal & Structure Optimization

### 🎯 목표 (Objectives)
1. **빈 디렉토리 제거**: 12개 빈 API 디렉토리 삭제
2. **중복 모델 통합**: Story→Book, StorySubmission→VolunteerSubmission
3. **미사용 시스템 제거**: Quest, School Management, Advanced E-commerce
4. **빌드 아티팩트 정리**: .next 디렉토리 완전 재생성
5. **구조 최적화**: 130개 모델 → 35개 모델 (73% 감소)

---

## 📂 Phase 1: 빈 디렉토리 및 API 라우터 정리

### 1.1 제거 대상 디렉토리 (12개)
```bash
# 현재 빈 디렉토리들
app/api/ab-testing/          # A/B 테스팅 (미구현)
app/api/books/workflow/      # 도서 워크플로우 (중복)
app/api/content/            # 콘텐츠 관리 (중복)
app/api/data/               # 데이터 API (모호)
app/api/demo/               # 데모 API (미구현)
app/api/metrics/            # 메트릭 (미구현)
app/api/notifications/      # 알림 (미구현)
app/api/profile/            # 프로필 (중복)
app/api/resources/          # 리소스 (모호)
app/api/security/           # 보안 (미구현)
app/api/system/             # 시스템 (중복)
app/api/webhooks/           # 웹훅 (미구현)
```

### 1.2 제거 명령어
```bash
# 빈 디렉토리 일괄 제거
find app/api -type d -empty -delete

# 또는 개별 제거
rm -rf app/api/ab-testing
rm -rf app/api/books/workflow
rm -rf app/api/content
rm -rf app/api/data
rm -rf app/api/demo
rm -rf app/api/metrics
rm -rf app/api/notifications
rm -rf app/api/profile
rm -rf app/api/resources
rm -rf app/api/security
rm -rf app/api/system
rm -rf app/api/webhooks
```

### 1.3 유지할 API 라우터
```
app/api/
├── health/route.ts        ✅ KEEP (헬스체크)
├── volunteer/
│   ├── submissions/route.ts ✅ KEEP (자원봉사자 제출)
│   └── stats/route.ts      ✅ KEEP (통계)
└── [구현 필요]
    ├── auth/              📝 TODO (인증)
    ├── books/             📝 TODO (도서 관리)
    ├── classes/           📝 TODO (클래스 관리)
    ├── admin/             📝 TODO (관리자)
    └── publishing/        📝 TODO (게시 워크플로우)
```

---

## 🗃️ Phase 2: 데이터베이스 모델 통합

### 2.1 Story → Book 통합
```sql
-- 현재 상황
Story model:      554-620 lines (콘텐츠 저장)
Book model:       2473-2540 lines (동일 기능)
중복 필드:        title, content, authorName, language, category

-- 통합 전략
1. Book 모델에 Story 필드 병합
2. Story 데이터를 Book으로 마이그레이션
3. Story 참조를 Book으로 변경
4. Story 모델 완전 삭제

-- Migration Script
BEGIN;
  -- Step 1: Book 테이블에 Story 필드 추가
  ALTER TABLE books ADD COLUMN IF NOT EXISTS story_legacy_id STRING;

  -- Step 2: Story 데이터를 Book으로 복사
  INSERT INTO books (
    id, title, subtitle, summary, authorName, language,
    category, content, story_legacy_id, created_at, updated_at
  )
  SELECT
    gen_random_uuid(), title, subtitle, summary, authorName,
    language, ARRAY[category], content, id, created_at, updated_at
  FROM stories
  WHERE id NOT IN (SELECT story_legacy_id FROM books WHERE story_legacy_id IS NOT NULL);

  -- Step 3: 참조 테이블 업데이트
  UPDATE bookmarks SET story_id = (
    SELECT id FROM books WHERE story_legacy_id = bookmarks.story_id
  ) WHERE story_id IN (SELECT id FROM stories);

  UPDATE reading_progress SET story_id = (
    SELECT id FROM books WHERE story_legacy_id = reading_progress.story_id
  ) WHERE story_id IN (SELECT id FROM stories);

  -- Step 4: Story 테이블 삭제
  DROP TABLE stories CASCADE;

  -- Step 5: 임시 컬럼 제거
  ALTER TABLE books DROP COLUMN story_legacy_id;
COMMIT;
```

### 2.2 StorySubmission → VolunteerSubmission 통합
```sql
-- 현재 상황
StorySubmission model:      1349-1400 lines (제출 관리)
VolunteerSubmission model:  2544-2600 lines (동일 기능)
중복 필드:                 title, content, authorId, status, language

-- 통합 전략
1. VolunteerSubmission에 StorySubmission 필드 병합
2. StorySubmission 데이터 마이그레이션
3. API 라우터 통합 (/api/volunteer/submissions 활용)
4. StorySubmission 모델 삭제

-- Migration Script
BEGIN;
  -- Step 1: VolunteerSubmission에 필드 추가
  ALTER TABLE volunteer_submissions
  ADD COLUMN IF NOT EXISTS story_submission_legacy_id STRING,
  ADD COLUMN IF NOT EXISTS priority STRING DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS assignee_id STRING,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS editorial_notes TEXT,
  ADD COLUMN IF NOT EXISTS compensation DECIMAL(10,2);

  -- Step 2: StorySubmission 데이터 복사
  INSERT INTO volunteer_submissions (
    id, volunteer_id, title, text_content, summary, language,
    status, reviewer_id, review_notes, story_submission_legacy_id,
    priority, assignee_id, due_date, editorial_notes, compensation,
    created_at, updated_at
  )
  SELECT
    gen_random_uuid(), author_id, title, content, summary, language,
    status::text, reviewer_id, review_notes, id,
    priority::text, assignee_id, due_date, editorial_notes, compensation,
    created_at, updated_at
  FROM story_submissions;

  -- Step 3: StorySubmission 테이블 삭제
  DROP TABLE story_submissions CASCADE;

  -- Step 4: 임시 컬럼 제거
  ALTER TABLE volunteer_submissions DROP COLUMN story_submission_legacy_id;
COMMIT;
```

### 2.3 미사용 시스템 제거

#### Quest System 제거 (15개 모델, ~1,200 lines)
```sql
-- 제거 대상 테이블들
DROP TABLE IF EXISTS quest_reviews CASCADE;
DROP TABLE IF EXISTS quest_comments CASCADE;
DROP TABLE IF EXISTS quest_attachments CASCADE;
DROP TABLE IF EXISTS quest_progress CASCADE;
DROP TABLE IF EXISTS quest_submissions CASCADE;
DROP TABLE IF EXISTS quest_objectives CASCADE;
DROP TABLE IF EXISTS quest_rewards CASCADE;
DROP TABLE IF EXISTS quest_skills CASCADE;
DROP TABLE IF EXISTS volunteer_points CASCADE;
DROP TABLE IF EXISTS volunteer_redemptions CASCADE;
DROP TABLE IF EXISTS volunteer_evidence CASCADE;
DROP TABLE IF EXISTS volunteer_achievements CASCADE;
DROP TABLE IF EXISTS volunteer_badges CASCADE;
DROP TABLE IF EXISTS volunteer_levels CASCADE;
DROP TABLE IF EXISTS quests CASCADE;

-- User 모델에서 Quest 관련 필드 제거
ALTER TABLE users
DROP COLUMN IF EXISTS created_quests,
DROP COLUMN IF EXISTS reviewed_evidence,
DROP COLUMN IF EXISTS issued_points,
DROP COLUMN IF EXISTS fulfilled_rewards,
DROP COLUMN IF EXISTS quest_reviews;
```

#### School Management System 제거 (8개 모델, ~800 lines)
```sql
-- 제거 대상 테이블들
DROP TABLE IF EXISTS school_districts CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- User 모델에서 School 참조 제거 (INSTITUTION 역할로 대체)
ALTER TABLE users DROP COLUMN IF EXISTS school_id;
```

#### Advanced E-commerce 제거 (12개 모델, ~900 lines)
```sql
-- 제거 대상 테이블들
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS shipping_methods CASCADE;
DROP TABLE IF EXISTS shipping_rates CASCADE;
DROP TABLE IF EXISTS tax_rates CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_options CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS fulfillments CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;

-- 단순화된 주문 시스템만 유지 (Order, OrderItem, Payment)
```

---

## 🏗️ Phase 3: 빌드 아티팩트 정리

### 3.1 PDF 업로드 이슈 해결
```bash
# 문제: volunteer/submit 경로가 .next에 잔존
# 원인: 이전 빌드 아티팩트 캐시

# 해결책 1: 완전한 빌드 정리
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
npm run build

# 해결책 2: Docker 컨테이너 완전 재생성
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# 해결책 3: 개발 환경 초기화
rm -rf node_modules
npm install
npm run dev
```

### 3.2 잔존 파일 검사
```bash
# .next 디렉토리에서 volunteer/submit 검색
find .next -name "*volunteer*" -type f
find .next -name "*submit*" -type f

# 소스코드에서 PDF 업로드 관련 코드 검색
grep -r "accept.*pdf" app/
grep -r "type.*file" app/
grep -r "volunteer.*submit" app/
```

---

## 📁 Phase 4: 파일 구조 최적화

### 4.1 컴포넌트 구조 확장
```bash
# 현재: 2개 컴포넌트만 존재
components/ui/RichTextEditor.tsx
components/ui/StorySubmissionForm.tsx

# 필요: 기본 UI 컴포넌트 추가
mkdir -p components/ui
mkdir -p components/layout
mkdir -p components/book
mkdir -p components/dashboard
mkdir -p components/auth

# 생성할 컴포넌트들
touch components/ui/{Button,Card,Dialog,Form,Input,Select,Table}.tsx
touch components/layout/{Header,Sidebar,Footer}.tsx
touch components/book/{BookCard,BookReader,PDFViewer,TextViewer}.tsx
touch components/dashboard/{StatsCard,ActivityFeed,ProgressChart}.tsx
touch components/auth/{LoginForm,SignupForm,RoleSelector}.tsx
```

### 4.2 라우트 구조 완성
```bash
# 현재: 1개 대시보드만 구현 (volunteer)
app/dashboard/volunteer/page.tsx

# 필요: 모든 역할별 대시보드
mkdir -p app/dashboard/{learner,teacher,institution,admin}
touch app/dashboard/learner/page.tsx
touch app/dashboard/teacher/page.tsx
touch app/dashboard/institution/page.tsx
touch app/dashboard/admin/page.tsx

# 필요: 핵심 기능 페이지
mkdir -p app/{library,demo,\(auth\)}
touch app/library/{page,\[id\]/page}.tsx
touch app/demo/{page,library/page,reader/page}.tsx
touch app/\(auth\)/{login,signup,verify}/page.tsx
```

### 4.3 API 라우터 완성
```bash
# 필요한 API 라우터 생성
mkdir -p app/api/{auth,books,classes,admin,publishing}

# 인증 관련
touch app/api/auth/{signup,verify}/route.ts

# 도서 관리
touch app/api/books/{route,\[id\]/route,assign/route,progress/route}.ts

# 클래스 관리
touch app/api/classes/{route,\[code\]/join/route,\[id\]/students/route}.ts

# 관리자 기능
touch app/api/admin/{users,content,analytics}/route.ts

# 게시 워크플로우
touch app/api/publishing/{submit,review,approve}/route.ts
```

---

## 🔍 Phase 5: 최종 검증

### 5.1 구조 검증 스크립트
```bash
#!/bin/bash
# scripts/verify-structure.sh

echo "🔍 1001 Stories 프로젝트 구조 검증"

# API 라우터 확인
echo "📡 API Routes:"
find app/api -name "route.ts" | wc -l
echo "예상: 15개 이상"

# 대시보드 페이지 확인
echo "📊 Dashboard Pages:"
find app/dashboard -name "page.tsx" | wc -l
echo "예상: 5개 (learner, teacher, volunteer, institution, admin)"

# 컴포넌트 확인
echo "🧩 Components:"
find components -name "*.tsx" | wc -l
echo "예상: 20개 이상"

# 빈 디렉토리 확인
echo "📂 Empty Directories:"
find app/api -type d -empty
echo "예상: 0개"

# 데이터베이스 모델 수 확인
echo "🗄️ Database Models:"
grep -c "^model " prisma/schema.prisma
echo "목표: 35개 이하"

# PDF 관련 코드 잔존 확인
echo "📄 PDF Upload Code:"
grep -r "accept.*pdf" app/ | wc -l
echo "목표: 0개"
```

### 5.2 기능 테스트 체크리스트
```markdown
## 필수 기능 검증

### 🔐 인증 시스템
- [ ] Magic link 로그인 작동
- [ ] 역할별 대시보드 접근 제한
- [ ] 세션 관리 정상 작동

### 📚 도서 관리
- [ ] 도서 목록 조회 (GET /api/books)
- [ ] 도서 상세 보기 (GET /api/books/[id])
- [ ] PDF 뷰어 정상 작동
- [ ] 텍스트 뷰어 정상 작동

### 👨‍🏫 교사 기능
- [ ] 클래스 생성 (POST /api/classes)
- [ ] 학생 초대 코드 생성
- [ ] 도서 할당 (POST /api/books/assign)
- [ ] 학생 진도 모니터링

### 🎓 학습자 기능
- [ ] 클래스 참여 (POST /api/classes/[code]/join)
- [ ] 할당된 도서만 접근 가능
- [ ] 읽기 진도 저장
- [ ] 어려운 단어 설명 기능

### 🤝 자원봉사자 기능
- [ ] 텍스트 스토리 제출 (POST /api/volunteer/submissions)
- [ ] PDF 업로드 UI 제거 확인 ⚠️
- [ ] 제출 이력 조회 (GET /api/volunteer/submissions)
- [ ] 통계 확인 (GET /api/volunteer/stats)

### 🏛️ 기관 기능
- [ ] 기관 대시보드 접근
- [ ] 기관별 사용 통계
- [ ] 교사 계정 관리

### ⚙️ 관리자 기능
- [ ] 전체 사용자 관리
- [ ] 콘텐츠 승인 워크플로우
- [ ] 시스템 분석 대시보드
```

### 5.3 성능 및 보안 검증
```sql
-- 데이터베이스 성능 체크
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bytes DESC
LIMIT 10;

-- 인덱스 사용률 체크
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 느린 쿼리 감지
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 5;
```

---

## 📋 실행 순서 (Execution Order)

### Step 1: 백업 및 준비
```bash
# 1. 전체 데이터베이스 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Git 상태 확인 및 백업
git status
git add .
git commit -m "Backup before major cleanup"
git branch backup-$(date +%Y%m%d)

# 3. 개발 서버 중지
docker-compose down
```

### Step 2: 파일 시스템 정리
```bash
# 1. 빈 API 디렉토리 제거
find app/api -type d -empty -delete

# 2. 빌드 아티팩트 완전 정리
rm -rf .next .turbo node_modules/.cache

# 3. 구조 검증
./scripts/verify-structure.sh
```

### Step 3: 데이터베이스 정리
```bash
# 1. 미사용 모델 제거 (Quest, School, Advanced E-commerce)
npx prisma db execute --file migrations/remove-unused-models.sql

# 2. 중복 모델 통합 (Story→Book, StorySubmission→VolunteerSubmission)
npx prisma db execute --file migrations/consolidate-models.sql

# 3. 스키마 재생성 및 적용
npx prisma generate
npx prisma db push
```

### Step 4: 코드 정리 및 테스트
```bash
# 1. 린팅 및 타입 체크
npm run lint
npx tsc --noEmit

# 2. 빌드 테스트
npm run build

# 3. 기능 테스트
npm run test:e2e

# 4. 개발 서버 재시작
docker-compose up -d
```

### Step 5: 최종 검증
```bash
# 1. 구조 검증
./scripts/verify-structure.sh

# 2. 성능 체크
./scripts/performance-check.sh

# 3. 보안 검증
./scripts/security-audit.sh

# 4. 배포 준비
./scripts/deploy.sh verify
```

---

## ⚠️ 주의사항 (Critical Notes)

### 🔴 데이터 손실 방지
- **반드시 백업 먼저**: 모든 작업 전 전체 DB 백업 필수
- **점진적 마이그레이션**: 한 번에 모든 모델 삭제 금지
- **롤백 계획**: 각 단계별 롤백 스크립트 준비

### 🟡 기능 중단 최소화
- **서비스 중단 시간**: 총 2시간 이하 목표
- **단계별 검증**: 각 단계 완료 후 기능 테스트 필수
- **사용자 알림**: 유지보수 시간 사전 공지

### 🟢 성공 지표
- **모델 수**: 130개 → 35개 달성
- **빌드 크기**: 30% 이상 감소
- **쿼리 성능**: 응답시간 100ms 이하 유지
- **에러율**: 0.1% 이하 유지

---

## 🎯 완료 후 검증 체크리스트

- [ ] 빈 API 디렉토리 12개 모두 제거됨
- [ ] Story 모델이 Book으로 완전 통합됨
- [ ] StorySubmission이 VolunteerSubmission으로 통합됨
- [ ] Quest 시스템 (15개 모델) 완전 제거됨
- [ ] School Management (8개 모델) 완전 제거됨
- [ ] 고급 E-commerce (12개 모델) 완전 제거됨
- [ ] PDF 업로드 UI가 완전히 제거됨
- [ ] 텍스트 전용 자원봉사자 제출 시스템 작동함
- [ ] 모든 역할별 대시보드가 정상 작동함
- [ ] 빌드 시간 50% 이상 단축됨
- [ ] 데이터베이스 성능 개선 확인됨

**🏁 목표 달성 시**: 프로젝트 구조가 28% → 90% 구현률로 향상되고, 유지보수성이 대폭 개선됩니다.