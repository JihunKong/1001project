import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface AssignedBook {
  id: string;
  title: string;
  progress: number;
  dueDate?: string;
}

export class MyBooksPage extends BasePage {
  get pageTitle(): string {
    return 'My Books';
  }

  get url(): string {
    return '/dashboard/learner/my-books';
  }

  private get bookCards() {
    return this.page.locator('[data-testid^="book-"], .book-card, .assigned-book');
  }

  private get filterSelect() {
    return this.page.locator('select[name="filter"], [data-testid="filter-select"]');
  }

  private get emptyBooksMessage() {
    return this.page.locator('[data-testid="empty-books"], .empty-state, :has-text("No books assigned")');
  }

  async getBookCount(): Promise<number> {
    return await this.bookCards.count();
  }

  async hasBooks(): Promise<boolean> {
    return (await this.getBookCount()) > 0;
  }

  async getBookByTitle(title: string) {
    return this.page.locator(`[data-testid^="book-"]:has-text("${title}"), .book-card:has-text("${title}")`);
  }

  async clickBook(title: string): Promise<void> {
    const book = await this.getBookByTitle(title);
    await book.click();
    await this.waitForPageLoad();
  }

  async startReading(title: string): Promise<void> {
    const book = await this.getBookByTitle(title);
    const readButton = book.locator('button:has-text("Read"), a:has-text("Read"), button:has-text("Start")');

    await readButton.click();
    await this.waitForPageLoad();
  }

  async continueReading(title: string): Promise<void> {
    const book = await this.getBookByTitle(title);
    const continueButton = book.locator('button:has-text("Continue"), a:has-text("Continue")');

    await continueButton.click();
    await this.waitForPageLoad();
  }

  async getBookProgress(title: string): Promise<number> {
    const book = await this.getBookByTitle(title);
    const progressElement = book.locator('.progress, [data-testid="progress"], .progress-bar');

    const progressText = await progressElement.textContent();
    const match = progressText?.match(/(\d+)/);

    return match ? parseInt(match[1]) : 0;
  }

  async getAllBookTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.bookCards.count();

    for (let i = 0; i < count; i++) {
      const titleElement = this.bookCards.nth(i).locator('.book-title, h3, h4, [data-testid="title"]');
      const title = await titleElement.textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  async filterBooks(filter: 'all' | 'in-progress' | 'completed' | 'not-started'): Promise<void> {
    await this.filterSelect.selectOption(filter);
    await this.waitForPageLoad();
  }

  async verifyEmptyBooks(): Promise<void> {
    await expect(this.emptyBooksMessage).toBeVisible();
  }

  async getBookDueDate(title: string): Promise<string> {
    const book = await this.getBookByTitle(title);
    const dueDateElement = book.locator('.due-date, [data-testid="due-date"]');

    return (await dueDateElement.textContent()) || '';
  }
}
