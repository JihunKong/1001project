# Task Distribution Plan
## Post-Merge Remaining Tasks by Worktree

**Generated**: 2025-10-17
**Status**: After successful merge of code-quality and workflow-implementation worktrees

---

## Executive Summary

✅ **Completed Worktrees**: code-quality, workflow-implementation (merged to main)
⏳ **In Progress**: role-definitions (documentation complete)
📋 **Pending**: figma-design (documentation complete)

**Overall Progress**: 45% complete (Phase 1 of 3 major phases)

---

## 1. code-quality Worktree ✅ COMPLETE

**Status**: All tasks complete, merged to main successfully

### Completed Tasks
- ✅ Fixed all 80+ lint errors/warnings
- ✅ Removed 60+ console.log statements
- ✅ Fixed 15 useEffect dependency warnings
- ✅ Fixed 3 React unescaped entity errors
- ✅ Improved export patterns (2 files)
- ✅ Created CODE_QUALITY_PLAN.md documentation

### Verification Results
```
npm run lint: ✅ 0 errors, 0 warnings
npm run build: ✅ 58 static pages, all routes functional
```

### Next Actions
**None** - This worktree's mission is complete

---

## 2. workflow-implementation Worktree ⏳ 75% COMPLETE

**Status**: Core implementation done, E2E testing blocked

### Completed Tasks (Phase 1-6)
- ✅ Database schema (52 tables migrated)
- ✅ TextSubmission API (CREATE, READ, UPDATE, DELETE)
- ✅ 11-stage publishing workflow state machine
- ✅ OpenAI gpt-5-mini integration for AI reviews
- ✅ Notification system (SSE + Email)
- ✅ VOLUNTEER→WRITER role migration (application layer)
- ✅ Test account creation (volunteer@test.1001stories.org)
- ✅ Writer Dashboard UI components

### Remaining Tasks

#### **Priority 1: E2E Testing Fix** ⚠️ HIGH PRIORITY
**Problem**: Playwright tests fail due to authentication method mismatch
- Test expects: Password-based login
- Production uses: Magic link authentication

**Solution Options**:

**Option A: Auth State Storage (RECOMMENDED)** ⭐
```bash
# Estimated time: 1-2 hours
# Complexity: LOW

# 1. Create auth setup script
# File: tests/auth.setup.ts
# - Login via magic link once
# - Store auth state in .auth/user.json
# - Reuse across all tests

# 2. Update playwright.config.ts
# - Add globalSetup: 'tests/auth.setup.ts'
# - Configure storageState for all projects

# 3. Update existing tests
# - Remove login steps from individual tests
# - Tests start already authenticated
```

**Option B: Add Password Auth to Test User**
```bash
# Estimated time: 3-4 hours
# Complexity: MEDIUM
# Note: Requires database changes and API modifications
```

**Assigned To**: Developer with Playwright experience
**Deadline**: 2 days

#### **Priority 2: Manual Workflow Testing**
**Estimated Time**: 2-3 hours

Test scenarios:
1. **Writer Submission Flow**
   - Login as volunteer@test.1001stories.org
   - Navigate to /dashboard/writer
   - Submit a story via TextSubmissionForm
   - Verify submission appears in "My Submissions"
   - Check status is PENDING

2. **Story Manager Review Flow**
   - Login as story manager account
   - View submission queue at /dashboard/story-manager
   - Open submission for review
   - Provide feedback
   - Approve or request revision

3. **AI Review Integration**
   - Trigger AI grammar review
   - Verify GPT-5-mini API call
   - Check review results display

4. **Notification System**
   - Verify email notifications sent
   - Check in-app notification center
   - Test SSE real-time updates

**Assigned To**: QA or full-stack developer
**Deadline**: 3 days

#### **Priority 3: Production Database Migration**
**Estimated Time**: 1-2 hours

```bash
# Current status: Local database migrated successfully
# Production status: Needs migration

# Steps:
# 1. Backup production database
ssh -i 1001project.pem ubuntu@3.128.143.122
cd /home/ubuntu/1001-stories
docker compose exec postgres pg_dump -U stories_user stories_db > backup.sql

# 2. Run Prisma migrations
docker compose exec app npx prisma migrate deploy

# 3. Verify migration
docker compose exec postgres psql -U stories_user -d stories_db -c "\dt"

# 4. Create test accounts
docker compose exec postgres psql -U stories_user -d stories_db < create-test-user.sql
```

**Assigned To**: DevOps or backend developer
**Deadline**: Before E2E testing begins
**Prerequisites**:
- ⚠️ Requires downtime notification (5-10 minutes)
- Database backup confirmation

---

## 3. role-definitions Worktree 📋 30% COMPLETE

**Status**: Documentation complete, implementation pending

### Completed Tasks
- ✅ ROLE_PERMISSIONS_SPEC.md (comprehensive permission matrix)
- ✅ Role-based routing documented
- ✅ API authorization patterns defined

### Remaining Tasks

#### **Phase 1: Middleware Authorization** ⭐ HIGH PRIORITY
**Estimated Time**: 1 day

**File**: `middleware.ts`

```typescript
// Current: Basic route protection
// Needed: Granular permission checks

// Tasks:
// 1. Add permission checking logic
const rolePermissions = {
  WRITER: ['/dashboard/writer', '/api/writer/*'],
  STORY_MANAGER: ['/dashboard/story-manager', '/api/story-manager/*'],
  BOOK_MANAGER: ['/dashboard/book-manager', '/api/book-manager/*'],
  // ... etc
}

// 2. Implement hasPermission() helper
function hasPermission(role: string, path: string): boolean

// 3. Add permission-based redirects
// - WRITER trying to access /dashboard/story-manager → redirect to /dashboard/writer
// - Unauthorized API calls → return 403 Forbidden

// 4. Add permission denied page
// - /unauthorized page with clear messaging
```

**Assigned To**: Backend developer
**Files Modified**:
- `middleware.ts` (primary)
- `app/unauthorized/page.tsx` (new)

#### **Phase 2: Permission Helper Library**
**Estimated Time**: 1 day

**File**: `lib/auth/permissions.ts` (new)

```typescript
// Tasks:
// 1. Create permission constants
export const PERMISSIONS = {
  SUBMIT_STORY: ['WRITER', 'TEACHER', 'LEARNER'],
  REVIEW_STORY: ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN'],
  APPROVE_STORY: ['STORY_MANAGER'],
  // ... 20+ permissions
}

// 2. Create helper functions
export function userCan(user: User, permission: string): boolean
export function requirePermission(permission: string): Middleware
export function getUserPermissions(role: string): string[]

// 3. Add permission checking hooks
export function usePermission(permission: string): boolean
export function useRequirePermission(permission: string): void
```

**Assigned To**: Backend developer
**Files Created**:
- `lib/auth/permissions.ts`
- `hooks/usePermission.ts`

#### **Phase 3: API Route Authorization**
**Estimated Time**: 2 days

**Target Files**: All API routes in `app/api/`

```typescript
// Tasks:
// 1. Add permission checks to each API route
// Example: app/api/writer/submissions/route.ts
import { requirePermission } from '@/lib/auth/permissions'

export async function POST(req: Request) {
  const user = await requirePermission('SUBMIT_STORY')
  // ... rest of handler
}

// 2. Priority API routes:
// - app/api/writer/submissions/route.ts ⭐
// - app/api/story-manager/submissions/[id]/route.ts ⭐
// - app/api/book-manager/decide/route.ts
// - app/api/content-admin/approve/route.ts
// - app/api/teacher/classes/route.ts
// - app/api/learner/library/route.ts

// 3. Add consistent error responses
// - 401 Unauthorized: Not logged in
// - 403 Forbidden: Logged in but lacks permission
// - Include permission name in error message
```

**Assigned To**: Backend developer
**Files Modified**: 20+ API route files

#### **Phase 4: Unit Tests**
**Estimated Time**: 1-2 days

**File**: `tests/permissions.test.ts` (new)

```typescript
// Test scenarios:
// 1. Permission checking logic
describe('userCan()', () => {
  it('allows WRITER to submit stories')
  it('denies WRITER from reviewing stories')
  it('allows ADMIN all permissions')
})

// 2. Middleware authorization
describe('middleware', () => {
  it('redirects unauthorized role access')
  it('allows authorized role access')
  it('returns 403 for API unauthorized access')
})

// 3. API route authorization
describe('API authorization', () => {
  it('writer can submit stories')
  it('story manager can review stories')
  it('learner cannot review stories')
})
```

**Assigned To**: QA or backend developer with testing experience

### Total Estimated Time: 2-3 days
**Deadline**: 1 week from now
**Prerequisites**: workflow-implementation E2E tests passing

---

## 4. figma-design Worktree 📋 20% COMPLETE

**Status**: Documentation complete, implementation pending (largest workload)

### Completed Tasks
- ✅ FIGMA_DESIGN_REQUIREMENTS.md (detailed specifications)
- ✅ Figma node IDs extracted
- ✅ Design system documented (colors, typography, spacing)

### Remaining Tasks

#### **Phase 1: Landing Page Redesign** ⭐ HIGH PRIORITY
**Estimated Time**: 2-3 days

**Figma Reference**: Node ID 53-100

**Target File**: `app/page.tsx`

**Components to Create/Modify**:
1. **Hero Section** (1 day)
   ```typescript
   // components/landing/HeroSection.tsx
   // - Full-width background image
   // - Headline: "Empower Children Through Stories"
   // - Subheading: Mission statement
   // - CTA buttons: "Start Reading" + "Share a Story"
   // - Responsive layout (mobile/tablet/desktop)
   ```

2. **Feature Cards Section** (0.5 day)
   ```typescript
   // components/landing/FeatureCards.tsx
   // - 3 feature cards with icons
   // - Grid layout: 1 col mobile, 3 cols desktop
   // - Hover effects
   ```

3. **Impact Statistics** (0.5 day)
   ```typescript
   // components/landing/ImpactStats.tsx
   // - Number counters (animated)
   // - "X stories published"
   // - "Y children reached"
   // - "Z volunteers contributing"
   ```

4. **Footer Redesign** (1 day)
   ```typescript
   // components/Footer.tsx (modify)
   // - Multi-column layout
   // - Social media icons
   // - Newsletter signup form
   // - Links: About, Contact, Privacy, Terms
   ```

**Assigned To**: Frontend developer with design skills
**Design Assets Needed**:
- Hero background image
- Feature icons (3)
- Social media icons

#### **Phase 2: Writer Dashboard UI** ⭐ HIGH PRIORITY
**Estimated Time**: 3-4 days

**Target Files**:
- `app/dashboard/writer/page.tsx`
- `components/writer/` (new directory)

**Components to Create**:

1. **Story Creation Form** (2 days)
   ```typescript
   // components/writer/StoryCreationForm.tsx
   // - Rich text editor with formatting toolbar
   // - Category selection (radio buttons)
   // - Title input with character limit
   // - Target age selection (dropdown)
   // - Save draft functionality
   // - Submit for review button
   // - Auto-save every 30 seconds
   ```

   **Specific Requirements**:
   - Fix category grid overflow (use 4 columns, not 5)
   - Fix rich text toolbar overflow (add overflow-x-auto)
   - Mobile responsiveness (tested on 375px, 768px, 1200px, 1920px)

2. **"My Stories" Dashboard** (1-2 days)
   ```typescript
   // components/writer/MyStoriesDashboard.tsx
   // - Story list with status badges
   // - Filters: All, Draft, Pending, Approved, Published
   // - Sort: Date, Title, Status
   // - Story cards with:
   //   - Thumbnail (if image exists)
   //   - Title, excerpt
   //   - Status badge
   //   - Last updated timestamp
   //   - Actions: Edit, View, Delete
   ```

3. **Story Status Badges** (0.5 day)
   ```typescript
   // components/writer/StoryStatusBadge.tsx
   // - Color-coded badges:
   //   - DRAFT: gray
   //   - PENDING: yellow
   //   - IN_REVIEW: blue
   //   - NEEDS_REVISION: orange
   //   - APPROVED: green
   //   - PUBLISHED: green with checkmark
   //   - REJECTED: red
   ```

**Test Files to Update**:
- `tests/writer-figma-redesign.spec.ts` (already exists, needs fixes)
- `tests/story-form-overflow-fixes.spec.ts` (already exists, needs updates)
- `tests/deep-form-navigation.spec.ts` (already exists, needs updates)

**Assigned To**: Frontend developer
**Prerequisites**:
- workflow-implementation merge complete ✅
- Playwright auth state storage implemented

#### **Phase 3: Admin UI (Story Manager + Book Manager)**
**Estimated Time**: 3-4 days

**Target Files**:
- `app/dashboard/story-manager/page.tsx`
- `app/dashboard/book-manager/page.tsx`
- `components/admin/` (new directory)

**Components to Create**:

1. **Review Queue** (2 days)
   ```typescript
   // components/admin/ReviewQueue.tsx
   // - Table view of pending submissions
   // - Columns: Title, Author, Submitted Date, Status, Actions
   // - Filters: Status, Date range, Author
   // - Sort: Date, Title, Status
   // - Pagination (20 per page)
   // - Bulk actions: Approve, Reject, Request Revision
   ```

2. **Inline Comment System** (1-2 days)
   ```typescript
   // components/admin/InlineComments.tsx
   // - Click to add comment on any text
   // - Comment threads with replies
   // - Markdown support in comments
   // - @mention other reviewers
   // - Resolve/unresolve comments
   // - Comment sidebar (collapsible)
   ```

3. **Review History Panel** (1 day)
   ```typescript
   // components/admin/ReviewHistory.tsx
   // - Timeline view of all feedback
   // - Shows: Reviewer name, action, timestamp, comment
   // - Filter by reviewer or action type
   ```

**Assigned To**: Frontend + backend developer (requires backend API)

#### **Phase 4: Mobile Responsiveness Testing**
**Estimated Time**: 1 day

**Test Matrix**:
```
Viewports to test:
- iPhone SE: 375x667
- iPhone 11 Pro: 414x896
- iPad Portrait: 768x1024
- iPad Landscape: 1024x768
- Desktop Small: 1200x800
- Desktop Large: 1920x1080

Pages to test:
- Landing page
- Writer dashboard
- Story creation form
- Review queue
- All role-based dashboards
```

**Test with**:
- Browser DevTools responsive mode
- Real devices (if available)
- Playwright viewport tests

**Assigned To**: QA or frontend developer

### Total Estimated Time: 1 week
**Deadline**: 2 weeks from now
**Prerequisites**:
- role-definitions Phase 1-2 complete (middleware + permissions)
- E2E testing infrastructure working

---

## Timeline Overview

### Week 1: Foundation & Testing
**Focus**: Complete workflow-implementation worktree, unblock testing

**Day 1-2**:
- ⭐ Fix E2E auth state storage (workflow-implementation)
- ⭐ Production database migration (workflow-implementation)

**Day 3-4**:
- Manual workflow testing (workflow-implementation)
- Start middleware authorization (role-definitions Phase 1)

**Day 5-7**:
- Complete middleware authorization (role-definitions Phase 1)
- Permission helper library (role-definitions Phase 2)
- Start API route authorization (role-definitions Phase 3)

**Deliverables**:
- ✅ E2E tests passing
- ✅ Production database migrated
- ✅ Workflow manually verified
- ✅ Permission system 50% complete

### Week 2: Permissions & UI Start
**Focus**: Complete role-definitions, start figma-design

**Day 1-3**:
- Complete API route authorization (role-definitions Phase 3)
- Permission unit tests (role-definitions Phase 4)

**Day 4-5**:
- Start landing page redesign (figma-design Phase 1)
- Hero section + Feature cards

**Day 6-7**:
- Complete landing page redesign
- Start Writer Dashboard UI (figma-design Phase 2)

**Deliverables**:
- ✅ Permission system 100% complete
- ✅ New landing page live
- ✅ Writer Dashboard UI 30% complete

### Week 3: UI Completion
**Focus**: Complete figma-design worktree

**Day 1-4**:
- Complete Writer Dashboard UI (figma-design Phase 2)
- Story creation form + My Stories dashboard
- Fix overflow issues

**Day 5-7**:
- Admin UI implementation (figma-design Phase 3)
- Review queue + Inline comments
- Mobile responsiveness testing (figma-design Phase 4)

**Deliverables**:
- ✅ Writer Dashboard 100% complete
- ✅ Admin UI 100% complete
- ✅ All viewports tested
- ✅ All Playwright tests passing

---

## Priority Matrix

### Must Have (Week 1) 🔴
1. E2E auth state storage fix (workflow-implementation)
2. Production database migration (workflow-implementation)
3. Manual workflow testing (workflow-implementation)
4. Middleware authorization (role-definitions Phase 1)

### Should Have (Week 2) 🟡
5. Permission helper library (role-definitions Phase 2)
6. API route authorization (role-definitions Phase 3)
7. Landing page redesign (figma-design Phase 1)
8. Writer Dashboard UI start (figma-design Phase 2)

### Nice to Have (Week 3) 🟢
9. Admin UI (figma-design Phase 3)
10. Mobile responsiveness testing (figma-design Phase 4)
11. Permission unit tests (role-definitions Phase 4)

---

## Resource Allocation

### Developer Assignments

**Backend Developer** (2 people recommended):
- workflow-implementation: E2E fix, manual testing, DB migration
- role-definitions: All phases (middleware, permissions, API auth, tests)

**Frontend Developer** (2 people recommended):
- figma-design: Landing page redesign
- figma-design: Writer Dashboard UI
- figma-design: Admin UI

**QA Engineer** (1 person):
- workflow-implementation: Manual testing
- role-definitions: Permission tests
- figma-design: Mobile responsiveness testing

**DevOps** (1 person):
- workflow-implementation: Production DB migration
- Ongoing: Monitor production deployments

---

## Success Criteria

### workflow-implementation Worktree ✅ 100%
- [ ] All Playwright E2E tests passing
- [ ] Manual workflow tested (4 scenarios)
- [ ] Production database migrated
- [ ] Zero blocking bugs

### role-definitions Worktree ✅ 100%
- [ ] Middleware authorization implemented
- [ ] Permission helper library complete
- [ ] All 20+ API routes protected
- [ ] Unit tests passing (>80% coverage)
- [ ] Documentation updated

### figma-design Worktree ✅ 100%
- [ ] Landing page matches Figma design
- [ ] Writer Dashboard fully functional
- [ ] Admin UI operational
- [ ] All viewports tested (6 sizes)
- [ ] Zero overflow issues
- [ ] Playwright visual regression tests passing

---

## Risk Assessment

### High Risk ⚠️
1. **E2E Testing Blocked** (workflow-implementation)
   - **Impact**: Delays all dependent tasks
   - **Mitigation**: Prioritize auth state storage fix (Day 1)
   - **Fallback**: Use manual testing if Playwright fix takes >2 days

2. **Production DB Migration Failure** (workflow-implementation)
   - **Impact**: Production site down
   - **Mitigation**:
     - Test migration on staging first
     - Backup database before migration
     - Schedule during low-traffic hours
   - **Rollback Plan**: Restore from backup, revert Docker image

### Medium Risk ⚡
3. **Permission System Breaking Existing Features** (role-definitions)
   - **Impact**: Users unable to access dashboards
   - **Mitigation**:
     - Implement gradually (middleware → helpers → API)
     - Test each phase before moving to next
   - **Rollback Plan**: Feature flag to disable permission checks

4. **Figma Design Implementation Taking Longer** (figma-design)
   - **Impact**: Timeline extends to 4 weeks
   - **Mitigation**:
     - Start with MVP versions
     - Polish in subsequent iterations
   - **Adjustment**: Reduce Phase 3 scope (defer inline comments to v2)

### Low Risk ✅
5. **Mobile Responsiveness Issues** (figma-design)
   - **Impact**: Some viewports look broken
   - **Mitigation**: Test early and often, use existing Tailwind breakpoints
   - **Rollback Plan**: Fix in follow-up PR

---

## Communication Plan

### Daily Standups (15 min)
- What did I complete yesterday?
- What am I working on today?
- Any blockers?

### Weekly Progress Reports
- Worktree completion percentages
- Risks and mitigation status
- Timeline adjustments if needed

### Sprint Review (End of Week 3)
- Demo all completed features
- User acceptance testing
- Plan next phase (Phase 2 of overall project)

---

## Next Immediate Actions (Today)

1. **Assign developers to worktrees**
   - Backend Dev 1 → workflow-implementation (E2E fix)
   - Backend Dev 2 → role-definitions (start planning)
   - Frontend Dev 1 → Review figma-design specs

2. **Create GitHub issues for each task**
   - Use this document as template
   - Add task estimates and assignments

3. **Set up project tracking**
   - GitHub Projects board with 4 columns:
     - Backlog
     - In Progress
     - In Review
     - Done

4. **Schedule kickoff meeting**
   - Review this document with team
   - Answer questions
   - Confirm assignments and timeline

---

## Appendix: Worktree Commands

### View All Worktrees
```bash
git worktree list
```

### Switch to Worktree
```bash
cd /Users/jihunkong/1001project/role-definitions
# or
cd /Users/jihunkong/1001project/figma-design
```

### Pull Latest Changes
```bash
# In each worktree
git pull origin main
```

### Merge Worktree to Main (When Ready)
```bash
# 1. Ensure worktree changes are committed
cd /Users/jihunkong/1001project/role-definitions
git add -A
git commit -m "feat: Complete role-based permissions system"

# 2. Switch to main
cd /Users/jihunkong/1001project/1001-stories
git checkout main

# 3. Merge
git merge role-definitions

# 4. Verify
npm run lint
npm run build

# 5. Push
git push origin main
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Owner**: Development Team Lead
