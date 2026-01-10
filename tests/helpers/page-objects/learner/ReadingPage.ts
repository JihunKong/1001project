import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface ReadingProgress {
  currentPage: number;
  totalPages: number;
  percentComplete: number;
}

export class ReadingPage extends BasePage {
  get pageTitle(): string {
    return 'Reading';
  }

  get url(): string {
    return '/dashboard/learner/read';
  }

  private get bookContent() {
    return this.page.locator('[data-testid="book-content"], .book-content, .reading-content, article');
  }

  private get bookTitle() {
    return this.page.locator('[data-testid="book-title"], h1, h2.book-title');
  }

  private get nextPageButton() {
    return this.page.locator('button:has-text("Next"), [aria-label="Next page"], .next-page');
  }

  private get prevPageButton() {
    return this.page.locator('button:has-text("Previous"), [aria-label="Previous page"], .prev-page');
  }

  private get progressIndicator() {
    return this.page.locator('[data-testid="reading-progress"], .progress-bar, .page-indicator');
  }

  private get wordDefinitionPopup() {
    return this.page.locator('[data-testid="word-definition"], .definition-popup, .word-tooltip');
  }

  private get aiChatButton() {
    return this.page.locator('button:has-text("Ask AI"), button:has-text("Chat"), [data-testid="ai-chat"]');
  }

  private get markCompleteButton() {
    return this.page.locator('button:has-text("Complete"), button:has-text("Finish"), button:has-text("Done")');
  }

  async getBookTitle(): Promise<string> {
    return (await this.bookTitle.textContent()) || '';
  }

  async getBookContent(): Promise<string> {
    return (await this.bookContent.textContent()) || '';
  }

  async goToNextPage(): Promise<void> {
    if (await this.nextPageButton.isEnabled()) {
      await this.nextPageButton.click();
      await this.waitForPageLoad();
    }
  }

  async goToPrevPage(): Promise<void> {
    if (await this.prevPageButton.isEnabled()) {
      await this.prevPageButton.click();
      await this.waitForPageLoad();
    }
  }

  async getProgress(): Promise<ReadingProgress> {
    const progressText = await this.progressIndicator.textContent();

    const pageMatch = progressText?.match(/(\d+)\s*\/\s*(\d+)/);
    const percentMatch = progressText?.match(/(\d+)%/);

    if (pageMatch) {
      const current = parseInt(pageMatch[1]);
      const total = parseInt(pageMatch[2]);
      return {
        currentPage: current,
        totalPages: total,
        percentComplete: Math.round((current / total) * 100),
      };
    }

    return {
      currentPage: 0,
      totalPages: 0,
      percentComplete: percentMatch ? parseInt(percentMatch[1]) : 0,
    };
  }

  async clickWord(word: string): Promise<void> {
    const wordElement = this.page.locator(`text="${word}"`).first();
    await wordElement.click();
  }

  async isDefinitionVisible(): Promise<boolean> {
    return await this.wordDefinitionPopup.isVisible();
  }

  async getWordDefinition(): Promise<string> {
    if (await this.isDefinitionVisible()) {
      return (await this.wordDefinitionPopup.textContent()) || '';
    }
    return '';
  }

  async openAIChat(): Promise<void> {
    if (await this.aiChatButton.isVisible()) {
      await this.aiChatButton.click();
      await this.waitForPageLoad();
    }
  }

  async markAsComplete(): Promise<void> {
    if (await this.markCompleteButton.isVisible()) {
      await this.markCompleteButton.click();
      await this.waitForPageLoad();
    }
  }

  async verifyBookLoaded(): Promise<void> {
    await expect(this.bookContent).toBeVisible();
  }

  async navigateToPage(pageNumber: number): Promise<void> {
    const progress = await this.getProgress();

    if (pageNumber > progress.currentPage) {
      for (let i = progress.currentPage; i < pageNumber; i++) {
        await this.goToNextPage();
      }
    } else if (pageNumber < progress.currentPage) {
      for (let i = progress.currentPage; i > pageNumber; i--) {
        await this.goToPrevPage();
      }
    }
  }
}
