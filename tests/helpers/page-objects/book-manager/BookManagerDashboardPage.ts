import { Page, expect } from '@playwright/test';
import { DashboardPage } from '../DashboardPage';
import { UserRole } from '../LoginPage';

export class BookManagerDashboardPage extends DashboardPage {
  protected readonly role: UserRole = 'bookManager';

  get pageTitle(): string {
    return 'Book Manager Dashboard';
  }

  private get approvedStoriesCard() {
    return this.page.locator('[data-testid="approved-stories"], .stat-card:has-text("Approved"), .stat-card:has-text("Ready")');
  }

  private get publishedBooksCard() {
    return this.page.locator('[data-testid="published-books"], .stat-card:has-text("Published")');
  }

  private get pendingFormatCard() {
    return this.page.locator('[data-testid="pending-format"], .stat-card:has-text("Format"), .stat-card:has-text("Pending")');
  }

  private get formatQueueLink() {
    return this.page.locator('a:has-text("Format Queue"), a:has-text("Pending Stories"), button:has-text("Format")');
  }

  private get publishedBooksLink() {
    return this.page.locator('a:has-text("Published Books"), a:has-text("Books")');
  }

  private get directRegisterLink() {
    return this.page.getByRole('main').locator('a:has-text("Register Book"), a:has-text("Direct Register")').first();
  }

  async verifyDashboardElements(): Promise<void> {
    await this.verifyDashboardLoaded();
  }

  async getBookManagerStats(): Promise<{
    approved: number;
    published: number;
    pendingFormat: number;
  }> {
    const stats = await this.getStats();
    return {
      approved: parseInt(stats['Approved Stories'] || stats['Ready for Format'] || stats['Approved'] || '0'),
      published: parseInt(stats['Published Books'] || stats['Published'] || '0'),
      pendingFormat: parseInt(stats['Pending Format'] || stats['Format Queue'] || '0'),
    };
  }

  async goToFormatQueue(): Promise<void> {
    await this.formatQueueLink.click();
    await this.waitForPageLoad();
  }

  async goToPublishedBooks(): Promise<void> {
    await this.publishedBooksLink.click();
    await this.waitForPageLoad();
  }

  async goToDirectRegister(): Promise<void> {
    await this.directRegisterLink.click();
    await this.waitForPageLoad();
    await this.expectUrlContains('/register');
  }

  async hasRecentActivity(): Promise<boolean> {
    const activitySection = this.page.locator('[data-testid="recent-activity"], .recent-activity, section:has-text("Recent")');
    return await activitySection.isVisible();
  }
}
