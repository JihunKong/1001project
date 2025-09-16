import { Page, Locator, expect } from '@playwright/test';

export class StoryReviewPage {
  readonly page: Page;

  // Header elements
  readonly backButton: Locator;
  readonly storyTitle: Locator;
  readonly statusBadge: Locator;
  readonly authorInfo: Locator;
  readonly submissionDate: Locator;
  readonly revisionNumber: Locator;

  // Content review area
  readonly textReviewPanel: Locator;
  readonly contentLines: Locator;
  readonly lineNumbers: Locator;
  readonly addCommentButton: Locator;
  readonly commentForm: Locator;
  readonly commentInput: Locator;
  readonly submitCommentButton: Locator;

  // Review actions sidebar
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly requestRevisionButton: Locator;
  readonly feedbackTextarea: Locator;
  readonly confirmActionButton: Locator;

  // Submission details
  readonly submissionDetails: Locator;
  readonly authorName: Locator;
  readonly authorEmail: Locator;
  readonly authorRole: Locator;
  readonly classInfo: Locator;
  readonly languageInfo: Locator;
  readonly ageRangeInfo: Locator;
  readonly categoryInfo: Locator;
  readonly tagsInfo: Locator;

  // Review history
  readonly reviewHistory: Locator;
  readonly workflowTransitions: Locator;

  // Comments and feedback
  readonly existingComments: Locator;
  readonly feedbackSection: Locator;

  // Processing indicators
  readonly processingIndicator: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.backButton = page.locator('a, button').filter({ hasText: /back.*submissions/i });
    this.storyTitle = page.locator('h1').first();
    this.statusBadge = page.locator('.status, [class*="status"], .badge').first();
    this.authorInfo = page.locator('text=by').locator('..').or(page.locator('[class*="author"]'));
    this.submissionDate = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/');
    this.revisionNumber = page.locator('text=/revision.*#\\d+/i');

    // Content review
    this.textReviewPanel = page.locator('.text-review-panel, [data-testid="text-review-panel"], .review-content');
    this.contentLines = page.locator('.content-line, .line, [data-line-number]');
    this.lineNumbers = page.locator('.line-number, [class*="line-number"]');
    this.addCommentButton = page.locator('button').filter({ hasText: /add.*comment/i });
    this.commentForm = page.locator('.comment-form, [data-testid="comment-form"]');
    this.commentInput = page.locator('textarea[placeholder*="comment" i], textarea[name*="comment"]');
    this.submitCommentButton = page.locator('button').filter({ hasText: /submit.*comment|add.*comment/i });

    // Review actions
    this.approveButton = page.locator('button').filter({ hasText: /approve/i });
    this.rejectButton = page.locator('button').filter({ hasText: /reject/i });
    this.requestRevisionButton = page.locator('button').filter({ hasText: /request.*revision/i });
    this.feedbackTextarea = page.locator('textarea[name*="feedback"], textarea[placeholder*="feedback" i]');
    this.confirmActionButton = page.locator('button').filter({ hasText: /confirm|submit|send/i });

    // Details section
    this.submissionDetails = page.locator('.submission-details, [data-testid="submission-details"]');
    this.authorName = page.locator('.author-name, [data-testid="author-name"]');
    this.authorEmail = page.locator('.author-email, [data-testid="author-email"]');
    this.authorRole = page.locator('.author-role, [data-testid="author-role"]');
    this.classInfo = page.locator('.class-info, [data-testid="class-info"]');
    this.languageInfo = page.locator('text=/language.*:/i').locator('..');
    this.ageRangeInfo = page.locator('text=/age.*range.*:/i').locator('..');
    this.categoryInfo = page.locator('text=/category.*:/i').locator('..');
    this.tagsInfo = page.locator('text=/tags.*:/i').locator('..');

    // History
    this.reviewHistory = page.locator('.review-history, [data-testid="review-history"]');
    this.workflowTransitions = page.locator('.workflow-transition, .transition');

    // Comments
    this.existingComments = page.locator('.comment-item, .feedback-item');
    this.feedbackSection = page.locator('.feedback-section, [data-testid="feedback-section"]');

    // Status indicators
    this.processingIndicator = page.locator('.processing, .loader, [class*="spin"], text=/processing/i');
    this.successMessage = page.locator('.success, .alert-success, [role="alert"]').filter({ hasText: /success|completed/i });
    this.errorMessage = page.locator('.error, .alert-error, .alert-danger, [role="alert"]').filter({ hasText: /error|failed/i });
  }

  async navigateTo(submissionId: string) {
    await this.page.goto(`/dashboard/story-manager/review/${submissionId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await this.storyTitle.waitFor({ state: 'visible' });
    await this.textReviewPanel.waitFor({ state: 'visible' });
  }

  async verifySubmissionDetails(expectedData: {
    title?: string;
    author?: string;
    status?: string;
  }) {
    if (expectedData.title) {
      await expect(this.storyTitle).toContainText(expectedData.title);
    }

    if (expectedData.author) {
      await expect(this.authorInfo).toContainText(expectedData.author);
    }

    if (expectedData.status) {
      await expect(this.statusBadge).toContainText(expectedData.status);
    }
  }

  async addLineComment(lineNumber: number, comment: string) {
    // Click on specific line to add comment
    const targetLine = this.contentLines.nth(lineNumber - 1);
    await targetLine.hover();

    // Look for comment button that appears on hover
    const lineCommentButton = targetLine.locator('button, .add-comment').first();
    if (await lineCommentButton.isVisible()) {
      await lineCommentButton.click();
    } else {
      await targetLine.click();
      await this.addCommentButton.click();
    }

    // Fill comment form
    await this.commentInput.fill(comment);
    await this.submitCommentButton.click();

    // Wait for comment to be added
    await this.page.waitForTimeout(1000);
  }

  async addGeneralComment(comment: string) {
    await this.addCommentButton.click();
    await this.commentInput.fill(comment);
    await this.submitCommentButton.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyCommentAdded(commentText: string) {
    const commentItem = this.existingComments.filter({ hasText: commentText });
    await expect(commentItem).toBeVisible();
  }

  async approveSubmission(feedback?: string) {
    await this.approveButton.click();

    if (feedback) {
      await this.feedbackTextarea.fill(feedback);
    }

    await this.confirmActionButton.click();

    // Wait for processing
    await this.processingIndicator.waitFor({ state: 'visible' });
    await this.processingIndicator.waitFor({ state: 'hidden' });
  }

  async rejectSubmission(feedback: string) {
    await this.rejectButton.click();
    await this.feedbackTextarea.fill(feedback);
    await this.confirmActionButton.click();

    // Wait for processing
    await this.processingIndicator.waitFor({ state: 'visible' });
    await this.processingIndicator.waitFor({ state: 'hidden' });
  }

  async requestRevision(feedback: string) {
    await this.requestRevisionButton.click();
    await this.feedbackTextarea.fill(feedback);
    await this.confirmActionButton.click();

    // Wait for processing
    await this.processingIndicator.waitFor({ state: 'visible' });
    await this.processingIndicator.waitFor({ state: 'hidden' });
  }

  async verifyReviewActionSuccess() {
    await expect(this.successMessage).toBeVisible();
  }

  async verifyStatusChanged(expectedStatus: string) {
    await this.page.reload();
    await this.waitForPageLoad();
    await expect(this.statusBadge).toContainText(expectedStatus);
  }

  async getContentText(): Promise<string> {
    return await this.textReviewPanel.textContent() || '';
  }

  async getWordCount(): Promise<number> {
    const content = await this.getContentText();
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  async verifyLineNumbers() {
    const lineCount = await this.contentLines.count();
    const lineNumberCount = await this.lineNumbers.count();

    expect(lineNumberCount).toBeGreaterThan(0);
    expect(lineNumberCount).toBeLessThanOrEqual(lineCount);
  }

  async verifyReviewHistory() {
    if (await this.reviewHistory.isVisible()) {
      const transitionCount = await this.workflowTransitions.count();
      expect(transitionCount).toBeGreaterThan(0);

      // Verify each transition has required info
      for (let i = 0; i < transitionCount; i++) {
        const transition = this.workflowTransitions.nth(i);
        await expect(transition).toContainText(/→|to|from/);
      }
    }
  }

  async verifySubmissionMetadata() {
    // Check that essential metadata is displayed
    await expect(this.submissionDetails).toBeVisible();

    // At minimum, author and submission date should be present
    const hasAuthor = await this.authorName.isVisible() || await this.authorInfo.isVisible();
    const hasDate = await this.submissionDate.isVisible();

    expect(hasAuthor).toBe(true);
    expect(hasDate).toBe(true);
  }

  async navigateBack() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyReadOnlyMode() {
    // In read-only mode, action buttons should not be visible
    const hasActionButtons = await this.approveButton.isVisible() ||
                            await this.rejectButton.isVisible() ||
                            await this.requestRevisionButton.isVisible();

    return !hasActionButtons;
  }

  async getAvailableActions(): Promise<string[]> {
    const actions: string[] = [];

    if (await this.approveButton.isVisible()) {
      actions.push('approve');
    }
    if (await this.rejectButton.isVisible()) {
      actions.push('reject');
    }
    if (await this.requestRevisionButton.isVisible()) {
      actions.push('request_revision');
    }

    return actions;
  }
}