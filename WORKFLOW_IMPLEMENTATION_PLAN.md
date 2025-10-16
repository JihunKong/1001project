# Workflow Implementation Plan - Story Publication

## 📋 Overview

This document specifies the business logic, API endpoints, state management, and notification system for the **Story Publication** workflow.

**Related Documents:**
- `docs/STORY_PUBLICATION_PRD.md` (main worktree) - Full PRD
- `FIGMA_DESIGN_REQUIREMENTS.md` (figma-design worktree) - UI specifications
- `ROLE_PERMISSIONS_SPEC.md` (role-definitions worktree) - Permission matrix

---

## 🔄 Section 1: State Machine

### 1.1 TextSubmission Status Flow

```
                                     ┌──────────────┐
                                     │    DRAFT     │
                                     └──────┬───────┘
                                            │ submit()
                                            ▼
                                     ┌──────────────┐
                       ┌────────────│   PENDING    │
                       │            └──────┬───────┘
                       │                   │ assign to STORY_MANAGER
         requestRevision()                 ▼
                       │            ┌──────────────┐
                       ├───────────│ STORY_REVIEW │
                       │            └──────┬───────┘
                       │                   │ approve()
                       │                   ▼
                       │            ┌──────────────┐
                       └──────────▶│NEEDS_REVISION│
                                    └──────┬───────┘
                                           │ resubmit()
                                           ▼
                                    ┌──────────────┐
                                    │STORY_APPROVED│
                                    └──────┬───────┘
                                           │ assign to BOOK_MANAGER
                                           ▼
                                    ┌──────────────┐
                                    │FORMAT_REVIEW │
                                    └──────┬───────┘
                                           │ decide format
                                           ▼
                                    ┌──────────────┐
                                    │CONTENT_REVIEW│
                                    └──────┬───────┘
                                           │ finalApprove()
                       ┌───────────────────┼────────────────┐
                       │                   │                │
                    reject()            approve()        publish()
                       │                   │                │
                       ▼                   ▼                ▼
                 ┌──────────┐       ┌──────────┐    ┌──────────┐
                 │ REJECTED │       │ APPROVED │    │PUBLISHED │
                 └──────────┘       └──────────┘    └──────────┘
                                                           │
                                                      archive()
                                                           ▼
                                                    ┌──────────┐
                                                    │ ARCHIVED │
                                                    └──────────┘
```

### 1.2 State Definitions

| Status | Description | Editable by Writer | Visible to | Next Actions |
|--------|-------------|-------------------|------------|--------------|
| **DRAFT** | Initial creation, not submitted | ✓ | Writer only | save, requestAIReview, submit |
| **PENDING** | Submitted, waiting for assignment | ✗ | Writer, Managers | assignReviewer |
| **STORY_REVIEW** | Under review by STORY_MANAGER | ✗ | Writer, STORY_MANAGER | approve, requestRevision, reject |
| **NEEDS_REVISION** | Requires changes from writer | ✓ | Writer, STORY_MANAGER | resubmit |
| **STORY_APPROVED** | Story approved, pending format decision | ✗ | All managers | assignBookManager |
| **FORMAT_REVIEW** | BOOK_MANAGER deciding format | ✗ | All managers | decideFormat |
| **CONTENT_REVIEW** | Final review by CONTENT_ADMIN | ✗ | All managers | finalApprove, reject |
| **APPROVED** | Ready for publishing | ✗ | All managers | publish |
| **PUBLISHED** | Live on public library | ✗ | Everyone | archive, unpublish |
| **REJECTED** | Rejected at any stage | ✗ | Writer, Managers | - (terminal state) |
| **ARCHIVED** | No longer active | ✗ | Admins only | restore |

### 1.3 Transition Rules

#### Writer Actions
```typescript
// Draft → Pending
async function submitForReview(submissionId: string) {
  // Validations
  if (!submission.title || !submission.content) {
    throw new Error('Title and content are required');
  }
  if (!submission.copyrightConfirmed) {
    throw new Error('Copyright confirmation required');
  }

  // Transition
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'PENDING',
      submittedAt: new Date(),
    },
  });

  // Notify STORY_MANAGER
  await notifyStoryManagers(submissionId);

  // Log workflow history
  await logWorkflowTransition(submissionId, 'DRAFT', 'PENDING', userId);
}

// Needs Revision → Pending (resubmit)
async function resubmitAfterRevision(submissionId: string) {
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'PENDING',
      submittedAt: new Date(),
    },
  });

  await notifyReviewer(submissionId);
  await logWorkflowTransition(submissionId, 'NEEDS_REVISION', 'PENDING', userId);
}
```

#### STORY_MANAGER Actions
```typescript
// Pending → Story Review (assign)
async function assignToSelf(submissionId: string, managerId: string) {
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'STORY_REVIEW',
      storyManagerId: managerId,
    },
  });

  await logWorkflowTransition(submissionId, 'PENDING', 'STORY_REVIEW', managerId);
}

// Story Review → Needs Revision
async function requestRevision(submissionId: string, feedback: string) {
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'NEEDS_REVISION',
      storyFeedback: feedback,
    },
  });

  await notifyWriter(submissionId, 'REVISION_REQUESTED');
  await logWorkflowTransition(submissionId, 'STORY_REVIEW', 'NEEDS_REVISION', managerId);
}

// Story Review → Story Approved
async function approveStory(submissionId: string) {
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'STORY_APPROVED',
    },
  });

  await notifyBookManagers(submissionId);
  await logWorkflowTransition(submissionId, 'STORY_REVIEW', 'STORY_APPROVED', managerId);
}
```

#### BOOK_MANAGER Actions
```typescript
// Story Approved → Format Review
async function assignFormatReview(submissionId: string, managerId: string) {
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'FORMAT_REVIEW',
      bookManagerId: managerId,
    },
  });

  await logWorkflowTransition(submissionId, 'STORY_APPROVED', 'FORMAT_REVIEW', managerId);
}

// Format Review → Content Review
async function decideFormat(submissionId: string, decision: string) {
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'CONTENT_REVIEW',
      bookDecision: decision,
    },
  });

  await notifyContentAdmins(submissionId);
  await logWorkflowTransition(submissionId, 'FORMAT_REVIEW', 'CONTENT_REVIEW', managerId);
}
```

#### CONTENT_ADMIN Actions
```typescript
// Content Review → Approved
async function finalApprove(submissionId: string, notes?: string) {
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'APPROVED',
      finalNotes: notes,
    },
  });

  await notifyWriter(submissionId, 'APPROVED');
  await logWorkflowTransition(submissionId, 'CONTENT_REVIEW', 'APPROVED', adminId);
}

// Approved → Published
async function publishStory(submissionId: string) {
  const submission = await prisma.textSubmission.findUnique({
    where: { id: submissionId },
  });

  // Create Publication record
  const publication = await prisma.publication.create({
    data: {
      submissionId,
      publishedBy: adminId,
      publishedAt: new Date(),
      status: 'PUBLISHED',
    },
  });

  // Update submission status
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Sync to Public Library (Book table)
  await syncToLibrary(submission);

  await notifyWriter(submissionId, 'PUBLISHED');
  await logWorkflowTransition(submissionId, 'APPROVED', 'PUBLISHED', adminId);
}

// Any stage → Rejected
async function rejectSubmission(submissionId: string, reason: string) {
  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
  });

  await notifyWriter(submissionId, 'REJECTED');
  await logWorkflowTransition(submissionId, currentStatus, 'REJECTED', adminId);
}
```

---

## 🤖 Section 2: AI Review Integration

### 2.1 AI Review API Specification

#### Endpoint
```
POST /api/text-submissions/[id]/ai-review
```

#### Request
```typescript
interface AIReviewRequest {
  reviewType: 'GRAMMAR' | 'STRUCTURE' | 'WRITING_HELP';
}
```

#### Response
```typescript
interface AIReviewResponse {
  reviewId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  score?: number;              // 0-100 (for GRAMMAR and STRUCTURE)
  suggestions?: string[];      // List of improvement suggestions
  feedback?: {
    grammar?: {
      score: number;
      errors: Array<{
        text: string;
        correction: string;
        explanation: string;
      }>;
    };
    structure?: {
      score: number;
      analysis: string;         // 기승전결 analysis
      strengths: string[];
      improvements: string[];
    };
  };
  errorMessage?: string;       // If FAILED
}
```

### 2.2 Implementation Flow

#### Async Processing (Recommended)
```typescript
// 1. Create AIReview record with PENDING status
async function requestAIReview(submissionId: string, reviewType: AIReviewType) {
  const submission = await prisma.textSubmission.findUnique({
    where: { id: submissionId },
  });

  // Create AI review record
  const review = await prisma.aIReview.create({
    data: {
      submissionId,
      reviewType,
      status: 'PENDING',
    },
  });

  // Queue for processing (background job)
  await queueAIReviewJob(review.id, submission.content);

  return { reviewId: review.id, status: 'PENDING' };
}

// 2. Background worker processes AI review
async function processAIReview(reviewId: string, content: string) {
  try {
    await prisma.aIReview.update({
      where: { id: reviewId },
      data: { status: 'PROCESSING' },
    });

    // Call OpenAI API
    const result = await callOpenAIAPI(content, reviewType);

    // Update with results
    await prisma.aIReview.update({
      where: { id: reviewId },
      data: {
        status: 'COMPLETED',
        feedback: result.feedback,
        score: result.score,
        suggestions: result.suggestions,
        modelUsed: 'gpt-4o-mini',
        tokensUsed: result.tokensUsed,
        processingTime: result.processingTime,
      },
    });

    // Notify writer
    await notifyAIReviewComplete(reviewId);
  } catch (error) {
    await prisma.aIReview.update({
      where: { id: reviewId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });
  }
}

// 3. Client polls for results
GET /api/ai-reviews/[reviewId]
// Returns: { status, feedback, score, suggestions }
```

### 2.3 OpenAI Prompt Templates

#### Grammar Check
```typescript
const GRAMMAR_PROMPT = `
You are a writing assistant helping a young writer improve their story.

Analyze the following story for grammar, spelling, and punctuation errors.
Provide specific corrections with explanations.

Story:
"""
{content}
"""

Return JSON:
{
  "score": 0-100,
  "errors": [
    {
      "text": "original text with error",
      "correction": "corrected text",
      "explanation": "brief explanation"
    }
  ],
  "overallFeedback": "1-2 sentences of encouragement"
}
`;
```

#### Structure Analysis (기승전결)
```typescript
const STRUCTURE_PROMPT = `
You are a story structure expert analyzing a narrative.

Evaluate this story's structure based on the 기승전결 (Introduction, Development, Turn, Conclusion) framework:

- 기 (Introduction): Does it establish the setting and characters?
- 승 (Development): Does it develop the plot and conflicts?
- 전 (Turn): Is there a clear turning point or climax?
- 결 (Conclusion): Does it resolve the story satisfactorily?

Story:
"""
{content}
"""

Return JSON:
{
  "score": 0-100,
  "analysis": "detailed analysis of each element",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["suggestion 1", "suggestion 2"]
}
`;
```

### 2.4 Error Handling

```typescript
try {
  const review = await requestAIReview(submissionId, 'GRAMMAR');
  return res.json({ success: true, reviewId: review.id });
} catch (error) {
  if (error.code === 'OPENAI_API_ERROR') {
    return res.status(503).json({
      error: 'AI service temporarily unavailable',
      message: 'Please try again in a few minutes',
    });
  }

  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    return res.status(429).json({
      error: 'Too many AI review requests',
      message: 'Please wait before requesting another review',
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
  });
}
```

---

## 📧 Section 3: Notification System

### 3.1 Notification Triggers

| Event | Recipient | Channel | Template |
|-------|-----------|---------|----------|
| **Submission** | STORY_MANAGER (all) | Email + Push | `submission_received` |
| **Assigned to Reviewer** | Assigned STORY_MANAGER | Push | `review_assigned` |
| **Revision Requested** | Writer | Email + Push | `revision_requested` |
| **Story Approved** | Writer | Email | `story_approved` |
| **Final Approved** | Writer | Email | `final_approved` |
| **Published** | Writer | Email (optional) | `story_published` |
| **Rejected** | Writer | Email + Push | `submission_rejected` |
| **AI Review Complete** | Writer | Push | `ai_review_ready` |

### 3.2 EmailService Integration

```typescript
// lib/notifications/EmailService.ts

export async function sendSubmissionNotification(
  submission: TextSubmission,
  recipientRole: UserRole
) {
  const recipients = await getUsersByRole(recipientRole);

  for (const recipient of recipients) {
    await sendEmail({
      to: recipient.email,
      subject: '새로운 스토리 제출',
      template: 'submission_received',
      data: {
        recipientName: recipient.name,
        submissionTitle: submission.title,
        authorAlias: submission.authorAlias,
        submittedAt: submission.submittedAt,
        reviewUrl: `${process.env.NEXTAUTH_URL}/dashboard/story-manager/review/${submission.id}`,
      },
    });
  }
}

export async function sendRevisionRequestNotification(
  submission: TextSubmission,
  feedback: string
) {
  const writer = await prisma.user.findUnique({
    where: { id: submission.authorId },
  });

  await sendEmail({
    to: writer.email,
    subject: '스토리 수정 요청',
    template: 'revision_requested',
    data: {
      writerName: writer.name,
      submissionTitle: submission.title,
      feedback,
      editUrl: `${process.env.NEXTAUTH_URL}/dashboard/writer/story/${submission.id}`,
    },
  });
}

export async function sendApprovalNotification(
  submission: TextSubmission
) {
  const writer = await prisma.user.findUnique({
    where: { id: submission.authorId },
  });

  await sendEmail({
    to: writer.email,
    subject: '🎉 스토리 승인 완료',
    template: 'story_approved',
    data: {
      writerName: writer.name,
      submissionTitle: submission.title,
      approvedAt: new Date(),
      dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard/writer/stories`,
    },
  });
}
```

### 3.3 Push Notification Integration

```typescript
// lib/notifications/PushNotificationService.ts

export async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    message: string;
    actionUrl?: string;
  }
) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'VOLUNTEER',  // or appropriate type
      title: notification.title,
      message: notification.message,
      data: notification.actionUrl ? { actionUrl: notification.actionUrl } : null,
      read: false,
    },
  });

  // Optionally: Send real-time via WebSocket/SSE
  await sendRealtimeNotification(userId, notification);
}

// Example usage
await sendPushNotification(writerId, {
  title: '수정 요청',
  message: '관리자가 스토리에 대한 피드백을 남겼습니다.',
  actionUrl: `/dashboard/writer/story/${submissionId}`,
});
```

---

## 📋 Section 4: API Endpoints

### 4.1 TextSubmission CRUD

#### Create
```
POST /api/text-submissions

Request Body:
{
  "title": "Story Title",
  "content": "Rich text content...",
  "language": "en",
  "authorAlias": "pen_name",
  "summary": "Brief summary...",
  "ageRange": "9-12",
  "category": ["Fantasy", "Adventure"],
  "tags": ["magic", "friendship"]
}

Response: 201 Created
{
  "id": "submission_id",
  "status": "DRAFT",
  "createdAt": "2024-10-16T..."
}
```

#### List (with filters)
```
GET /api/text-submissions?status=DRAFT&authorId=user_123

Response: 200 OK
{
  "submissions": [
    {
      "id": "sub_1",
      "title": "...",
      "status": "DRAFT",
      "updatedAt": "..."
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 10
}
```

#### Get One
```
GET /api/text-submissions/[id]

Response: 200 OK
{
  "id": "sub_1",
  "title": "...",
  "content": "...",
  "status": "STORY_REVIEW",
  "storyFeedback": "...",
  "author": {
    "id": "user_123",
    "name": "Writer Name"
  },
  "aiReviews": [
    {
      "id": "review_1",
      "reviewType": "GRAMMAR",
      "score": 85,
      "createdAt": "..."
    }
  ]
}
```

#### Update
```
PATCH /api/text-submissions/[id]

Request Body:
{
  "title": "Updated Title",
  "content": "Updated content..."
}

Response: 200 OK
{
  "id": "sub_1",
  "updatedAt": "2024-10-16T..."
}
```

#### Delete
```
DELETE /api/text-submissions/[id]

Response: 204 No Content
```

### 4.2 Workflow Actions

#### Submit for Review
```
POST /api/text-submissions/[id]/submit

Request Body:
{
  "copyrightConfirmed": true
}

Response: 200 OK
{
  "status": "PENDING",
  "submittedAt": "2024-10-16T..."
}
```

#### Request AI Review
```
POST /api/text-submissions/[id]/ai-review

Request Body:
{
  "reviewType": "GRAMMAR"  // or "STRUCTURE"
}

Response: 202 Accepted
{
  "reviewId": "review_123",
  "status": "PENDING",
  "message": "AI review queued"
}
```

#### Request Revision (STORY_MANAGER)
```
POST /api/text-submissions/[id]/request-revision

Request Body:
{
  "feedback": "Please improve the dialogue in chapter 2...",
  "priority": "MEDIUM"
}

Response: 200 OK
{
  "status": "NEEDS_REVISION",
  "storyFeedback": "..."
}
```

#### Approve Story (STORY_MANAGER)
```
POST /api/text-submissions/[id]/approve

Response: 200 OK
{
  "status": "STORY_APPROVED"
}
```

#### Publish (CONTENT_ADMIN only)
```
POST /api/text-submissions/[id]/publish

Response: 200 OK
{
  "status": "PUBLISHED",
  "publishedAt": "2024-10-16T...",
  "publicationId": "pub_123"
}
```

---

## 📊 Section 5: Workflow History Logging

### 5.1 WorkflowHistory Table Usage

```typescript
// Log every state transition
async function logWorkflowTransition(
  textSubmissionId: string,
  fromStatus: string | null,
  toStatus: string,
  performedById: string,
  comment?: string
) {
  await prisma.workflowHistory.create({
    data: {
      textSubmissionId,
      fromStatus,
      toStatus,
      performedById,
      comment,
      metadata: {
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    },
  });
}
```

### 5.2 Audit Trail Query

```typescript
// Get full history for a submission
async function getSubmissionHistory(submissionId: string) {
  return await prisma.workflowHistory.findMany({
    where: { textSubmissionId: submissionId },
    include: {
      performedBy: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

// Example output:
[
  {
    fromStatus: null,
    toStatus: 'DRAFT',
    performedBy: { name: 'Writer A', role: 'WRITER' },
    createdAt: '2024-10-01T...',
  },
  {
    fromStatus: 'DRAFT',
    toStatus: 'PENDING',
    performedBy: { name: 'Writer A', role: 'WRITER' },
    comment: 'Initial submission',
    createdAt: '2024-10-05T...',
  },
  {
    fromStatus: 'PENDING',
    toStatus: 'STORY_REVIEW',
    performedBy: { name: 'Reviewer B', role: 'STORY_MANAGER' },
    createdAt: '2024-10-06T...',
  },
  // ...
]
```

---

## 🧪 Testing Strategy

### 6.1 Unit Tests

```typescript
// tests/workflow/state-machine.test.ts

describe('TextSubmission State Machine', () => {
  it('should transition from DRAFT to PENDING', async () => {
    const submission = await createTestSubmission({ status: 'DRAFT' });
    await submitForReview(submission.id);

    const updated = await prisma.textSubmission.findUnique({
      where: { id: submission.id },
    });

    expect(updated.status).toBe('PENDING');
    expect(updated.submittedAt).toBeTruthy();
  });

  it('should not allow direct transition from DRAFT to PUBLISHED', async () => {
    const submission = await createTestSubmission({ status: 'DRAFT' });

    await expect(
      publishStory(submission.id)
    ).rejects.toThrow('Invalid status transition');
  });

  it('should send notification on submission', async () => {
    const submission = await createTestSubmission({ status: 'DRAFT' });
    const notifySpy = jest.spyOn(NotificationService, 'notifyStoryManagers');

    await submitForReview(submission.id);

    expect(notifySpy).toHaveBeenCalledWith(submission.id);
  });
});
```

### 6.2 Integration Tests

```typescript
// tests/api/text-submissions.test.ts

describe('POST /api/text-submissions/:id/submit', () => {
  it('should submit story and notify managers', async () => {
    const writer = await createTestUser({ role: 'WRITER' });
    const submission = await createTestSubmission({
      authorId: writer.id,
      status: 'DRAFT',
    });

    const response = await request(app)
      .post(`/api/text-submissions/${submission.id}/submit`)
      .set('Authorization', `Bearer ${writer.token}`)
      .send({ copyrightConfirmed: true });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('PENDING');

    // Check notification created
    const notifications = await prisma.notification.findMany({
      where: {
        user: { role: 'STORY_MANAGER' },
        message: { contains: submission.title },
      },
    });

    expect(notifications.length).toBeGreaterThan(0);
  });
});
```

### 6.3 E2E Tests (Playwright)

```typescript
// tests/e2e/story-publication.spec.ts

test('complete story publication workflow', async ({ page }) => {
  // 1. Writer creates story
  await page.goto('/dashboard/writer/submit-text');
  await page.fill('[name="title"]', 'Test Story');
  await page.fill('[name="content"]', 'Once upon a time...');
  await page.click('button:has-text("임시 저장")');

  await expect(page.locator('text=Draft')).toBeVisible();

  // 2. Writer submits for review
  await page.click('button:has-text("최종 제출")');
  await page.check('[type="checkbox"]'); // copyright
  await page.click('button:has-text("제출")');

  await expect(page.locator('text=Pending Review')).toBeVisible();

  // 3. Story Manager reviews
  await loginAs(page, 'story_manager@test.com');
  await page.goto('/dashboard/story-manager/review');
  await page.click('text=Test Story');
  await page.click('button:has-text("승인")');

  // 4. Content Admin publishes
  await loginAs(page, 'content_admin@test.com');
  await page.goto('/dashboard/content-admin/review');
  await page.click('text=Test Story');
  await page.click('button:has-text("출판")');

  await expect(page.locator('text=Published')).toBeVisible();
});
```

---

## 📈 Performance Considerations

### 7.1 Database Optimization

```typescript
// Index TextSubmission table for common queries
model TextSubmission {
  // ...existing fields...

  @@index([status])           // For filtering by status
  @@index([authorId])         // For writer's submissions
  @@index([storyManagerId])   // For reviewer's queue
  @@index([createdAt])        // For sorting
  @@index([status, priority]) // Composite for admin queue
}
```

### 7.2 Caching Strategy

```typescript
// Cache user roles for authorization checks
import { redis } from '@/lib/redis';

async function getUserRole(userId: string): Promise<UserRole> {
  const cached = await redis.get(`user:${userId}:role`);
  if (cached) return cached as UserRole;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  await redis.set(`user:${userId}:role`, user.role, { ex: 3600 }); // 1 hour
  return user.role;
}
```

### 7.3 Background Jobs

```typescript
// Use BullMQ for async processing
import { Queue, Worker } from 'bullmq';

const aiReviewQueue = new Queue('ai-review', {
  connection: { host: 'localhost', port: 6379 },
});

// Producer: Enqueue AI review job
export async function queueAIReview(reviewId: string, content: string) {
  await aiReviewQueue.add('process-review', {
    reviewId,
    content,
  });
}

// Consumer: Process AI review
const worker = new Worker('ai-review', async (job) => {
  const { reviewId, content } = job.data;
  await processAIReview(reviewId, content);
}, {
  connection: { host: 'localhost', port: 6379 },
});
```

---

## ✅ Implementation Checklist

### Core Functionality
- [ ] TextSubmission state machine implemented
- [ ] All workflow action functions created
- [ ] API endpoints for submission CRUD
- [ ] API endpoints for workflow actions (submit, approve, etc.)
- [ ] WorkflowHistory logging for all transitions

### AI Review System
- [ ] AI review request endpoint
- [ ] Background job processing
- [ ] OpenAI API integration
- [ ] Result polling endpoint
- [ ] Error handling and retries

### Notification System
- [ ] Email templates created
- [ ] EmailService integration
- [ ] Push notification system
- [ ] Notification triggers for all events
- [ ] Notification settings (user preferences)

### Testing
- [ ] Unit tests for state transitions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for complete workflow
- [ ] Load testing for AI review queue

### Deployment
- [ ] Database migrations
- [ ] Environment variables configured
- [ ] Redis/background job setup
- [ ] Monitoring and logging

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Owner**: Backend Team
**Status**: Ready for Implementation
