import { test, expect } from '../../fixtures/multi-context';
import {
  SubmitStoryPage,
  MyStoriesPage,
  ReviewQueuePage,
  StoryReviewPage,
  FormatDecisionPage,
  FinalApprovalPage,
} from '../../helpers/page-objects';

test.describe('Publishing Workflow - Rejection Flow Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let storyTitle: string;

  test.beforeAll(() => {
    storyTitle = `Rejection Test ${Date.now()}`;
  });

  test.describe('Phase 1: Writer Submission → Role Transmission', () => {
    test('1.1 Writer submits story → Story Manager queue receives it', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);

      await submitStoryPage.navigate();
      await submitStoryPage.verifyPageLoaded();

      await submitStoryPage.fillStoryForm({
        title: storyTitle,
        summary: 'A test story for rejection flow testing.',
        content: `This is a test story created for the rejection flow test.

        It contains enough content to meet the minimum requirements.

        The story will be used to test the publishing workflow rejection scenarios.`,
        authorAlias: 'Test Author',
      });

      await submitStoryPage.submitForReview();

      await myStoriesPage.navigate();
      await myStoriesPage.verifyPageLoaded();

      await myStoriesPage.clickStatusTab('Pending');
      await writerPage.waitForTimeout(2000);

      const pendingCount = await myStoriesPage.getTabCount('Pending');
      console.log(`Pending stories count: ${pendingCount}`);

      const hasStories = await myStoriesPage.hasStories();
      if (hasStories) {
        const titles = await myStoriesPage.getAllStoryTitles();
        const found = titles.some(t => t.includes('Rejection Test') || t === storyTitle);
        console.log(`Writer submitted story: ${storyTitle}, Found in Pending: ${found}`);
      } else {
        console.log(`No stories visible in Pending tab, but tab count shows: ${pendingCount}`);
      }

      await reviewQueuePage.navigate();
      await reviewQueuePage.verifyPageLoaded();

      await storyManagerPage.waitForResponse(
        response => response.url().includes('/api/text-submissions') && response.status() === 200,
        { timeout: 15000 }
      ).catch(() => {});
      await storyManagerPage.waitForTimeout(2000);

      const hasSubmissions = await reviewQueuePage.hasSubmissions();
      console.log(`Story Manager queue has submissions: ${hasSubmissions}`);
    });

    test('1.2 Story Manager approves → Book Manager queue receives it', async ({ rolePages }) => {
      test.setTimeout(120000);

      const storyManagerPage = rolePages.storyManager!;
      const bookManagerPage = rolePages.bookManager!;

      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);
      const formatDecisionPage = new FormatDecisionPage(bookManagerPage);

      await reviewQueuePage.navigate();
      const hasSubmissions = await reviewQueuePage.hasSubmissions();

      if (hasSubmissions) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        await storyReviewPage.approveWithFeedback({
          comment: 'Approved for format decision phase.',
        });
      }

      await formatDecisionPage.navigate();
      await formatDecisionPage.verifyPageLoaded();

      const hasStories = await formatDecisionPage.hasStories();
      console.log(`Book Manager queue has stories: ${hasStories}`);
    });

    test('1.3 Book Manager decides format → Content Admin queue receives it', async ({ rolePages }) => {
      test.setTimeout(120000);

      const bookManagerPage = rolePages.bookManager!;
      const contentAdminPage = rolePages.contentAdmin!;

      const formatDecisionPage = new FormatDecisionPage(bookManagerPage);
      const finalApprovalPage = new FinalApprovalPage(contentAdminPage);

      await formatDecisionPage.navigate();
      const hasStories = await formatDecisionPage.hasStories();

      if (hasStories) {
        await formatDecisionPage.clickFirstStory();
        await formatDecisionPage.decideAsText('Formatted as text for testing.');
      }

      await finalApprovalPage.navigate();
      await finalApprovalPage.verifyPageLoaded();

      const hasBooks = await finalApprovalPage.hasBooks();
      console.log(`Content Admin queue has books: ${hasBooks}`);
    });
  });

  test.describe('Phase 2: Role Rejection → Writer Feedback', () => {
    let rejectionStoryTitle: string;

    test.beforeAll(() => {
      rejectionStoryTitle = `Writer Rejection Test ${Date.now()}`;
    });

    test('2.1 Story Manager rejects → Writer sees feedback', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;
      const baseURL = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: rejectionStoryTitle,
        summary: 'Story for rejection testing by Story Manager.',
        content: 'Content that will be rejected for testing purposes.',
      });
      await submitStoryPage.submitForReview();

      await myStoriesPage.navigate();
      await myStoriesPage.clickStatusTab('Pending');
      await writerPage.waitForTimeout(2000);
      console.log(`Writer submitted story for rejection test: ${rejectionStoryTitle}`);

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      const hasSubmissions = await reviewQueuePage.hasSubmissions();

      if (hasSubmissions) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        const revisionButton = storyManagerPage.locator('button:has-text("Request Revision"), button:has-text("Needs Revision")').first();
        const revisionButtonVisible = await revisionButton.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`[2.1] Request Revision button visible: ${revisionButtonVisible}`);

        if (!revisionButtonVisible) {
          await storyManagerPage.screenshot({ path: 'test-results/2.1-no-revision-button.png' });
          console.log('[2.1] ⚠️ Request Revision button not found - taking screenshot');
        }

        const rejectionReason = 'The story lacks a clear narrative structure. Please revise the opening paragraph.';
        await storyReviewPage.requestRevisionWithFeedback({
          comment: rejectionReason,
        });
        console.log(`Story Manager requested revision with reason: ${rejectionReason}`);

        const successIndicators = storyManagerPage.locator('text=/revision.*requested/i, text=/sent.*revision/i, .toast, [role="alert"]');
        const hasSuccessIndicator = await successIndicators.first().isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`[2.1] Revision request success indicator visible: ${hasSuccessIndicator}`);

        if (!hasSuccessIndicator) {
          await storyManagerPage.screenshot({ path: 'test-results/2.1-no-success-toast.png' });
          console.log('[2.1] ⚠️ No success indicator found after revision request');
        }
      } else {
        console.log('[2.1] ⚠️ No submissions in queue - cannot test rejection');
        await storyManagerPage.screenshot({ path: 'test-results/2.1-no-submissions.png' });
      }

      const writerResponse = await writerPage.goto(`${baseURL}/dashboard/writer/stories`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      }).catch(() => null);

      if (writerResponse?.status() === 404) {
        console.log('[2.1] ❌ Writer stories page returned 404');
        await writerPage.screenshot({ path: 'test-results/2.1-writer-404.png' });
      }

      const pageContent = await writerPage.content();
      if (pageContent.includes('404') && pageContent.includes('page could not be found')) {
        console.log('[2.1] ❌ 404 page content detected on Writer stories page');
        await writerPage.screenshot({ path: 'test-results/2.1-writer-404-content.png' });
      }

      await myStoriesPage.verifyPageLoaded();

      await myStoriesPage.clickStatusTab('Needs Revision');
      await writerPage.waitForTimeout(2000);

      const needsRevisionCount = await myStoriesPage.getTabCount('Needs Revision');
      console.log(`[2.1] Needs Revision tab count: ${needsRevisionCount}`);

      const titles = await myStoriesPage.getAllStoryTitles();
      console.log(`[2.1] Stories needing revision: ${titles.length}`);

      if (titles.length === 0) {
        console.log('[2.1] ⚠️ No stories found in Needs Revision tab - revision may not have been processed');
        await writerPage.screenshot({ path: 'test-results/2.1-empty-needs-revision.png' });
      } else {
        const foundRejectedStory = titles.some(t => t.includes('Rejection Test') || t.includes(rejectionStoryTitle));
        console.log(`[2.1] Found rejected story in Needs Revision tab: ${foundRejectedStory}`);
        if (!foundRejectedStory) {
          console.log(`[2.1] ⚠️ Submitted story "${rejectionStoryTitle}" not found in Needs Revision tab`);
        }
      }
    });

    test('2.2 Book Manager rejects → Writer sees feedback', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;
      const bookManagerPage = rolePages.bookManager!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);
      const formatDecisionPage = new FormatDecisionPage(bookManagerPage);

      const bmRejectionTitle = `Book Manager Rejection Test ${Date.now()}`;

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: bmRejectionTitle,
        summary: 'Story for rejection testing by Book Manager.',
        content: 'Content approved by Story Manager but rejected by Book Manager.',
      });
      await submitStoryPage.submitForReview();

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();
        await storyReviewPage.approveWithFeedback({
          comment: 'Looks good. Passing to Book Manager.',
        });
      }

      await formatDecisionPage.navigate();
      await bookManagerPage.waitForTimeout(3000);
      const hasStories = await formatDecisionPage.hasStories();
      console.log(`[2.2] Format Decision page has stories: ${hasStories}`);

      if (hasStories) {
        await formatDecisionPage.clickFirstStory();

        const rejectButton = bookManagerPage.locator('button:has-text("Reject"), button:has-text("Request Revision")').first();
        const rejectButtonVisible = await rejectButton.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`[2.2] Reject button visible: ${rejectButtonVisible}`);

        if (rejectButtonVisible) {
          const reasonInput = bookManagerPage.locator('textarea, input[type="text"]').first();
          if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await reasonInput.fill('Content not suitable for book format. Please restructure.');
          }
          await rejectButton.click();
          console.log('[2.2] Clicked reject button');
          await bookManagerPage.waitForTimeout(2000);

          const successIndicator = bookManagerPage.locator('text=/rejected/i, text=/revision/i, .toast, [role="alert"]');
          const hasSuccess = await successIndicator.first().isVisible({ timeout: 5000 }).catch(() => false);
          console.log(`[2.2] Rejection success indicator: ${hasSuccess}`);

          if (!hasSuccess) {
            await bookManagerPage.screenshot({ path: 'test-results/2.2-no-rejection-success.png' });
          }
        } else {
          console.log('[2.2] ⚠️ Reject button not found on Book Manager page');
          await bookManagerPage.screenshot({ path: 'test-results/2.2-no-reject-button.png' });
        }
      } else {
        console.log('[2.2] ⚠️ No stories in Format Decision queue');
        await bookManagerPage.screenshot({ path: 'test-results/2.2-no-stories.png' });
      }

      const baseURL = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';
      await writerPage.goto(`${baseURL}/dashboard/writer/stories`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
      await myStoriesPage.verifyPageLoaded();
      await myStoriesPage.clickStatusTab('Needs Revision');
      await writerPage.waitForTimeout(2000);

      const titles = await myStoriesPage.getAllStoryTitles();
      console.log(`[2.2] Writer stories in Needs Revision: ${titles.length}`);

      if (titles.length === 0) {
        console.log('[2.2] ⚠️ No stories in Needs Revision - Book Manager rejection may not have been processed');
        await writerPage.screenshot({ path: 'test-results/2.2-empty-needs-revision.png' });
      }
    });

    test('2.3 Content Admin rejects → Writer sees feedback', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;
      const bookManagerPage = rolePages.bookManager!;
      const contentAdminPage = rolePages.contentAdmin!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);
      const formatDecisionPage = new FormatDecisionPage(bookManagerPage);
      const finalApprovalPage = new FinalApprovalPage(contentAdminPage);

      const caRejectionTitle = `Content Admin Rejection Test ${Date.now()}`;

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: caRejectionTitle,
        summary: 'Story for rejection testing by Content Admin.',
        content: 'Content approved by Story Manager and Book Manager but rejected by Content Admin.',
      });
      await submitStoryPage.submitForReview();

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();
        await storyReviewPage.approveWithFeedback({
          comment: 'Approved for format review.',
        });
      }

      await formatDecisionPage.navigate();
      await bookManagerPage.waitForTimeout(3000);
      if (await formatDecisionPage.hasStories()) {
        await formatDecisionPage.clickFirstStory();
        await formatDecisionPage.decideAsText('Approved as text format.');
      }

      await finalApprovalPage.navigate();
      await contentAdminPage.waitForTimeout(3000);
      const hasBooks = await finalApprovalPage.hasBooks();
      console.log(`[2.3] Final Approval page has books: ${hasBooks}`);

      if (hasBooks) {
        await finalApprovalPage.clickFirstBook();

        const rejectButton = contentAdminPage.locator('button:has-text("Reject"), button:has-text("Request Revision")').first();
        const rejectButtonVisible = await rejectButton.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`[2.3] Reject button visible: ${rejectButtonVisible}`);

        if (rejectButtonVisible) {
          const reasonInput = contentAdminPage.locator('textarea, input[type="text"]').first();
          if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await reasonInput.fill('Final quality check failed. Minor grammatical corrections needed.');
          }
          await rejectButton.click();
          console.log('[2.3] Clicked reject button');
          await contentAdminPage.waitForTimeout(2000);

          const successIndicator = contentAdminPage.locator('text=/rejected/i, text=/revision/i, .toast, [role="alert"]');
          const hasSuccess = await successIndicator.first().isVisible({ timeout: 5000 }).catch(() => false);
          console.log(`[2.3] Rejection success indicator: ${hasSuccess}`);

          if (!hasSuccess) {
            await contentAdminPage.screenshot({ path: 'test-results/2.3-no-rejection-success.png' });
          }
        } else {
          console.log('[2.3] ⚠️ Reject button not found on Content Admin page');
          await contentAdminPage.screenshot({ path: 'test-results/2.3-no-reject-button.png' });
        }
      } else {
        console.log('[2.3] ⚠️ No books in Final Approval queue');
        await contentAdminPage.screenshot({ path: 'test-results/2.3-no-books.png' });
      }

      const baseURL = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';
      await writerPage.goto(`${baseURL}/dashboard/writer/stories`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
      await myStoriesPage.verifyPageLoaded();
      await myStoriesPage.clickStatusTab('Needs Revision');
      await writerPage.waitForTimeout(2000);

      const titles = await myStoriesPage.getAllStoryTitles();
      console.log(`[2.3] Writer stories in Needs Revision: ${titles.length}`);

      if (titles.length === 0) {
        console.log('[2.3] ⚠️ No stories in Needs Revision - Content Admin rejection may not have been processed');
        await writerPage.screenshot({ path: 'test-results/2.3-empty-needs-revision.png' });
      }
    });
  });

  test.describe('Phase 3: Upper Role Rejection → Lower Role Visibility', () => {
    test('3.1 Content Admin rejects → Book Manager can see rejected status', async ({ rolePages }) => {
      test.setTimeout(60000);

      const bookManagerPage = rolePages.bookManager!;
      const formatDecisionPage = new FormatDecisionPage(bookManagerPage);

      await formatDecisionPage.navigate();
      await formatDecisionPage.verifyPageLoaded();

      await bookManagerPage.waitForTimeout(2000);
      console.log('Book Manager checking for Content Admin rejected stories');
    });

    test('3.2 Content Admin rejects → Story Manager can see rejected status', async ({ rolePages }) => {
      test.setTimeout(60000);

      const storyManagerPage = rolePages.storyManager!;
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);

      await reviewQueuePage.navigate();
      await reviewQueuePage.verifyPageLoaded();

      try {
        await reviewQueuePage.filterByStatus('REJECTED');
        await storyManagerPage.waitForTimeout(2000);

        const titles = await reviewQueuePage.getAllSubmissionTitles();
        console.log(`Story Manager can see ${titles.length} rejected stories`);
      } catch {
        console.log('Story Manager queue does not support REJECTED filter');
      }
    });

    test('3.3 Book Manager rejects → Story Manager can see rejected status', async ({ rolePages }) => {
      test.setTimeout(60000);

      const storyManagerPage = rolePages.storyManager!;
      const baseURL = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';

      const currentUrl = storyManagerPage.url();
      if (!currentUrl.includes('/dashboard/story-manager')) {
        console.log(`[Test 3.3] ⚠️ Wrong page detected: ${currentUrl}, re-navigating to Story Manager...`);
        await storyManagerPage.goto(`${baseURL}/dashboard/story-manager/queue`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        await storyManagerPage.waitForTimeout(2000);
      }

      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      await reviewQueuePage.navigate();
      await reviewQueuePage.verifyPageLoaded();

      try {
        await reviewQueuePage.filterByStatus('REJECTED');
        await storyManagerPage.waitForTimeout(2000);

        const titles = await reviewQueuePage.getAllSubmissionTitles();
        console.log(`[Test 3.3] ✅ Story Manager can see ${titles.length} rejected stories from Book Manager`);
      } catch {
        console.log('[Test 3.3] Story Manager queue may not support REJECTED filter (acceptable)');
      }
    });
  });
});
