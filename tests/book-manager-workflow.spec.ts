import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-helpers';
import {
  bookManagerDecideFormat,
  verifySubmissionStatus,
  verifyWorkflowHistory,
  getSubmissionDetails,
} from './helpers/workflow-helpers';
import {
  seedSubmissionWithStatus,
  getTestUserIdByRole,
  cleanupTestSubmissions,
} from './helpers/test-data-helpers';

test.describe('Phase 3: BOOK_MANAGER Workflow Tests', () => {
  let authorId: string;
  let bookManagerId: string;

  test.beforeAll(async () => {
    authorId = (await getTestUserIdByRole('WRITER'))!;
    bookManagerId = (await getTestUserIdByRole('BOOK_MANAGER'))!;
  });

  test.afterAll(async () => {
    await cleanupTestSubmissions(authorId);
  });

  test('Format decision - TEXT option', async ({ page }) => {
    console.log('\n=== TEST: Format Decision - TEXT ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story TEXT ${Date.now()}`,
      authorId,
      'STORY_APPROVED',
      { bookManagerId }
    );

    await loginAs(page, 'bookManager');

    const response = await bookManagerDecideFormat(page, submission.id, 'TEXT', 'Perfect for standalone');
    expect(response.ok()).toBe(true);

    const statusValid = await verifySubmissionStatus(page, submission.id, 'CONTENT_REVIEW');
    expect(statusValid).toBe(true);

    const historyValid = await verifyWorkflowHistory(
      page,
      submission.id,
      'STORY_APPROVED',
      'CONTENT_REVIEW'
    );
    expect(historyValid).toBe(true);

    const details = await getSubmissionDetails(page, submission.id);
    expect(details?.status).toBe('CONTENT_REVIEW');

    console.log('✅ Format decision - TEXT completed');
  });

  test('Format decision - BOOK option', async ({ page }) => {
    console.log('\n=== TEST: Format Decision - BOOK ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story BOOK ${Date.now()}`,
      authorId,
      'STORY_APPROVED',
      { bookManagerId }
    );

    await loginAs(page, 'bookManager');

    const response = await bookManagerDecideFormat(page, submission.id, 'BOOK');
    expect(response.ok()).toBe(true);

    const statusValid = await verifySubmissionStatus(page, submission.id, 'CONTENT_REVIEW');
    expect(statusValid).toBe(true);

    console.log('✅ Format decision - BOOK completed');
  });

  test('Format decision - COLLECTION option', async ({ page }) => {
    console.log('\n=== TEST: Format Decision - COLLECTION ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story COLLECTION ${Date.now()}`,
      authorId,
      'STORY_APPROVED',
      { bookManagerId }
    );

    await loginAs(page, 'bookManager');

    const response = await bookManagerDecideFormat(page, submission.id, 'COLLECTION');
    expect(response.ok()).toBe(true);

    const statusValid = await verifySubmissionStatus(page, submission.id, 'CONTENT_REVIEW');
    expect(statusValid).toBe(true);

    console.log('✅ Format decision - COLLECTION completed');
  });

  test('Format decision - Error on wrong status', async ({ page }) => {
    console.log('\n=== TEST: Format Decision - Wrong Status ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story Wrong Status ${Date.now()}`,
      authorId,
      'PENDING',
      { bookManagerId }
    );

    await loginAs(page, 'bookManager');

    const response = await bookManagerDecideFormat(page, submission.id, 'TEXT');
    expect(response.ok()).toBe(false);

    const statusUnchanged = await verifySubmissionStatus(page, submission.id, 'PENDING');
    expect(statusUnchanged).toBe(true);

    console.log('✅ Format decision - Error handling verified');
  });

  test('Format decision with Notes', async ({ page }) => {
    console.log('\n=== TEST: Format Decision with Notes ===');

    const submission = await seedSubmissionWithStatus(
      `Test Story with Notes ${Date.now()}`,
      authorId,
      'STORY_APPROVED',
      { bookManagerId }
    );

    await loginAs(page, 'bookManager');

    const notes = 'This story has excellent narrative flow and will work well as a standalone text.';
    const response = await bookManagerDecideFormat(page, submission.id, 'TEXT', notes);
    expect(response.ok()).toBe(true);

    const statusValid = await verifySubmissionStatus(page, submission.id, 'CONTENT_REVIEW');
    expect(statusValid).toBe(true);

    console.log('✅ Format decision with notes completed');
  });
});
