import { Page, expect } from '@playwright/test';
import { DashboardPage } from '../DashboardPage';
import { UserRole } from '../LoginPage';

export class LearnerDashboardPage extends DashboardPage {
  protected readonly role: UserRole = 'learner';

  get pageTitle(): string {
    return 'Learner Dashboard';
  }

  private get assignedBooksCard() {
    return this.page.locator('[data-testid="assigned-books"], .stat-card:has-text("Assigned"), .stat-card:has-text("Books")');
  }

  private get completedBooksCard() {
    return this.page.locator('[data-testid="completed-books"], .stat-card:has-text("Completed")');
  }

  private get progressCard() {
    return this.page.locator('[data-testid="reading-progress"], .stat-card:has-text("Progress")');
  }

  private get myBooksLink() {
    return this.page.locator('a:has-text("My Books"), a:has-text("Assigned Books")');
  }

  private get joinClassButton() {
    return this.page.locator('button:has-text("Join Class"), a:has-text("Join Class")');
  }

  private get myClassLink() {
    return this.page.locator('a:has-text("My Class"), a:has-text("Class")');
  }

  async verifyDashboardElements(): Promise<void> {
    await this.verifyDashboardLoaded();
  }

  async getLearnerStats(): Promise<{
    assigned: number;
    completed: number;
    progress: number;
  }> {
    const stats = await this.getStats();
    return {
      assigned: parseInt(stats['Assigned Books'] || stats['Books'] || stats['To Read'] || '0'),
      completed: parseInt(stats['Completed'] || stats['Completed Books'] || stats['Finished'] || '0'),
      progress: parseInt(stats['Progress'] || stats['Reading Progress'] || '0'),
    };
  }

  async goToMyBooks(): Promise<void> {
    await this.myBooksLink.click();
    await this.waitForPageLoad();
  }

  async clickJoinClass(): Promise<void> {
    await this.joinClassButton.click();
    await this.waitForPageLoad();
  }

  async goToMyClass(): Promise<void> {
    await this.myClassLink.click();
    await this.waitForPageLoad();
  }

  async hasRecentActivity(): Promise<boolean> {
    const activitySection = this.page.locator('[data-testid="recent-activity"], .recent-activity, section:has-text("Recent")');
    return await activitySection.isVisible();
  }

  async getRecentBooks(): Promise<string[]> {
    const bookItems = this.page.locator('[data-testid="recent-book"], .book-item, .book-card').first().locator('..').locator('.book-item, .book-card');
    const count = await bookItems.count();
    const books: string[] = [];

    for (let i = 0; i < Math.min(count, 5); i++) {
      const title = await bookItems.nth(i).locator('.book-title, h3, h4').textContent();
      if (title) books.push(title.trim());
    }

    return books;
  }
}
