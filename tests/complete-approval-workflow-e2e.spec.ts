import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-helpers';
import {
  performWorkflowAction,
  storyManagerApprove,
  bookManagerDecideFormat,
  contentAdminPublish,
  storyManagerReject,
  verifySubmissionStatus,
  getWorkflowHistory,
} from './helpers/workflow-helpers';
import {
  createTestSubmission,
  getTestUserIdByRole,
  cleanupTestSubmissions,
} from './helpers/test-data-helpers';

test.describe('Phase 5: Complete E2E Workflow Tests', () => {
  let authorId: string;
  let storyManagerId: string;
  let bookManagerId: string;
  let contentAdminId: string;

  test.beforeAll(async () => {
    authorId = (await getTestUserIdByRole('WRITER'))!;
    storyManagerId = (await getTestUserIdByRole('STORY_MANAGER'))!;
    bookManagerId = (await getTestUserIdByRole('BOOK_MANAGER'))!;
    contentAdminId = (await getTestUserIdByRole('CONTENT_ADMIN'))!;
  });

  test.afterAll(async () => {
    await cleanupTestSubmissions(authorId);
  });

  test('Happy path: DRAFT → PUBLISHED', async ({ page }) => {
    console.log('\n=== TEST: Happy Path E2E ===');

    const submission = await createTestSubmission({
      title: `E2E Test Story ${Date.now()}`,
      content: 'This is a complete end-to-end test story covering the full approval workflow from draft to published status.',
      authorId,
      status: 'DRAFT',
    });

    console.log(`Created submission: ${submission.id}`);

    await loginAs(page, 'writer');
    const submitResponse = await performWorkflowAction(page, submission.id, 'submit');
    expect(submitResponse.ok()).toBe(true);
    expect(await verifySubmissionStatus(page, submission.id, 'PENDING')).toBe(true);
    console.log('✅ Step 1: WRITER submitted');

    await loginAs(page, 'storyManager');
    const approveResponse = await storyManagerApprove(page, submission.id, 'Excellent story!');
    expect(approveResponse.ok()).toBe(true);
    expect(await verifySubmissionStatus(page, submission.id, 'STORY_APPROVED')).toBe(true);
    console.log('✅ Step 2: STORY_MANAGER approved');

    await loginAs(page, 'bookManager');
    const formatResponse = await bookManagerDecideFormat(page, submission.id, 'TEXT');
    expect(formatResponse.ok()).toBe(true);
    expect(await verifySubmissionStatus(page, submission.id, 'CONTENT_REVIEW')).toBe(true);
    console.log('✅ Step 3: BOOK_MANAGER decided format');

    await loginAs(page, 'contentAdmin');
    const publishResponse = await contentAdminPublish(page, submission.id);
    expect(publishResponse.ok()).toBe(true);
    expect(await verifySubmissionStatus(page, submission.id, 'PUBLISHED')).toBe(true);
    console.log('✅ Step 4: CONTENT_ADMIN published');

    const history = await getWorkflowHistory(page, submission.id);
    expect(history.length).toBeGreaterThanOrEqual(4);
    console.log(`✅ Workflow history verified: ${history.length} entries`);

    console.log('✅ Complete E2E workflow test PASSED');
  });

  test('Rejection at STORY_REVIEW stage', async ({ page }) => {
    console.log('\n=== TEST: Rejection at STORY_REVIEW ===');

    const submission = await createTestSubmission({
      title: `Rejection Test ${Date.now()}`,
      content: 'This story will be rejected at the initial review stage for testing purposes.',
      authorId,
      status: 'DRAFT',
    });

    await loginAs(page, 'writer');
    await performWorkflowAction(page, submission.id, 'submit');
    expect(await verifySubmissionStatus(page, submission.id, 'PENDING')).toBe(true);

    await loginAs(page, 'storyManager');
    const rejectResponse = await storyManagerReject(page, submission.id, 'Does not meet quality standards');
    expect(rejectResponse.ok()).toBe(true);
    expect(await verifySubmissionStatus(page, submission.id, 'REJECTED')).toBe(true);

    const history = await getWorkflowHistory(page, submission.id);
    const rejectionEntry = history.find(h => h.toStatus === 'REJECTED');
    expect(rejectionEntry).toBeTruthy();

    console.log('✅ Rejection workflow test PASSED');
  });

  test('Complete workflow with all metadata', async ({ page }) => {
    console.log('\n=== TEST: Complete Workflow with Metadata ===');

    const submission = await createTestSubmission({
      title: `Metadata Test Story ${Date.now()}`,
      content: 'This story tests the complete workflow with all possible metadata fields including feedback and notes.',
      authorId,
      status: 'DRAFT',
    });

    await loginAs(page, 'writer');
    await performWorkflowAction(page, submission.id, 'submit');

    await loginAs(page, 'storyManager');
    await storyManagerApprove(page, submission.id, 'Great narrative structure');

    await loginAs(page, 'bookManager');
    await bookManagerDecideFormat(page, submission.id, 'BOOK', 'Perfect for book format');

    await loginAs(page, 'contentAdmin');
    await contentAdminPublish(page, submission.id, 'Ready for immediate publication');

    expect(await verifySubmissionStatus(page, submission.id, 'PUBLISHED')).toBe(true);

    const history = await getWorkflowHistory(page, submission.id);
    expect(history.length).toBeGreaterThanOrEqual(4);

    console.log('✅ Metadata workflow test PASSED');
  });
});
