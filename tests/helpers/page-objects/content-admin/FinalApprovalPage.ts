import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export type ApprovalStatus = 'PENDING' | 'FORMAT_REVIEW' | 'CONTENT_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ApprovalDecision {
  approved: boolean;
  feedback?: string;
  visibility?: 'public' | 'private' | 'institution';
}

export class FinalApprovalPage extends BasePage {
  get pageTitle(): string {
    return 'Final Approval';
  }

  get url(): string {
    return '/dashboard/content-admin/approval-queue';
  }

  private get bookItems() {
    return this.page.locator('[data-testid^="book-"], .book-card, .approval-item, tr[data-book-id]');
  }

  private get emptyQueueMessage() {
    return this.page.locator('[data-testid="empty-queue"], .empty-state, :has-text("No books pending")');
  }

  private get approveButton() {
    return this.page.locator('button:has-text("Approve"), button:has-text("Publish")');
  }

  private get rejectButton() {
    return this.page.locator('button:has-text("Reject"), button:has-text("Decline")');
  }

  private get feedbackTextarea() {
    return this.page.locator('textarea[name="feedback"], textarea[name="notes"], [data-testid="feedback-input"]');
  }

  private get visibilitySelect() {
    return this.page.locator('select[name="visibility"], [data-testid="visibility-select"]');
  }

  private get confirmButton() {
    return this.page.locator('button:has-text("Confirm"), button:has-text("Submit")');
  }

  async getQueueCount(): Promise<number> {
    return await this.bookItems.count();
  }

  async hasBooks(): Promise<boolean> {
    return (await this.getQueueCount()) > 0;
  }

  async getBookByTitle(title: string) {
    return this.page.locator(`[data-testid^="book-"]:has-text("${title}"), .book-card:has-text("${title}")`);
  }

  async clickBook(title: string): Promise<void> {
    const book = await this.getBookByTitle(title);
    await book.click();
    await this.waitForPageLoad();
  }

  async clickFirstBook(): Promise<void> {
    await this.bookItems.first().click();
    await this.waitForPageLoad();
  }

  async getAllBookTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.bookItems.count();

    for (let i = 0; i < count; i++) {
      const titleElement = this.bookItems.nth(i).locator('.book-title, h3, h4, [data-testid="title"]');
      const title = await titleElement.textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  async writeFeedback(feedback: string): Promise<void> {
    if (await this.feedbackTextarea.isVisible()) {
      await this.feedbackTextarea.fill(feedback);
    }
  }

  async selectVisibility(visibility: 'public' | 'private' | 'institution'): Promise<void> {
    if (await this.visibilitySelect.isVisible()) {
      await this.visibilitySelect.selectOption(visibility);
    }
  }

  async approveBook(): Promise<void> {
    await this.approveButton.click();
    await this.waitForPageLoad();
  }

  async rejectBook(): Promise<void> {
    await this.rejectButton.click();
    await this.waitForPageLoad();
  }

  async approveWithFeedback(feedback?: string, visibility?: 'public' | 'private' | 'institution'): Promise<void> {
    if (feedback) {
      await this.writeFeedback(feedback);
    }
    if (visibility) {
      await this.selectVisibility(visibility);
    }
    await this.approveBook();
  }

  async rejectWithFeedback(feedback: string): Promise<void> {
    await this.writeFeedback(feedback);
    await this.rejectBook();
  }

  async makeDecision(decision: ApprovalDecision): Promise<void> {
    if (decision.feedback) {
      await this.writeFeedback(decision.feedback);
    }
    if (decision.visibility) {
      await this.selectVisibility(decision.visibility);
    }
    if (decision.approved) {
      await this.approveBook();
    } else {
      await this.rejectBook();
    }
  }

  async verifyEmptyQueue(): Promise<void> {
    await expect(this.emptyQueueMessage).toBeVisible();
  }

  async verifyApprovalActionsAvailable(): Promise<void> {
    const approveVisible = await this.approveButton.isVisible();
    const rejectVisible = await this.rejectButton.isVisible();

    expect(approveVisible || rejectVisible).toBe(true);
  }
}
