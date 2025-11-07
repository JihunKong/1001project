import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-helpers';
import {
  performWorkflowAction,
  storyManagerRequestRevision,
  storyManagerApprove,
  verifySubmissionStatus,
  getWorkflowHistory,
} from './helpers/workflow-helpers';
import {
  createTestSubmission,
  updateSubmissionStatus,
  getTestUserIdByRole,
  cleanupTestSubmissions,
} from './helpers/test-data-helpers';

test.describe('Phase 6: Revision Workflow Tests', () => {
  let authorId: string;
  let storyManagerId: string;

  test.beforeAll(async () => {
    authorId = (await getTestUserIdByRole('WRITER'))!;
    storyManagerId = (await getTestUserIdByRole('STORY_MANAGER'))!;
  });

  test.afterAll(async () => {
    await cleanupTestSubmissions(authorId);
  });

  test('Single revision cycle', async ({ page }) => {
    console.log('\n=== TEST: Single Revision Cycle ===');

    const submission = await createTestSubmission({
      title: `Revision Test ${Date.now()}`,
      content: 'This story will go through a single revision cycle for testing purposes.',
      authorId,
      status: 'DRAFT',
    });

    await loginAs(page, 'writer');
    await performWorkflowAction(page, submission.id, 'submit');
    expect(await verifySubmissionStatus(page, submission.id, 'PENDING')).toBe(true);
    console.log('✅ Step 1: Submitted');

    await loginAs(page, 'storyManager');
    const revisionResponse = await storyManagerRequestRevision(
      page,
      submission.id,
      'Please revise chapter 3 and add more detail to the character development'
    );
    expect(revisionResponse.ok()).toBe(true);
    expect(await verifySubmissionStatus(page, submission.id, 'NEEDS_REVISION')).toBe(true);
    console.log('✅ Step 2: Revision requested');

    await updateSubmissionStatus(submission.id, 'PENDING');
    await loginAs(page, 'writer');
    const resubmitResponse = await performWorkflowAction(page, submission.id, 'submit');
    expect(resubmitResponse.ok()).toBe(true);
    expect(await verifySubmissionStatus(page, submission.id, 'PENDING')).toBe(true);
    console.log('✅ Step 3: Resubmitted');

    await loginAs(page, 'storyManager');
    await storyManagerApprove(page, submission.id);
    expect(await verifySubmissionStatus(page, submission.id, 'STORY_APPROVED')).toBe(true);
    console.log('✅ Step 4: Finally approved');

    const history = await getWorkflowHistory(page, submission.id);
    const revisionEntry = history.find(h => h.toStatus === 'NEEDS_REVISION');
    expect(revisionEntry).toBeTruthy();

    console.log('✅ Single revision cycle PASSED');
  });

  test('Revision with detailed feedback', async ({ page }) => {
    console.log('\n=== TEST: Revision with Detailed Feedback ===');

    const submission = await createTestSubmission({
      title: `Feedback Test ${Date.now()}`,
      content: 'This story tests the revision request with detailed feedback.',
      authorId,
      status: 'DRAFT',
    });

    await loginAs(page, 'writer');
    await performWorkflowAction(page, submission.id, 'submit');

    await loginAs(page, 'storyManager');
    const feedback = `Please address the following issues:
    1. The opening paragraph needs stronger hooks
    2. Character names should be more age-appropriate
    3. Add more descriptive language in scenes 4-6`;

    const response = await storyManagerRequestRevision(page, submission.id, feedback);
    expect(response.ok()).toBe(true);
    expect(await verifySubmissionStatus(page, submission.id, 'NEEDS_REVISION')).toBe(true);

    const history = await getWorkflowHistory(page, submission.id);
    const revisionEntry = history.find(h => h.toStatus === 'NEEDS_REVISION');
    expect(revisionEntry).toBeTruthy();

    console.log('✅ Detailed feedback revision PASSED');
  });

  test('Multiple revision cycles', async ({ page }) => {
    console.log('\n=== TEST: Multiple Revision Cycles ===');

    const submission = await createTestSubmission({
      title: `Multiple Revisions ${Date.now()}`,
      content: 'This story will go through multiple revision cycles.',
      authorId,
      status: 'DRAFT',
    });

    await loginAs(page, 'writer');
    await performWorkflowAction(page, submission.id, 'submit');
    console.log('✅ Initial submission');

    await loginAs(page, 'storyManager');
    await storyManagerRequestRevision(page, submission.id, 'First revision request');
    expect(await verifySubmissionStatus(page, submission.id, 'NEEDS_REVISION')).toBe(true);
    console.log('✅ First revision requested');

    await updateSubmissionStatus(submission.id, 'PENDING');
    await loginAs(page, 'writer');
    await performWorkflowAction(page, submission.id, 'submit');
    console.log('✅ First resubmission');

    await loginAs(page, 'storyManager');
    await storyManagerRequestRevision(page, submission.id, 'Second revision request');
    expect(await verifySubmissionStatus(page, submission.id, 'NEEDS_REVISION')).toBe(true);
    console.log('✅ Second revision requested');

    await updateSubmissionStatus(submission.id, 'PENDING');
    await loginAs(page, 'writer');
    await performWorkflowAction(page, submission.id, 'submit');
    console.log('✅ Second resubmission');

    await loginAs(page, 'storyManager');
    await storyManagerApprove(page, submission.id);
    expect(await verifySubmissionStatus(page, submission.id, 'STORY_APPROVED')).toBe(true);
    console.log('✅ Finally approved after multiple revisions');

    const history = await getWorkflowHistory(page, submission.id);
    const revisionEntries = history.filter(h => h.toStatus === 'NEEDS_REVISION');
    expect(revisionEntries.length).toBeGreaterThanOrEqual(2);

    console.log('✅ Multiple revision cycles PASSED');
  });
});
