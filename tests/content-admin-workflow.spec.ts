import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-helpers';
import {
  contentAdminPublish,
  contentAdminReject,
  verifySubmissionStatus,
  verifyWorkflowHistory,
  getSubmissionDetails,
} from './helpers/workflow-helpers';
import {
  seedSubmissionWithStatus,
  getTestUserIdByRole,
  cleanupTestSubmissions,
} from './helpers/test-data-helpers';

test.describe('Phase 4: CONTENT_ADMIN Workflow Tests', () => {
  let authorId: string;
  let contentAdminId: string;

  test.beforeAll(async () => {
    authorId = (await getTestUserIdByRole('WRITER'))!;
    contentAdminId = (await getTestUserIdByRole('CONTENT_ADMIN'))!;
  });

  test.afterAll(async () => {
    await cleanupTestSubmissions(authorId);
  });

  test('Final approve - Publish', async ({ page }) => {
    console.log('\n=== TEST: Final Approve - Publish ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story Publish ${Date.now()}`,
      authorId,
      'CONTENT_REVIEW',
      { contentAdminId }
    );

    await loginAs(page, 'contentAdmin');

    const response = await contentAdminPublish(page, submission.id, 'Approved for publication');
    expect(response.ok()).toBe(true);

    const statusValid = await verifySubmissionStatus(page, submission.id, 'PUBLISHED');
    expect(statusValid).toBe(true);

    const historyValid = await verifyWorkflowHistory(
      page,
      submission.id,
      'CONTENT_REVIEW',
      'PUBLISHED'
    );
    expect(historyValid).toBe(true);

    const details = await getSubmissionDetails(page, submission.id);
    expect(details?.status).toBe('PUBLISHED');
    expect(details?.publishedAt).toBeTruthy();

    console.log('✅ Final approve - Publish completed');
  });

  test('Final approve with Notes', async ({ page }) => {
    console.log('\n=== TEST: Final Approve with Notes ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story with Notes ${Date.now()}`,
      authorId,
      'CONTENT_REVIEW',
      { contentAdminId }
    );

    await loginAs(page, 'contentAdmin');

    const notes = 'Excellent story. Ready for immediate publication.';
    const response = await contentAdminPublish(page, submission.id, notes);
    expect(response.ok()).toBe(true);

    const statusValid = await verifySubmissionStatus(page, submission.id, 'PUBLISHED');
    expect(statusValid).toBe(true);

    console.log('✅ Final approve with notes completed');
  });

  test('Reject at Final Stage', async ({ page }) => {
    console.log('\n=== TEST: Reject at Final Stage ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story Reject ${Date.now()}`,
      authorId,
      'CONTENT_REVIEW',
      { contentAdminId }
    );

    await loginAs(page, 'contentAdmin');

    const reason = 'Content does not meet final quality standards';
    const response = await contentAdminReject(page, submission.id, reason);
    expect(response.ok()).toBe(true);

    const statusValid = await verifySubmissionStatus(page, submission.id, 'REJECTED');
    expect(statusValid).toBe(true);

    const historyValid = await verifyWorkflowHistory(
      page,
      submission.id,
      'CONTENT_REVIEW',
      'REJECTED'
    );
    expect(historyValid).toBe(true);

    console.log('✅ Reject at final stage completed');
  });

  test('Final approve - Error on wrong status', async ({ page }) => {
    console.log('\n=== TEST: Final Approve - Wrong Status ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story Wrong Status ${Date.now()}`,
      authorId,
      'PENDING',
      { contentAdminId }
    );

    await loginAs(page, 'contentAdmin');

    const response = await contentAdminPublish(page, submission.id);
    expect(response.ok()).toBe(false);

    const statusUnchanged = await verifySubmissionStatus(page, submission.id, 'PENDING');
    expect(statusUnchanged).toBe(true);

    console.log('✅ Final approve - Error handling verified');
  });
});
