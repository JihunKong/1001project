# Test Helpers Documentation

This directory contains reusable helper functions for Playwright E2E tests in the 1001 Stories project.

## Files Overview

### 1. `workflow-helpers.ts`
Helper functions for testing workflow actions, UI interactions, and verifications.

**API Call Helpers (7 functions):**
- `performWorkflowAction()` - Execute any workflow action via API
- `storyManagerApprove()` - STORY_MANAGER approves submission
- `storyManagerRequestRevision()` - STORY_MANAGER requests revision
- `storyManagerReject()` - STORY_MANAGER rejects submission
- `bookManagerDecideFormat()` - BOOK_MANAGER decides publication format
- `contentAdminPublish()` - CONTENT_ADMIN publishes submission
- `contentAdminReject()` - CONTENT_ADMIN rejects submission

**UI Interaction Helpers (6 functions):**
- `navigateToStoryReview()` - Navigate to STORY_MANAGER review page
- `navigateToFormatDecision()` - Navigate to BOOK_MANAGER format decision page
- `navigateToFinalReview()` - Navigate to CONTENT_ADMIN final review page
- `findSubmissionInQueue()` - Find submission by title/ID in dashboard queue
- `extractSubmissionId()` - Extract submission ID from URL or element
- `selectFormatAndSubmit()` - Select format option (TEXT/BOOK/COLLECTION) and submit

**Verification Helpers (5 functions):**
- `verifySubmissionStatus()` - Verify submission has expected status
- `verifyWorkflowHistory()` - Verify workflow history entry exists
- `verifyNotificationSent()` - Verify notification was sent to user
- `getSubmissionDetails()` - Fetch submission details via API
- `getWorkflowHistory()` - Fetch workflow history via API

### 2. `test-data-helpers.ts`
Helper functions for creating and managing test data using Prisma.

**Test Data Functions (8 functions):**
- `createTestSubmission()` - Create a test submission with specified options
- `updateSubmissionStatus()` - Directly update submission status in database
- `cleanupTestSubmissions()` - Delete test submissions (by author or title pattern)
- `seedSubmissionWithStatus()` - Create submission with specific status and workflow history
- `createWorkflowHistory()` - Create workflow history entry
- `getTestUserIdByRole()` - Find test user ID by role name
- `cleanupWorkflowHistory()` - Delete workflow history entries
- `getSubmissionsByStatus()` - Fetch submissions by status
- `disconnectPrisma()` - Disconnect Prisma client

### 3. `auth-helpers.ts`
Helper functions for authentication and user management in tests.

**Authentication Functions (9 functions):**
- `loginWithPassword()` - Log in with email/password
- `loginAs()` - Log in as specific test role (learner, writer, etc.)
- `logoutUser()` - Log out current user
- `switchUserContext()` - Switch to different user in new browser context
- `getAuthCookie()` - Get authentication cookie value
- `isAuthenticated()` - Check if user is authenticated
- `waitForDashboardLoad()` - Wait for role-specific dashboard to load
- `ensureLoggedIn()` - Ensure user is logged in, login if not
- `verifyUserRole()` - Verify current user has expected role

**Test Accounts:**
- `TEST_ACCOUNTS` constant with all 8 test roles (LEARNER, TEACHER, WRITER, INSTITUTION, STORY_MANAGER, BOOK_MANAGER, CONTENT_ADMIN, ADMIN)

---

## Usage Examples

### Example 1: STORY_MANAGER Workflow Test

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-helpers';
import {
  storyManagerApprove,
  verifySubmissionStatus,
  verifyWorkflowHistory,
} from './helpers/workflow-helpers';
import { seedSubmissionWithStatus, getTestUserIdByRole } from './helpers/test-data-helpers';

test('STORY_MANAGER can approve submission', async ({ page }) => {
  // 1. Create test data
  const authorId = await getTestUserIdByRole('WRITER');
  const storyManagerId = await getTestUserIdByRole('STORY_MANAGER');
  const submission = await seedSubmissionWithStatus(
    'Test Story for Approval',
    authorId!,
    'PENDING',
    { storyManagerId }
  );

  // 2. Login as STORY_MANAGER
  await loginAs(page, 'storyManager');

  // 3. Approve submission via API
  const response = await storyManagerApprove(page, submission.id, 'Great work!');
  expect(response.ok()).toBe(true);

  // 4. Verify status changed
  const statusValid = await verifySubmissionStatus(page, submission.id, 'STORY_APPROVED');
  expect(statusValid).toBe(true);

  // 5. Verify workflow history
  const historyValid = await verifyWorkflowHistory(
    page,
    submission.id,
    'PENDING',
    'STORY_APPROVED'
  );
  expect(historyValid).toBe(true);
});
```

### Example 2: BOOK_MANAGER Format Decision Test

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-helpers';
import {
  navigateToFormatDecision,
  bookManagerDecideFormat,
  verifySubmissionStatus,
} from './helpers/workflow-helpers';
import { seedSubmissionWithStatus, getTestUserIdByRole } from './helpers/test-data-helpers';

test('BOOK_MANAGER can decide format', async ({ page }) => {
  // 1. Create submission with STORY_APPROVED status
  const authorId = await getTestUserIdByRole('WRITER');
  const bookManagerId = await getTestUserIdByRole('BOOK_MANAGER');
  const submission = await seedSubmissionWithStatus(
    'Test Story for Format Decision',
    authorId!,
    'STORY_APPROVED',
    { bookManagerId }
  );

  // 2. Login as BOOK_MANAGER
  await loginAs(page, 'bookManager');

  // 3. Navigate to format decision page
  await navigateToFormatDecision(page, submission.id);

  // 4. Decide format via API
  const response = await bookManagerDecideFormat(page, submission.id, 'TEXT');
  expect(response.ok()).toBe(true);

  // 5. Verify status changed to CONTENT_REVIEW
  const statusValid = await verifySubmissionStatus(page, submission.id, 'CONTENT_REVIEW');
  expect(statusValid).toBe(true);
});
```

### Example 3: Complete E2E Workflow Test

```typescript
import { test, expect, Browser } from '@playwright/test';
import { loginAs } from './helpers/auth-helpers';
import {
  storyManagerApprove,
  bookManagerDecideFormat,
  contentAdminPublish,
  verifySubmissionStatus,
  getWorkflowHistory,
} from './helpers/workflow-helpers';
import {
  createTestSubmission,
  getTestUserIdByRole,
  cleanupTestSubmissions,
} from './helpers/test-data-helpers';

test('Complete E2E workflow: DRAFT → PUBLISHED', async ({ browser }) => {
  // 1. WRITER creates and submits
  const writerContext = await browser.newContext();
  const writerPage = await writerContext.newPage();
  await loginAs(writerPage, 'writer');

  const authorId = await getTestUserIdByRole('WRITER');
  const submission = await createTestSubmission({
    title: 'Test E2E Story',
    content: 'This is a test story for complete E2E workflow testing.',
    authorId: authorId!,
    status: 'PENDING',
  });

  // 2. STORY_MANAGER approves
  const smContext = await browser.newContext();
  const smPage = await smContext.newPage();
  await loginAs(smPage, 'storyManager');
  await storyManagerApprove(smPage, submission.id);
  expect(await verifySubmissionStatus(smPage, submission.id, 'STORY_APPROVED')).toBe(true);

  // 3. BOOK_MANAGER decides format
  const bmContext = await browser.newContext();
  const bmPage = await bmContext.newPage();
  await loginAs(bmPage, 'bookManager');
  await bookManagerDecideFormat(bmPage, submission.id, 'TEXT');
  expect(await verifySubmissionStatus(bmPage, submission.id, 'CONTENT_REVIEW')).toBe(true);

  // 4. CONTENT_ADMIN publishes
  const caContext = await browser.newContext();
  const caPage = await caContext.newPage();
  await loginAs(caPage, 'contentAdmin');
  await contentAdminPublish(caPage, submission.id);
  expect(await verifySubmissionStatus(caPage, submission.id, 'PUBLISHED')).toBe(true);

  // 5. Verify complete workflow history
  const history = await getWorkflowHistory(caPage, submission.id);
  expect(history.length).toBeGreaterThanOrEqual(4);

  // 6. Cleanup
  await cleanupTestSubmissions(authorId!);
});
```

### Example 4: Using Test Data Helpers

```typescript
import { test, expect } from '@playwright/test';
import {
  seedSubmissionWithStatus,
  getTestUserIdByRole,
  cleanupTestSubmissions,
  getSubmissionsByStatus,
} from './helpers/test-data-helpers';

test.beforeAll(async () => {
  // Seed multiple submissions with different statuses
  const authorId = await getTestUserIdByRole('WRITER');
  const storyManagerId = await getTestUserIdByRole('STORY_MANAGER');

  await seedSubmissionWithStatus('Pending Story 1', authorId!, 'PENDING', { storyManagerId });
  await seedSubmissionWithStatus('Pending Story 2', authorId!, 'PENDING', { storyManagerId });
  await seedSubmissionWithStatus('Approved Story', authorId!, 'STORY_APPROVED', { storyManagerId });
});

test('STORY_MANAGER can see pending submissions', async ({ page }) => {
  const pendingSubmissions = await getSubmissionsByStatus('PENDING');
  expect(pendingSubmissions.length).toBeGreaterThanOrEqual(2);
});

test.afterAll(async () => {
  // Cleanup all test submissions
  await cleanupTestSubmissions();
});
```

---

## Type Definitions

### `TextSubmissionStatus`
```typescript
type TextSubmissionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'STORY_REVIEW'
  | 'STORY_APPROVED'
  | 'FORMAT_REVIEW'
  | 'CONTENT_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'NEEDS_REVISION';
```

### `FormatDecision`
```typescript
type FormatDecision = 'TEXT' | 'BOOK' | 'COLLECTION';
```

### `WorkflowAction`
```typescript
type WorkflowAction =
  | 'submit'
  | 'withdraw'
  | 'assign_story_manager'
  | 'story_approve'
  | 'story_needs_revision'
  | 'assign_book_manager'
  | 'format_decision'
  | 'final_approve'
  | 'reject';
```

---

## Workflow Status Transitions

```
DRAFT (Writer creates)
  ↓ [submit]
PENDING (Writer submits)
  ↓ [assign_story_manager]
STORY_REVIEW (Story Manager reviews)
  ↓ [story_approve]
STORY_APPROVED
  ↓ [assign_book_manager]
FORMAT_REVIEW
  ↓ [format_decision]
CONTENT_REVIEW
  ↓ [final_approve]
PUBLISHED ✓

Alternative paths:
- PENDING → NEEDS_REVISION → PENDING (revision cycle)
- Any stage → REJECTED (rejection)
```

---

## Best Practices

1. **Always cleanup test data after tests:**
   ```typescript
   test.afterEach(async () => {
     await cleanupTestSubmissions();
   });
   ```

2. **Use seedSubmissionWithStatus for complex setups:**
   - Automatically creates workflow history
   - Sets correct relationships (storyManagerId, etc.)
   - Saves time vs manual API calls

3. **Prefer API helpers over UI interactions when possible:**
   - Faster execution
   - More reliable
   - Better for setup/verification

4. **Use UI helpers for actual user flow testing:**
   - Tests real user experience
   - Catches UI bugs
   - Required for Phase 3-6 tests

5. **Always verify workflow history after status changes:**
   ```typescript
   await storyManagerApprove(page, submissionId);
   expect(await verifyWorkflowHistory(page, submissionId, 'PENDING', 'STORY_APPROVED')).toBe(true);
   ```

---

## Notes

- All helpers use console.log for debugging output with emojis (🔐, ✅, ❌, etc.)
- Helpers are designed to be composable and reusable across tests
- API helpers use `page.request` for authenticated API calls
- Test data helpers use Prisma for direct database access
- Auth helpers handle NextAuth cookie-based authentication

---

## Contributing

When adding new helpers:
1. Follow existing naming conventions
2. Add console.log statements for debugging
3. Export all functions at the end of file
4. Update this README with usage examples
5. Add TypeScript types for all parameters and return values
