import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export type PublicationFormat = 'TEXT' | 'BOOK' | 'PDF';

export interface FormatDecision {
  format: PublicationFormat;
  notes?: string;
}

export class FormatDecisionPage extends BasePage {
  get pageTitle(): string {
    return 'Format Decision';
  }

  get url(): string {
    return '/dashboard/book-manager/format-queue';
  }

  private get storyItems() {
    return this.page.locator('[data-testid^="story-"], .story-card, .approved-story, tr[data-story-id]');
  }

  private get emptyQueueMessage() {
    return this.page.locator('[data-testid="empty-queue"], .empty-state, :has-text("No stories")');
  }

  private get textFormatButton() {
    return this.page.locator('button:has-text("Text"), button:has-text("TEXT"), [data-format="TEXT"]');
  }

  private get bookFormatButton() {
    return this.page.locator('button:has-text("Book"), button:has-text("BOOK"), [data-format="BOOK"]');
  }

  private get pdfFormatButton() {
    return this.page.locator('button:has-text("PDF"), [data-format="PDF"]');
  }

  private get notesInput() {
    return this.page.locator('textarea[name="notes"], textarea[name="formatNotes"], [data-testid="notes-input"]');
  }

  private get confirmButton() {
    return this.page.locator('button:has-text("Confirm"), button:has-text("Submit"), button:has-text("Save")');
  }

  async getQueueCount(): Promise<number> {
    return await this.storyItems.count();
  }

  async hasStories(): Promise<boolean> {
    return (await this.getQueueCount()) > 0;
  }

  async getStoryByTitle(title: string) {
    return this.page.locator(`[data-testid^="story-"]:has-text("${title}"), .story-card:has-text("${title}")`);
  }

  async clickStory(title: string): Promise<void> {
    const story = await this.getStoryByTitle(title);
    await story.click();
    await this.waitForPageLoad();
  }

  async clickFirstStory(): Promise<void> {
    await this.storyItems.first().click();
    await this.waitForPageLoad();
  }

  async getAllStoryTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.storyItems.count();

    for (let i = 0; i < count; i++) {
      const titleElement = this.storyItems.nth(i).locator('.story-title, h3, h4, [data-testid="title"]');
      const title = await titleElement.textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  async selectFormat(format: PublicationFormat): Promise<void> {
    switch (format) {
      case 'TEXT':
        await this.textFormatButton.click();
        break;
      case 'BOOK':
        await this.bookFormatButton.click();
        break;
      case 'PDF':
        await this.pdfFormatButton.click();
        break;
    }
  }

  async addNotes(notes: string): Promise<void> {
    if (await this.notesInput.isVisible()) {
      await this.notesInput.fill(notes);
    }
  }

  async confirmDecision(): Promise<void> {
    await this.confirmButton.click();
    await this.waitForPageLoad();
  }

  async makeFormatDecision(decision: FormatDecision): Promise<void> {
    await this.selectFormat(decision.format);

    if (decision.notes) {
      await this.addNotes(decision.notes);
    }

    await this.confirmDecision();
  }

  async decideAsText(notes?: string): Promise<void> {
    await this.makeFormatDecision({ format: 'TEXT', notes });
  }

  async decideAsBook(notes?: string): Promise<void> {
    await this.makeFormatDecision({ format: 'BOOK', notes });
  }

  async verifyEmptyQueue(): Promise<void> {
    await expect(this.emptyQueueMessage).toBeVisible();
  }

  async verifyFormatOptionsVisible(): Promise<void> {
    const textVisible = await this.textFormatButton.isVisible();
    const bookVisible = await this.bookFormatButton.isVisible();

    expect(textVisible || bookVisible).toBe(true);
  }
}
