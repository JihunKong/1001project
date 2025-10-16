# Role Permissions Specification - Story Publication

## 📋 Overview

This document defines role-based permissions for the **Story Publication** feature across all 7 user roles in the 1001 Stories platform.

**Related Documents:**
- `docs/STORY_PUBLICATION_PRD.md` (main worktree) - Full PRD requirements
- `WORKFLOW_IMPLEMENTATION_PLAN.md` (workflow-implementation worktree) - State machine and workflow logic

---

## 👥 Section 1: Role Overview

### 1.1 Role Hierarchy

```
ADMIN (superuser)
  ├── CONTENT_ADMIN (final publishing approval)
  ├── BOOK_MANAGER (publication format decisions)
  ├── STORY_MANAGER (story review and feedback)
  ├── WRITER (story creation and submission)
  ├── TEACHER (can submit stories, similar to WRITER)
  ├── LEARNER (can submit stories, with parental consent)
  └── INSTITUTION (organizational account)
```

### 1.2 Role Definitions for Story Publication

#### WRITER
**Primary Function**: Create and submit stories for publication

**Responsibilities**:
- Write and edit stories
- Request AI reviews for improvement
- Submit stories for management review
- Revise stories based on feedback
- View own submission history

**Dashboard**: `/dashboard/writer`

---

#### STORY_MANAGER
**Primary Function**: Review submitted stories and provide feedback

**Responsibilities**:
- Review submissions in queue
- Provide detailed feedback to writers
- Request revisions with specific guidance
- Approve stories for next stage
- Track review metrics (stories reviewed, approval rate)

**Dashboard**: `/dashboard/story-manager`

---

#### BOOK_MANAGER
**Primary Function**: Decide publication format (book vs. text)

**Responsibilities**:
- Review story-approved submissions
- Decide publication format
- Coordinate with Story Managers for clarifications
- Manage publication pipeline

**Dashboard**: `/dashboard/book-manager`

---

#### CONTENT_ADMIN
**Primary Function**: Final approval and publishing authority

**Responsibilities**:
- Final review before publishing
- Approve or reject for publication
- Publish stories to public library
- Set content policies
- Manage published content (unpublish, archive)

**Dashboard**: `/dashboard/content-admin`

---

#### ADMIN
**Primary Function**: System administration with all permissions

**Responsibilities**:
- All CONTENT_ADMIN permissions
- User management
- System configuration
- Override any decision
- View all audit logs

**Dashboard**: `/admin`

---

#### TEACHER & LEARNER
**Limited Submission Access**: Can submit stories but require appropriate oversight

**Permissions**:
- Create stories (like WRITER)
- Submit for review
- Cannot review other submissions

---

## 📊 Section 2: Permission Matrix

### 2.1 TextSubmission Actions

| Action | WRITER | STORY_MGR | BOOK_MGR | CONTENT_ADMIN | ADMIN | TEACHER | LEARNER |
|--------|:------:|:---------:|:--------:|:-------------:|:-----:|:-------:|:-------:|
| **Create** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Edit Draft** | ✅ (own) | ❌ | ❌ | ❌ | ✅ (all) | ✅ (own) | ✅ (own) |
| **Delete Draft** | ✅ (own) | ❌ | ❌ | ❌ | ✅ (all) | ✅ (own) | ✅ (own) |
| **Request AI Review** | ✅ (own) | ❌ | ❌ | ❌ | ✅ (all) | ✅ (own) | ✅ (own) |
| **Submit for Review** | ✅ (own) | ❌ | ❌ | ❌ | ✅ (all) | ✅ (own) | ✅ (own) |
| **View Own Submissions** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **View All Submissions** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assign to Self** | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Request Revision** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Approve Story** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Decide Format** | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Final Approve** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Publish** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Unpublish** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Reject** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Archive** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

**Legend**:
- ✅ = Permission granted
- ❌ = Permission denied
- (own) = Only for user's own submissions
- (all) = For all submissions in the system

### 2.2 AIReview Actions

| Action | WRITER | STORY_MGR | BOOK_MGR | CONTENT_ADMIN | ADMIN |
|--------|:------:|:---------:|:--------:|:-------------:|:-----:|
| **Request Review** | ✅ (own) | ❌ | ❌ | ❌ | ✅ (all) |
| **View Results** | ✅ (own) | ✅ (assigned) | ✅ (assigned) | ✅ (all) | ✅ (all) |
| **Delete Review** | ❌ | ❌ | ❌ | ❌ | ✅ (all) |

---

## 🔒 Section 3: State-Based Access Control

### 3.1 Editing Permissions by Status

| Status | Writer Can Edit | Manager Can View | Manager Can Edit | Notes |
|--------|:---------------:|:----------------:|:----------------:|-------|
| **DRAFT** | ✅ | ❌ | ❌ | Private to writer |
| **PENDING** | ❌ | ✅ | ❌ | Read-only for writer |
| **STORY_REVIEW** | ❌ | ✅ | ✅ (comments) | Manager can add feedback |
| **NEEDS_REVISION** | ✅ | ✅ | ❌ | Writer regains edit access |
| **STORY_APPROVED** | ❌ | ✅ | ❌ | Awaiting Book Manager |
| **FORMAT_REVIEW** | ❌ | ✅ | ✅ (BOOK_MGR) | Book Manager decides format |
| **CONTENT_REVIEW** | ❌ | ✅ | ✅ (CONTENT_ADMIN) | Final review stage |
| **APPROVED** | ❌ | ✅ | ❌ | Ready for publishing |
| **PUBLISHED** | ❌ | ✅ | ❌ | Public, read-only |
| **REJECTED** | ❌ | ✅ | ❌ | Terminal state |
| **ARCHIVED** | ❌ | ❌ | ❌ (ADMIN only) | Historical record |

### 3.2 Transition Authorization

```typescript
// Middleware authorization check
async function canTransitionStatus(
  userId: string,
  submissionId: string,
  fromStatus: TextSubmissionStatus,
  toStatus: TextSubmissionStatus
): Promise<boolean> {
  const user = await getUser(userId);
  const submission = await getSubmission(submissionId);

  // Writer transitions
  if (user.role === 'WRITER') {
    if (fromStatus === 'DRAFT' && toStatus === 'PENDING') {
      return submission.authorId === userId; // Can submit own draft
    }
    if (fromStatus === 'NEEDS_REVISION' && toStatus === 'PENDING') {
      return submission.authorId === userId; // Can resubmit after revision
    }
    return false; // No other transitions allowed
  }

  // Story Manager transitions
  if (user.role === 'STORY_MANAGER') {
    const allowedTransitions = [
      ['PENDING', 'STORY_REVIEW'],
      ['STORY_REVIEW', 'NEEDS_REVISION'],
      ['STORY_REVIEW', 'STORY_APPROVED'],
      ['STORY_REVIEW', 'REJECTED'],
    ];
    return allowedTransitions.some(
      ([from, to]) => fromStatus === from && toStatus === to
    );
  }

  // Book Manager transitions
  if (user.role === 'BOOK_MANAGER') {
    const allowedTransitions = [
      ['STORY_APPROVED', 'FORMAT_REVIEW'],
      ['FORMAT_REVIEW', 'CONTENT_REVIEW'],
      ['FORMAT_REVIEW', 'NEEDS_REVISION'],
      ['FORMAT_REVIEW', 'REJECTED'],
    ];
    return allowedTransitions.some(
      ([from, to]) => fromStatus === from && toStatus === to
    );
  }

  // Content Admin transitions
  if (user.role === 'CONTENT_ADMIN') {
    const allowedTransitions = [
      ['CONTENT_REVIEW', 'APPROVED'],
      ['CONTENT_REVIEW', 'NEEDS_REVISION'],
      ['CONTENT_REVIEW', 'REJECTED'],
      ['APPROVED', 'PUBLISHED'],
      ['PUBLISHED', 'ARCHIVED'],
    ];
    return allowedTransitions.some(
      ([from, to]) => fromStatus === from && toStatus === to
    );
  }

  // Admin can do anything
  if (user.role === 'ADMIN') {
    return true;
  }

  return false;
}
```

---

## 🛡️ Section 4: Middleware Implementation

### 4.1 Route Protection

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const path = request.nextUrl.pathname;

  // Story Publication routes
  if (path.startsWith('/dashboard/writer')) {
    if (!['WRITER', 'TEACHER', 'LEARNER', 'ADMIN'].includes(token.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (path.startsWith('/dashboard/story-manager')) {
    if (!['STORY_MANAGER', 'ADMIN'].includes(token.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (path.startsWith('/dashboard/book-manager')) {
    if (!['BOOK_MANAGER', 'ADMIN'].includes(token.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (path.startsWith('/dashboard/content-admin')) {
    if (!['CONTENT_ADMIN', 'ADMIN'].includes(token.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/text-submissions/:path*',
    '/api/ai-review/:path*',
  ],
};
```

### 4.2 API Authorization Checks

```typescript
// app/api/text-submissions/[id]/submit/route.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submission = await prisma.textSubmission.findUnique({
    where: { id: params.id },
  });

  if (!submission) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // Check ownership
  if (submission.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check status
  if (!['DRAFT', 'NEEDS_REVISION'].includes(submission.status)) {
    return Response.json(
      { error: 'Cannot submit in current status' },
      { status: 400 }
    );
  }

  // Perform submission...
}
```

### 4.3 Authorization Helper Functions

```typescript
// lib/auth/permissions.ts

export function canViewSubmission(
  user: User,
  submission: TextSubmission
): boolean {
  // Author can always view own submission
  if (submission.authorId === user.id) return true;

  // Managers can view all submissions
  const managerRoles: UserRole[] = [
    'STORY_MANAGER',
    'BOOK_MANAGER',
    'CONTENT_ADMIN',
    'ADMIN',
  ];
  return managerRoles.includes(user.role);
}

export function canEditSubmission(
  user: User,
  submission: TextSubmission
): boolean {
  // Only author can edit their own submission
  if (submission.authorId !== user.id && user.role !== 'ADMIN') {
    return false;
  }

  // Can only edit in specific statuses
  const editableStatuses: TextSubmissionStatus[] = [
    'DRAFT',
    'NEEDS_REVISION',
  ];
  return editableStatuses.includes(submission.status);
}

export function canRequestRevision(
  user: User,
  submission: TextSubmission
): boolean {
  const allowedRoles: UserRole[] = [
    'STORY_MANAGER',
    'BOOK_MANAGER',
    'CONTENT_ADMIN',
    'ADMIN',
  ];
  return allowedRoles.includes(user.role);
}

export function canPublish(
  user: User,
  submission: TextSubmission
): boolean {
  if (!['CONTENT_ADMIN', 'ADMIN'].includes(user.role)) {
    return false;
  }

  return submission.status === 'APPROVED';
}
```

---

## 📋 Section 5: Implementation Checklist

### Middleware
- [ ] Route protection for `/dashboard/writer`
- [ ] Route protection for `/dashboard/story-manager`
- [ ] Route protection for `/dashboard/book-manager`
- [ ] Route protection for `/dashboard/content-admin`
- [ ] API route authorization for TextSubmission endpoints

### Authorization Functions
- [ ] `canViewSubmission()`
- [ ] `canEditSubmission()`
- [ ] `canDeleteSubmission()`
- [ ] `canSubmitForReview()`
- [ ] `canRequestRevision()`
- [ ] `canApproveStory()`
- [ ] `canPublish()`
- [ ] `canTransitionStatus()`

### UI Permission Checks
- [ ] Hide "Edit" button if !canEditSubmission
- [ ] Hide "Delete" button if !canDeleteSubmission
- [ ] Hide "Submit" button if !canSubmitForReview
- [ ] Hide "Request Revision" button if !canRequestRevision
- [ ] Hide "Approve" button if !canApproveStory
- [ ] Hide "Publish" button if !canPublish

### Testing
- [ ] Unit tests for each authorization function
- [ ] Integration tests for API authorization
- [ ] E2E tests for role-based access

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Owner**: Security & Authorization Team
**Status**: Ready for Implementation
