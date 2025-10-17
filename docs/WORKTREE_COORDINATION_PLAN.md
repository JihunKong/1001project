# Worktree Coordination Plan - Story Publication Implementation

## 📋 Overview

This document coordinates the parallel development work across 4 worktrees to implement the **Story Publication** feature based on the PRD.

**Related Documents:**
- `docs/STORY_PUBLICATION_PRD.md` - Full PRD from PD team
- Each worktree has its own specific requirements document

---

## 🎯 Project Goals

### Primary Objectives:
1. **Implement Story Publication Workflow** - Writer creates → AI reviews → Admin approves → Publish
2. **Redesign Landing Page** - Based on Figma design (node-id: 53-100)
3. **Ensure Code Quality** - Fix existing 80+ warnings and 3 errors before new feature development

### Success Criteria:
- ✅ Writers can submit stories with AI review
- ✅ 3-stage approval process (STORY_MANAGER → BOOK_MANAGER → CONTENT_ADMIN) works correctly
- ✅ Automatic notifications on status changes
- ✅ Landing page matches Figma design
- ✅ All lint errors and warnings resolved

---

## 🗂️ Worktree Structure & Responsibilities

```
/Users/jihunkong/1001project/
├── 1001-stories/              [main] - Integration and deployment
├── figma-design/              [figma-design] - UI/UX implementation
├── workflow-implementation/   [workflow-implementation] - Business logic
├── role-definitions/          [role-definitions] - Permission system
└── code-quality/              [code-quality] - Quality assurance
```

### 1️⃣ **Main Worktree** (`1001-stories`)

**Branch**: `main`

**Responsibilities:**
- Store master documentation (PRD, coordination plan)
- Final integration point for all worktree merges
- Production deployment coordination
- Cross-worktree conflict resolution

**Key Files:**
- `docs/STORY_PUBLICATION_PRD.md` - Full PRD
- `docs/WORKTREE_COORDINATION_PLAN.md` - This file

**Merge Strategy:**
- Receive merges from other worktrees in this order:
  1. code-quality → main
  2. role-definitions → main
  3. workflow-implementation → main
  4. figma-design → main

---

### 2️⃣ **Figma Design Worktree** (`figma-design`)

**Branch**: `figma-design`

**Responsibilities:**
- Implement Figma designs into React components
- Create responsive UI (mobile/tablet/desktop)
- Ensure accessibility (a11y) standards

**Document**: `FIGMA_DESIGN_REQUIREMENTS.md`

**Sections:**
1. **Landing Page Redesign** (Priority: High)
   - Hero Section
   - Feature Grid
   - CTA placement
   - Responsive breakpoints

2. **Story Publication UI - Writer View**
   - Story creation form (title, content, auto-save)
   - AI review request button + results display
   - Final submission flow
   - "My Stories" dashboard with status filters

3. **Story Publication UI - Admin View**
   - Review queue interface
   - Inline comment system
   - Revision request form
   - Approve/reject actions

4. **Optional Components**
   - Image upload interface (drag & drop)
   - Preview mode for stories

**Dependencies:**
- Requires API endpoints from `workflow-implementation`
- Requires permission checks from `role-definitions`

**Merge Timing:** Week 3-4 (after workflow and role definitions are ready)

---

### 3️⃣ **Workflow Implementation Worktree** (`workflow-implementation`)

**Branch**: `workflow-implementation`

**Responsibilities:**
- Implement TextSubmission state machine
- AI review API integration
- Notification system (email + push)
- Publishing process logic

**Document**: `WORKFLOW_IMPLEMENTATION_PLAN.md`

**Sections:**
1. **State Machine**
   ```
   Draft → Pending Review → Story Review → Needs Revision →
   Story Approved → Format Review → Content Review → Approved → Published
   ```

2. **AI Review Integration**
   - API endpoint: `POST /api/text-submissions/[id]/ai-review`
   - Async processing with AIReview table
   - Grammar check (GPT-4o-mini)
   - Structure analysis (기승전결)

3. **Notification Triggers**
   - Submit → Notify STORY_MANAGER (email + push)
   - Request Revision → Notify Writer (email + push)
   - Approve → Notify Writer (email)
   - Publish → Notify Writer (email, optional)

4. **API Endpoints**
   ```
   POST   /api/text-submissions                     # Create
   GET    /api/text-submissions                     # List
   PATCH  /api/text-submissions/[id]                # Update
   POST   /api/text-submissions/[id]/ai-review      # AI review
   POST   /api/text-submissions/[id]/submit         # Submit
   POST   /api/text-submissions/[id]/request-revision
   POST   /api/text-submissions/[id]/approve
   POST   /api/text-submissions/[id]/publish        # CONTENT_ADMIN only
   ```

5. **Workflow History**
   - Use WorkflowHistory table for audit trail
   - Log all state transitions

**Dependencies:**
- Requires role permissions from `role-definitions`
- Provides APIs for `figma-design` UI

**Merge Timing:** Week 2-3

---

### 4️⃣ **Role Definitions Worktree** (`role-definitions`)

**Branch**: `role-definitions`

**Responsibilities:**
- Define role permissions for Story Publication
- Implement middleware authorization checks
- State-based access control

**Document**: `ROLE_PERMISSIONS_SPEC.md`

**Sections:**
1. **Role Overview**
   - WRITER: Create, edit draft, submit
   - STORY_MANAGER: Review, request revision, approve story
   - BOOK_MANAGER: Decide publication format
   - CONTENT_ADMIN: Final approve, publish, delete
   - ADMIN: All permissions

2. **Permission Matrix**
   | Action | WRITER | STORY_MGR | BOOK_MGR | CONTENT_ADMIN | ADMIN |
   |--------|--------|-----------|----------|---------------|-------|
   | Create | ✓ | | | | ✓ |
   | Edit Draft | ✓ | | | | ✓ |
   | Submit | ✓ | | | | ✓ |
   | View All | Own | All | All | All | All |
   | Request Revision | | ✓ | ✓ | ✓ | ✓ |
   | Approve Story | | ✓ | | | ✓ |
   | Decide Format | | | ✓ | | ✓ |
   | Final Approve | | | | ✓ | ✓ |
   | Publish | | | | ✓ | ✓ |

3. **State-Based Access Control**
   - Draft: Writer can edit
   - Pending Review: Writer read-only
   - Needs Revision: Writer can edit again
   - Approved: Only CONTENT_ADMIN can publish

4. **Middleware Implementation**
   - Route protection: `/api/text-submissions/*`
   - Authorization checks in API routes

**Dependencies:**
- None (foundational work)

**Merge Timing:** Week 1-2 (early, provides foundation for other work)

---

### 5️⃣ **Code Quality Worktree** (`code-quality`)

**Branch**: `code-quality`

**Responsibilities:**
- Fix existing lint errors and warnings
- Establish coding standards for new features
- Test coverage requirements

**Documents:**
- `CODE_QUALITY_PLAN.md` (existing) - 80+ warnings, 3 errors
- `PRD_IMPLEMENTATION_CHECKLIST.md` (new)

**Sections (Checklist):**
1. **Pre-Implementation Quality Gates**
   - All lint errors fixed (3 React apostrophe errors)
   - Critical console.log warnings resolved
   - React hook dependencies fixed

2. **Coding Standards for Story Publication**
   - TypeScript strict mode
   - No `any` types
   - Proper error handling
   - Loading states for async operations

3. **Test Requirements**
   - Unit tests for state transitions
   - Integration tests for API endpoints
   - E2E tests for complete submission flow

**Dependencies:**
- None (foundational work)

**Merge Timing:** Week 1 (first merge, provides clean foundation)

---

## 📅 Implementation Timeline

### Week 1: Foundation
- **code-quality** (Days 1-5)
  - Fix 3 React errors (apostrophe escaping)
  - Remove/replace console.log statements
  - Fix React hook dependencies
  - **Merge to main**: End of Week 1

- **role-definitions** (Days 3-7)
  - Write ROLE_PERMISSIONS_SPEC.md
  - Implement middleware authorization
  - Add permission checks to API routes
  - **Merge to main**: End of Week 1

### Week 2: Business Logic
- **workflow-implementation** (Days 1-7)
  - Implement TextSubmission state machine
  - Create API endpoints for submission workflow
  - Integrate AI review API
  - Set up notification system
  - **Merge to main**: End of Week 2

### Week 3: UI Implementation (Part 1)
- **figma-design** (Days 1-7)
  - Redesign landing page (Figma node-id: 53-100)
  - Implement Writer story creation UI
  - Create "My Stories" dashboard
  - **Partial merge**: Landing page only

### Week 4: UI Implementation (Part 2)
- **figma-design** (Days 1-5)
  - Implement Admin review UI
  - Add inline comment system
  - Image upload interface
  - **Final merge to main**: End of Week 4

---

## 🔄 Merge Protocol

### Sequential Merge Order (CRITICAL)
This order minimizes conflicts:

1. **code-quality → main** (Week 1)
   - Provides clean codebase
   - No conflicts expected

2. **role-definitions → main** (Week 1)
   - Foundation for authorization
   - May conflict with middleware.ts (resolve carefully)

3. **workflow-implementation → main** (Week 2)
   - Business logic and APIs
   - May conflict with API routes (test thoroughly)

4. **figma-design → main** (Week 3-4)
   - UI components
   - May conflict with existing pages (review PR carefully)

### Merge Checklist for Each Worktree
```bash
# Before merge:
[ ] All tests pass (npm run lint, npm run build)
[ ] No console errors in browser
[ ] Playwright E2E tests pass (if applicable)
[ ] PR created with detailed description
[ ] Code review completed (if team members available)

# Merge command (from main worktree):
git checkout main
git fetch origin [branch-name]
git merge origin/[branch-name] --no-ff -m "Merge [branch-name]: [description]"

# After merge:
git push origin main
[ ] Verify production deployment works
[ ] Monitor for errors in logs
```

---

## 🚨 Risk Mitigation

### Potential Conflicts

1. **Middleware Changes** (role-definitions)
   - **Risk**: Middleware.ts conflicts with existing auth logic
   - **Mitigation**: Backup middleware.ts before merge, test thoroughly

2. **API Route Conflicts** (workflow-implementation)
   - **Risk**: New `/api/text-submissions` routes may conflict with existing routes
   - **Mitigation**: Review all API routes, ensure no duplicates

3. **UI Component Naming** (figma-design)
   - **Risk**: New components may conflict with existing UI components
   - **Mitigation**: Use namespacing (e.g., `StoryPublicationForm` instead of `Form`)

### Rollback Strategy
```bash
# If merge causes critical issues:
git log                          # Find merge commit hash
git revert -m 1 [merge-commit]   # Revert merge
git push origin main             # Deploy rollback

# Then fix issues in worktree and re-merge
```

---

## 📊 Progress Tracking

### Completion Checklist

#### Week 1
- [ ] code-quality: All lint errors fixed
- [ ] code-quality: Merged to main
- [ ] role-definitions: ROLE_PERMISSIONS_SPEC.md complete
- [ ] role-definitions: Middleware authorization implemented
- [ ] role-definitions: Merged to main

#### Week 2
- [ ] workflow-implementation: State machine implemented
- [ ] workflow-implementation: API endpoints created
- [ ] workflow-implementation: AI review integration complete
- [ ] workflow-implementation: Notification system working
- [ ] workflow-implementation: Merged to main

#### Week 3
- [ ] figma-design: Landing page redesigned
- [ ] figma-design: Writer story creation UI complete
- [ ] figma-design: "My Stories" dashboard complete
- [ ] figma-design: Partial merge (landing page)

#### Week 4
- [ ] figma-design: Admin review UI complete
- [ ] figma-design: Inline comments implemented
- [ ] figma-design: Final merge to main
- [ ] **DONE**: Full Story Publication feature live in production

---

## 📞 Communication & Sync

### Daily Sync (Optional)
- Quick status update in each worktree
- Blockers and dependencies
- Estimated completion time

### Weekly Review
- Demo completed features
- Review merge conflicts (if any)
- Adjust timeline if needed

---

## 📝 Notes

- **DO NOT** work directly in main worktree during implementation
- **ALWAYS** commit and push frequently to avoid losing work
- **TEST** thoroughly before requesting merge
- **COMMUNICATE** blockers early to avoid delays

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Owner**: Technical Lead
**Status**: Active
