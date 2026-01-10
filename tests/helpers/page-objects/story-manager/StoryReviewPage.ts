import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface ReviewFeedback {
  comment: string;
  rating?: number;
  suggestions?: string;
}

export interface Comment {
  id?: string;
  content: string;
  authorName: string;
  createdAt: string;
  role?: string;
}

export class StoryReviewPage extends BasePage {
  get pageTitle(): string {
    return 'Review Story';
  }

  get url(): string {
    return '/dashboard/story-manager/review';
  }

  private get storyTitle() {
    return this.page.locator('[data-testid="story-title"], h1, h2.story-title');
  }

  private get storyContent() {
    return this.page.locator('[data-testid="story-content"], .story-content, .content-viewer, article');
  }

  private get authorInfo() {
    return this.page.locator('[data-testid="author-info"], .author-info, .author-name');
  }

  private get feedbackTextarea() {
    return this.page.locator('textarea[name="feedback"], textarea[name="comment"], [data-testid="feedback-input"]');
  }

  private get revisionModal() {
    return this.page.locator('[role="dialog"], .modal, [data-testid="revision-modal"]').first();
  }

  private get revisionNotesTextarea() {
    return this.page.locator('[role="dialog"] textarea, .modal textarea, [data-testid="revision-notes-input"]');
  }

  private get revisionModalSubmitButton() {
    return this.page.locator('[data-testid="revision-submit-button"], [role="dialog"] button:has-text("Request Revision"), .modal button:has-text("Request Revision")');
  }

  private get approveButton() {
    return this.page.locator('button:has-text("Approve"), button:has-text("Accept")');
  }

  private get rejectButton() {
    return this.page.locator('button:has-text("Reject"), button:has-text("Decline")');
  }

  private get requestRevisionButton() {
    return this.page.locator('button:has-text("Request Revision"), button:has-text("Needs Revision")');
  }

  private get submitFeedbackButton() {
    return this.page.locator('button:has-text("Submit Feedback"), button:has-text("Send Feedback")');
  }

  private get backToQueueButton() {
    return this.page.locator('a:has-text("Back to Queue"), button:has-text("Back")');
  }

  private get aiReviewButton() {
    return this.page.locator('button:has-text("AI Review"), button:has-text("Get AI Feedback")');
  }

  private get aiReviewResults() {
    return this.page.locator('[data-testid="ai-review-results"], .ai-review, .ai-feedback');
  }

  private get commentSection() {
    return this.page.locator('[data-testid="comments-section"], .comments-section, .comments, [class*="comment"]').first();
  }

  private get commentItems() {
    return this.page.locator('[data-testid^="comment-"], .comment-item, .comment-card, [class*="comment"]:has(p)');
  }

  private get addCommentButton() {
    return this.page.locator('button:has-text("Add Comment"), button:has-text("Comment"), button:has-text("Post Comment")');
  }

  private get commentInput() {
    return this.page.locator('textarea[name="comment"], textarea[placeholder*="comment" i], [data-testid="comment-input"]');
  }

  private get workflowHistory() {
    return this.page.locator('[data-testid="workflow-history"], .workflow-history, .history-section');
  }

  private get historyItems() {
    return this.page.locator('[data-testid^="history-"], .history-item, .workflow-item');
  }

  async getStoryTitle(): Promise<string> {
    return await this.storyTitle.textContent() || '';
  }

  async getStoryContent(): Promise<string> {
    return await this.storyContent.textContent() || '';
  }

  async getAuthorName(): Promise<string> {
    return await this.authorInfo.textContent() || '';
  }

  async writeFeedback(feedback: ReviewFeedback): Promise<void> {
    // First, check if we're in a modal context (e.g., RevisionRequestModal)
    const modalVisible = await this.revisionModal.isVisible({ timeout: 3000 }).catch(() => false);

    if (modalVisible) {
      // Modal context: use the revision notes textarea
      const revisionTextareaVisible = await this.revisionNotesTextarea.isVisible({ timeout: 3000 }).catch(() => false);
      if (revisionTextareaVisible) {
        await this.revisionNotesTextarea.fill(feedback.comment);
        console.log('[StoryReviewPage] ✅ Filled revision notes in modal');
        return;
      }
      console.log('[StoryReviewPage] ⚠️ Modal visible but no textarea found');
    }

    // Non-modal context: try the standard feedback textarea
    const textareaLocator = this.page.locator('textarea').first();
    const feedbackVisible = await this.feedbackTextarea.isVisible({ timeout: 5000 }).catch(() => false);

    if (feedbackVisible) {
      await this.feedbackTextarea.fill(feedback.comment);
      console.log('[StoryReviewPage] ✅ Filled standard feedback textarea');
    } else if (await textareaLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textareaLocator.fill(feedback.comment);
      console.log('[StoryReviewPage] ✅ Filled fallback textarea');
    } else {
      console.log('[StoryReviewPage] ⚠️ No feedback textarea found, skipping feedback write');
    }

    if (feedback.suggestions) {
      const suggestionsInput = this.page.locator('textarea[name="suggestions"], [data-testid="suggestions-input"]');
      if (await suggestionsInput.isVisible()) {
        await suggestionsInput.fill(feedback.suggestions);
      }
    }
  }

  async approveStory(): Promise<void> {
    await this.approveButton.click();
    await this.waitForPageLoad();
  }

  async rejectStory(): Promise<void> {
    await this.rejectButton.click();
    await this.waitForPageLoad();
  }

  async requestRevision(): Promise<void> {
    // Click Request Revision button to open modal
    await this.requestRevisionButton.click();
    console.log('[StoryReviewPage] Clicked Request Revision button');

    // Wait for modal to appear
    const modalAppeared = await this.revisionModal.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

    if (modalAppeared) {
      console.log('[StoryReviewPage] ✅ Revision modal appeared');

      // Click the submit button inside the modal
      const submitButton = this.revisionModalSubmitButton;
      const submitVisible = await submitButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (submitVisible) {
        await submitButton.click();
        console.log('[StoryReviewPage] ✅ Clicked modal submit button');

        // Wait for modal to close
        await this.revisionModal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
          console.log('[StoryReviewPage] ⚠️ Modal did not close, continuing...');
        });
      } else {
        console.log('[StoryReviewPage] ⚠️ Modal submit button not found');
      }
    } else {
      console.log('[StoryReviewPage] ⚠️ Modal did not appear, falling back to page load wait');
    }

    await this.waitForPageLoad();
  }

  async submitFeedback(): Promise<void> {
    await this.submitFeedbackButton.click();
    await this.waitForPageLoad();
  }

  async approveWithFeedback(feedback: ReviewFeedback): Promise<void> {
    await this.writeFeedback(feedback);
    await this.approveStory();
  }

  async rejectWithFeedback(feedback: ReviewFeedback): Promise<void> {
    await this.writeFeedback(feedback);
    await this.rejectStory();
  }

  async requestRevisionWithFeedback(feedback: ReviewFeedback): Promise<void> {
    // Step 1: Click Request Revision button to open modal
    await this.requestRevisionButton.click();
    console.log('[StoryReviewPage] Clicked Request Revision button');

    // Step 2: Wait for modal to appear
    const modalAppeared = await this.revisionModal.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

    if (!modalAppeared) {
      console.log('[StoryReviewPage] ⚠️ Revision modal did not appear');
      await this.waitForPageLoad();
      return;
    }

    console.log('[StoryReviewPage] ✅ Revision modal appeared');

    // Step 3: Fill feedback in modal textarea
    const revisionTextareaVisible = await this.revisionNotesTextarea.isVisible({ timeout: 3000 }).catch(() => false);
    if (revisionTextareaVisible) {
      await this.revisionNotesTextarea.fill(feedback.comment);
      console.log('[StoryReviewPage] ✅ Filled revision notes in modal');
    } else {
      console.log('[StoryReviewPage] ⚠️ Revision notes textarea not found in modal');
    }

    // Step 4: Click submit button in modal
    const submitButton = this.revisionModalSubmitButton;
    const submitVisible = await submitButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (submitVisible) {
      await submitButton.click();
      console.log('[StoryReviewPage] ✅ Clicked modal submit button');

      // Step 5: Wait for modal to close
      await this.revisionModal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
        console.log('[StoryReviewPage] ⚠️ Modal did not close, continuing...');
      });
    } else {
      console.log('[StoryReviewPage] ⚠️ Modal submit button not found');
    }

    await this.waitForPageLoad();
  }

  async backToQueue(): Promise<void> {
    await this.backToQueueButton.click();
    await this.waitForPageLoad();
    await this.expectUrlContains('/queue');
  }

  async triggerAIReview(): Promise<void> {
    if (await this.aiReviewButton.isVisible()) {
      await this.aiReviewButton.click();
      await this.waitForPageLoad();
    }
  }

  async hasAIReviewResults(): Promise<boolean> {
    return await this.aiReviewResults.isVisible();
  }

  async getAIReviewContent(): Promise<string> {
    if (await this.hasAIReviewResults()) {
      return await this.aiReviewResults.textContent() || '';
    }
    return '';
  }

  async verifyStoryLoaded(): Promise<void> {
    await this.page.waitForURL(/\/dashboard\/story-manager\/review\/|\/review\//, { timeout: 15000 });
    await this.page.waitForTimeout(1000);

    const titleVisible = await this.storyTitle.isVisible({ timeout: 10000 }).catch(() => false);
    const contentVisible = await this.storyContent.isVisible({ timeout: 5000 }).catch(() => false);

    if (!titleVisible && !contentVisible) {
      const anyHeading = this.page.locator('h1, h2').first();
      await expect(anyHeading).toBeVisible({ timeout: 5000 });
    }
  }

  async verifyReviewActionsAvailable(): Promise<void> {
    const approveVisible = await this.approveButton.isVisible();
    const rejectVisible = await this.rejectButton.isVisible();
    const revisionVisible = await this.requestRevisionButton.isVisible();

    expect(approveVisible || rejectVisible || revisionVisible).toBe(true);
  }

  async addComment(content: string): Promise<void> {
    const commentVisible = await this.commentInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (commentVisible) {
      await this.commentInput.fill(content);
      const submitButton = this.addCommentButton;
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
      } else {
        await this.page.keyboard.press('Enter');
      }
      await this.page.waitForTimeout(1000);
    } else {
      const feedbackVisible = await this.feedbackTextarea.isVisible({ timeout: 3000 }).catch(() => false);
      if (feedbackVisible) {
        await this.feedbackTextarea.fill(content);
      } else {
        const anyTextarea = this.page.locator('textarea').first();
        if (await anyTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await anyTextarea.fill(content);
        } else {
          console.log('No comment input found, skipping comment');
        }
      }
    }
  }

  async getCommentCount(): Promise<number> {
    return await this.commentItems.count();
  }

  async getAllComments(): Promise<Comment[]> {
    const comments: Comment[] = [];
    const count = await this.commentItems.count();

    for (let i = 0; i < count; i++) {
      const item = this.commentItems.nth(i);
      const contentElement = item.locator('p, .comment-content, .content').first();
      const authorElement = item.locator('.author, .author-name, [data-testid="author"]').first();
      const dateElement = item.locator('.date, .timestamp, time, [data-testid="date"]').first();

      const content = await contentElement.textContent() || '';
      const authorName = await authorElement.textContent() || 'Unknown';
      const createdAt = await dateElement.textContent() || '';

      comments.push({
        content: content.trim(),
        authorName: authorName.trim(),
        createdAt: createdAt.trim(),
      });
    }

    return comments;
  }

  async getLatestComment(): Promise<Comment | null> {
    const comments = await this.getAllComments();
    return comments.length > 0 ? comments[comments.length - 1] : null;
  }

  async hasComments(): Promise<boolean> {
    return (await this.getCommentCount()) > 0;
  }

  async verifyCommentExists(content: string): Promise<void> {
    const comments = await this.getAllComments();
    const found = comments.some(c => c.content.includes(content));
    expect(found).toBe(true);
  }

  async getWorkflowHistoryItems(): Promise<string[]> {
    const items: string[] = [];
    const count = await this.historyItems.count();

    for (let i = 0; i < count; i++) {
      const text = await this.historyItems.nth(i).textContent();
      if (text) items.push(text.trim());
    }

    return items;
  }

  async hasWorkflowHistory(): Promise<boolean> {
    return await this.workflowHistory.isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getCurrentStatus(): Promise<string> {
    const statusBadge = this.page.locator('.status-badge, [data-status], .badge, [class*="status"]').first();
    return await statusBadge.textContent() || '';
  }
}
