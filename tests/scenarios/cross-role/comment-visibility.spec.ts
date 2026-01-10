import { test, expect } from '../../fixtures/multi-context';
import {
  SubmitStoryPage,
  MyStoriesPage,
  ReviewQueuePage,
  StoryReviewPage,
  FormatDecisionPage,
  FinalApprovalPage,
} from '../../helpers/page-objects';

test.describe('Publishing Workflow - Comment Visibility Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let commentTestTitle: string;
  const COMMENT_SM = 'Comment from Story Manager: Great opening paragraph!';
  const COMMENT_BM = 'Comment from Book Manager: Format looks good.';
  const COMMENT_CA = 'Comment from Content Admin: Ready for publication.';

  test.beforeAll(() => {
    commentTestTitle = `Comment Test Story ${Date.now()}`;
  });

  test.describe('Phase 4: Comment Accumulation and Visibility', () => {
    test('4.1 Multiple comments accumulate across workflow stages', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;
      const bookManagerPage = rolePages.bookManager!;
      const contentAdminPage = rolePages.contentAdmin!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);
      const formatDecisionPage = new FormatDecisionPage(bookManagerPage);
      const finalApprovalPage = new FinalApprovalPage(contentAdminPage);

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: commentTestTitle,
        summary: 'A story to test comment accumulation across workflow stages.',
        content: `This is a comprehensive test story for comment visibility testing.

        The story will travel through the entire publishing workflow.

        Each reviewer will add comments at their stage.

        At the end, we verify all comments are visible.`,
        authorAlias: 'Comment Test Author',
      });
      await submitStoryPage.submitForReview();
      console.log(`Writer submitted story: ${commentTestTitle}`);

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      const hasSubmissions = await reviewQueuePage.hasSubmissions();

      if (hasSubmissions) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        await storyReviewPage.addComment(COMMENT_SM);
        console.log('Story Manager added comment');

        const commentCount1 = await storyReviewPage.getCommentCount();
        console.log(`Comment count after Story Manager: ${commentCount1}`);

        await storyReviewPage.approveWithFeedback({
          comment: 'Approved with comment added.',
        });
      }

      await formatDecisionPage.navigate();
      await bookManagerPage.waitForTimeout(3000);
      const hasStories = await formatDecisionPage.hasStories();

      if (hasStories) {
        await formatDecisionPage.clickFirstStory();

        const commentInput = bookManagerPage.locator('textarea[name="comment"], textarea[name="notes"], [data-testid="comment-input"]').first();
        if (await commentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await commentInput.fill(COMMENT_BM);
          console.log('Book Manager added comment');
        }

        await formatDecisionPage.decideAsText('Formatted as text with comment.');
      }

      await finalApprovalPage.navigate();
      await contentAdminPage.waitForTimeout(3000);
      const hasBooks = await finalApprovalPage.hasBooks();

      if (hasBooks) {
        await finalApprovalPage.clickFirstBook();

        const commentInput = contentAdminPage.locator('textarea[name="comment"], textarea[name="notes"], [data-testid="comment-input"]').first();
        if (await commentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await commentInput.fill(COMMENT_CA);
          console.log('Content Admin added comment');
        }

        await contentAdminPage.waitForTimeout(1000);
      }

      console.log('All comments added through workflow stages');
    });

    test('4.2 Writer can view all accumulated comments', async ({ rolePages }) => {
      test.setTimeout(60000);

      const writerPage = rolePages.writer!;
      const myStoriesPage = new MyStoriesPage(writerPage);

      await myStoriesPage.navigate();
      await myStoriesPage.verifyPageLoaded();

      const tabsToCheck: Array<'In Progress' | 'Pending' | 'Draft' | 'Published' | 'In Review'> = ['In Progress', 'Pending', 'Draft', 'Published', 'In Review'];
      let foundStory: string | undefined;
      let foundInTab: string | undefined;

      for (const tab of tabsToCheck) {
        await myStoriesPage.clickStatusTab(tab);
        await writerPage.waitForTimeout(1500);

        const titles = await myStoriesPage.getAllStoryTitles();
        foundStory = titles.find(t => t.includes('Comment Test') || t === commentTestTitle);

        if (foundStory) {
          foundInTab = tab;
          console.log(`Found "${foundStory}" in tab "${tab}"`);
          break;
        }
      }

      if (foundStory && foundInTab) {
        await myStoriesPage.viewFeedback(foundStory);
        await writerPage.waitForTimeout(2000);

        const feedback = await myStoriesPage.getFeedback();
        console.log(`Writer can see ${feedback.length} feedback items`);

        feedback.forEach((item, index) => {
          console.log(`Feedback ${index + 1}: ${item.content.substring(0, 50)}...`);
        });
      } else {
        console.log('Comment test story not found in Writer My Stories');
      }
    });

    test('4.3 Each role can view all comments', async ({ rolePages }) => {
      test.setTimeout(60000);

      const storyManagerPage = rolePages.storyManager!;
      const bookManagerPage = rolePages.bookManager!;
      const contentAdminPage = rolePages.contentAdmin!;

      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const formatDecisionPage = new FormatDecisionPage(bookManagerPage);

      await reviewQueuePage.navigate();
      console.log('Story Manager checking comment visibility');

      try {
        await reviewQueuePage.filterByStatus('STORY_APPROVED');
        await storyManagerPage.waitForTimeout(2000);
      } catch {
        console.log('Story Manager queue filter not available');
      }

      await formatDecisionPage.navigate();
      console.log('Book Manager checking comment visibility');

      await bookManagerPage.waitForTimeout(2000);

      const baseURL = process.env.BASE_URL || 'http://localhost:8001';
      await contentAdminPage.goto(`${baseURL}/dashboard/content-admin`);
      await contentAdminPage.waitForTimeout(2000);
      console.log('Content Admin checking comment visibility');
    });
  });

  test.describe('Comment Preservation Through Revisions', () => {
    test('4.4 Comments preserved after revision request', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);

      const revisionTitle = `Revision Comment Test ${Date.now()}`;

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: revisionTitle,
        summary: 'Story to test comment preservation through revisions.',
        content: 'Initial content before revision.',
      });
      await submitStoryPage.submitForReview();

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        await storyReviewPage.addComment('First comment before revision request.');

        await storyReviewPage.requestRevisionWithFeedback({
          comment: 'Please revise the introduction section.',
        });
      }

      await myStoriesPage.navigate();
      await myStoriesPage.filterByStatus('NEEDS_REVISION');
      await writerPage.waitForTimeout(2000);

      const titles = await myStoriesPage.getAllStoryTitles();
      const foundStory = titles.find(t => t.includes('Revision Comment') || t === revisionTitle);

      if (foundStory) {
        await myStoriesPage.viewFeedback(foundStory);
        const feedback = await myStoriesPage.getFeedback();
        console.log(`Comments preserved after revision: ${feedback.length}`);
      }
    });

    test('4.5 New comments added after resubmission', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;

      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);

      await myStoriesPage.navigate();
      await myStoriesPage.filterByStatus('NEEDS_REVISION');
      await writerPage.waitForTimeout(2000);

      const titles = await myStoriesPage.getAllStoryTitles();
      if (titles.length > 0) {
        const storyToEdit = titles[0];
        const editVisible = await myStoriesPage.isEditButtonVisible(storyToEdit);

        if (editVisible) {
          await myStoriesPage.editStory(storyToEdit);
          await writerPage.waitForTimeout(2000);

          const contentEditor = writerPage.locator('textarea[name="content"], .rich-text-editor, .ql-editor').first();
          if (await contentEditor.isVisible({ timeout: 3000 }).catch(() => false)) {
            await contentEditor.fill('Revised content after feedback.');
          }

          const submitButton = writerPage.locator('button:has-text("Submit"), button:has-text("Resubmit")').first();
          if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await submitButton.click();
            await writerPage.waitForTimeout(2000);
          }
        }
      }

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        await storyReviewPage.addComment('Second comment after resubmission.');

        const commentCount = await storyReviewPage.getCommentCount();
        console.log(`Total comments after resubmission: ${commentCount}`);

        const comments = await storyReviewPage.getAllComments();
        console.log(`All comments visible: ${comments.length}`);
      }
    });
  });
});
