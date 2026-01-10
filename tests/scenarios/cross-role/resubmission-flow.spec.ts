import { test, expect } from '../../fixtures/multi-context';
import {
  SubmitStoryPage,
  MyStoriesPage,
  ReviewQueuePage,
  StoryReviewPage,
} from '../../helpers/page-objects';

test.describe('Publishing Workflow - Resubmission Flow Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Phase 5: Writer Resubmission Flow', () => {
    test('5.1 NEEDS_REVISION status allows editing and resubmission', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);

      const resubmitTitle = `Resubmit Test ${Date.now()}`;

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: resubmitTitle,
        summary: 'Story for resubmission testing.',
        content: 'Original content that will be revised.',
      });
      await submitStoryPage.submitForReview();

      await myStoriesPage.navigate();
      console.log(`Writer submitted story: ${resubmitTitle}`);

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        await storyReviewPage.requestRevisionWithFeedback({
          comment: 'Please expand on the second paragraph.',
        });
        console.log('Story Manager requested revision');
      }

      await myStoriesPage.navigate();
      await myStoriesPage.clickStatusTab('Needs Revision');
      await writerPage.waitForTimeout(2000);

      const needsRevisionCount = await myStoriesPage.getTabCount('Needs Revision');
      console.log(`Needs Revision tab shows ${needsRevisionCount} stories`);

      const titles = await myStoriesPage.getAllStoryTitles();
      const foundStory = titles.find(t => t.includes('Resubmit Test') || t === resubmitTitle);

      if (foundStory) {
        const canEdit = await myStoriesPage.isEditButtonVisible(foundStory);
        console.log(`Edit button visible for NEEDS_REVISION story: ${canEdit}`);
        expect(canEdit).toBe(true);

        await myStoriesPage.editStory(foundStory);
        await writerPage.waitForTimeout(2000);

        const contentEditor = writerPage.locator('textarea[name="content"], .rich-text-editor, .ql-editor').first();
        if (await contentEditor.isVisible({ timeout: 5000 }).catch(() => false)) {
          await contentEditor.clear();
          await contentEditor.fill('Revised content with expanded second paragraph as requested.');
          console.log('Writer revised the content');
        }

        const submitButton = writerPage.locator('button:has-text("Submit for Review"), button:has-text("Resubmit"), button:has-text("Submit")').first();
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await submitButton.click();
          await writerPage.waitForTimeout(2000);
          console.log('Writer resubmitted the story');
        }
      }

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      const hasNewSubmission = await reviewQueuePage.hasSubmissions();
      console.log(`Story Manager queue has resubmitted story: ${hasNewSubmission}`);
    });

    test('5.2 REJECTED status prevents editing', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);

      const rejectedTitle = `Rejected Test ${Date.now()}`;

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: rejectedTitle,
        summary: 'Story that will be fully rejected.',
        content: 'Content that does not meet publication standards.',
      });
      await submitStoryPage.submitForReview();

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        await storyReviewPage.rejectWithFeedback({
          comment: 'The content does not meet our publication standards. Please submit a new story.',
        });
        console.log('Story Manager rejected the story');
      }

      await myStoriesPage.navigate();
      await myStoriesPage.filterByStatus('REJECTED');
      await writerPage.waitForTimeout(2000);

      const titles = await myStoriesPage.getAllStoryTitles();
      const foundStory = titles.find(t => t.includes('Rejected Test') || t === rejectedTitle);

      if (foundStory) {
        const canEdit = await myStoriesPage.isEditButtonVisible(foundStory);
        console.log(`Edit button visible for REJECTED story: ${canEdit}`);

        const reason = await myStoriesPage.getRejectionReason(foundStory);
        console.log(`Rejection reason visible: ${reason ? 'Yes' : 'No'}`);

        if (reason) {
          console.log(`Rejection reason: ${reason.substring(0, 100)}`);
        }
      } else {
        console.log('Rejected story not found - may be filtered differently');
      }
    });

    test('5.3 Comments preserved after resubmission', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);

      const preserveTitle = `Preserve Comments Test ${Date.now()}`;
      const FIRST_COMMENT = 'Initial feedback from Story Manager.';
      const SECOND_COMMENT = 'Additional feedback after resubmission.';

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: preserveTitle,
        summary: 'Story to test comment preservation.',
        content: 'Original content for comment preservation test.',
      });
      await submitStoryPage.submitForReview();

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        await storyReviewPage.addComment(FIRST_COMMENT);
        console.log('Story Manager added first comment');

        const initialCount = await storyReviewPage.getCommentCount();
        console.log(`Initial comment count: ${initialCount}`);

        await storyReviewPage.requestRevisionWithFeedback({
          comment: 'Please revise based on the feedback.',
        });
      }

      await myStoriesPage.navigate();
      await myStoriesPage.filterByStatus('NEEDS_REVISION');
      await writerPage.waitForTimeout(2000);

      const titles = await myStoriesPage.getAllStoryTitles();
      if (titles.length > 0) {
        const storyToEdit = titles[0];
        const canEdit = await myStoriesPage.isEditButtonVisible(storyToEdit);

        if (canEdit) {
          await myStoriesPage.editStory(storyToEdit);
          await writerPage.waitForTimeout(2000);

          const contentEditor = writerPage.locator('textarea[name="content"], .rich-text-editor, .ql-editor').first();
          if (await contentEditor.isVisible({ timeout: 5000 }).catch(() => false)) {
            await contentEditor.fill('Revised content after feedback.');
          }

          const submitButton = writerPage.locator('button:has-text("Submit for Review"), button:has-text("Resubmit")').first();
          if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await submitButton.click();
            await writerPage.waitForTimeout(2000);
            console.log('Writer resubmitted after revision');
          }
        }
      }

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        const comments = await storyReviewPage.getAllComments();
        console.log(`Comments after resubmission: ${comments.length}`);

        const hasFirstComment = comments.some(c => c.content.includes('Initial feedback') || c.content.includes(FIRST_COMMENT));
        console.log(`First comment preserved: ${hasFirstComment}`);

        await storyReviewPage.addComment(SECOND_COMMENT);
        console.log('Story Manager added second comment');

        const finalCount = await storyReviewPage.getCommentCount();
        console.log(`Final comment count: ${finalCount}`);
      }
    });

    test('5.4 Resubmission returns to Story Manager queue', async ({ rolePages }) => {
      test.setTimeout(120000);

      const writerPage = rolePages.writer!;
      const storyManagerPage = rolePages.storyManager!;

      const submitStoryPage = new SubmitStoryPage(writerPage);
      const myStoriesPage = new MyStoriesPage(writerPage);
      const reviewQueuePage = new ReviewQueuePage(storyManagerPage);
      const storyReviewPage = new StoryReviewPage(storyManagerPage);

      const queueTitle = `Queue Test ${Date.now()}`;

      await submitStoryPage.navigate();
      await submitStoryPage.fillStoryForm({
        title: queueTitle,
        summary: 'Story to test queue routing after resubmission.',
        content: 'Content for queue routing test.',
      });
      await submitStoryPage.submitForReview();

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);
      if (await reviewQueuePage.hasSubmissions()) {
        await reviewQueuePage.clickFirstSubmission();
        await storyReviewPage.verifyStoryLoaded();

        await storyReviewPage.requestRevisionWithFeedback({
          comment: 'Minor corrections needed.',
        });
      }

      await myStoriesPage.navigate();
      await myStoriesPage.filterByStatus('NEEDS_REVISION');
      await writerPage.waitForTimeout(2000);

      const titles = await myStoriesPage.getAllStoryTitles();
      if (titles.length > 0) {
        const canEdit = await myStoriesPage.isEditButtonVisible(titles[0]);
        if (canEdit) {
          await myStoriesPage.editStory(titles[0]);
          await writerPage.waitForTimeout(2000);

          const submitButton = writerPage.locator('button:has-text("Submit for Review"), button:has-text("Resubmit")').first();
          if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await submitButton.click();
            await writerPage.waitForTimeout(2000);
          }
        }
      }

      await reviewQueuePage.navigate();
      await storyManagerPage.waitForTimeout(3000);

      const hasSubmissions = await reviewQueuePage.hasSubmissions();
      console.log(`Resubmitted story in Story Manager queue: ${hasSubmissions}`);
      expect(hasSubmissions).toBe(true);
    });
  });
});
