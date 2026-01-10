import { Page, expect } from '@playwright/test';
import { DashboardPage } from '../DashboardPage';
import { UserRole } from '../LoginPage';

export class ContentAdminDashboardPage extends DashboardPage {
  protected readonly role: UserRole = 'contentAdmin';

  get pageTitle(): string {
    return 'Content Admin Dashboard';
  }

  private get pendingApprovalCard() {
    return this.page.locator('[data-testid="pending-approval"], .stat-card:has-text("Pending"), .stat-card:has-text("Approval")');
  }

  private get publishedBooksCard() {
    return this.page.locator('[data-testid="published-books"], .stat-card:has-text("Published")');
  }

  private get totalBooksCard() {
    return this.page.locator('[data-testid="total-books"], .stat-card:has-text("Total")');
  }

  private get approvalQueueLink() {
    return this.page.getByRole('main').locator('a:has-text("Approval"), a:has-text("Final Approval"), a:has-text("Queue")').first();
  }

  private get libraryLink() {
    return this.page.getByRole('main').locator('a:has-text("Library"), a:has-text("Published"), a:has-text("Books")').first();
  }

  private get translationsLink() {
    return this.page.locator('a:has-text("Translations"), a:has-text("Translation")').first();
  }

  private get directRegisterLink() {
    return this.page.getByRole('main').locator('a:has-text("Register Book"), a:has-text("Direct Register")').first();
  }

  async verifyDashboardElements(): Promise<void> {
    await this.verifyDashboardLoaded();
  }

  async getContentAdminStats(): Promise<{
    pending: number;
    published: number;
    total: number;
  }> {
    const stats = await this.getStats();
    return {
      pending: parseInt(stats['Pending Approval'] || stats['Pending'] || stats['To Approve'] || '0'),
      published: parseInt(stats['Published'] || stats['Published Books'] || '0'),
      total: parseInt(stats['Total Books'] || stats['Total'] || '0'),
    };
  }

  async goToApprovalQueue(): Promise<void> {
    await this.approvalQueueLink.click();
    await this.waitForPageLoad();
  }

  async goToLibrary(): Promise<void> {
    await this.libraryLink.click();
    await this.waitForPageLoad();
  }

  async goToTranslations(): Promise<void> {
    await this.translationsLink.click();
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
