import { Page, expect } from '@playwright/test';
import { DashboardPage } from '../DashboardPage';
import { UserRole } from '../LoginPage';

export class AdminDashboardPage extends DashboardPage {
  protected readonly role: UserRole = 'admin';

  get pageTitle(): string {
    return 'Admin Dashboard';
  }

  private get mainContent() {
    return this.page.getByRole('main');
  }

  private get totalUsersCard() {
    return this.mainContent.locator('[data-testid="total-users"], .stat-card:has-text("Users")').first();
  }

  private get totalBooksCard() {
    return this.mainContent.locator('[data-testid="total-books"], .stat-card:has-text("Books")').first();
  }

  private get pendingApprovalsCard() {
    return this.mainContent.locator('[data-testid="pending-approvals"], .stat-card:has-text("Pending")').first();
  }

  private get userManagementLink() {
    return this.mainContent.locator('a:has-text("Users"), a:has-text("User Management")').first();
  }

  private get systemSettingsLink() {
    return this.mainContent.locator('a:has-text("Settings"), a:has-text("System")').first();
  }

  private get reportsLink() {
    return this.mainContent.locator('a:has-text("Reports"), a:has-text("Analytics")').first();
  }

  async verifyDashboardElements(): Promise<void> {
    await this.verifyDashboardLoaded();
  }

  async getAdminStats(): Promise<{
    users: number;
    books: number;
    pendingApprovals: number;
  }> {
    const stats = await this.getStats();
    return {
      users: parseInt(stats['Users'] || stats['Total Users'] || '0'),
      books: parseInt(stats['Books'] || stats['Total Books'] || '0'),
      pendingApprovals: parseInt(stats['Pending'] || stats['Pending Approvals'] || '0'),
    };
  }

  async goToUserManagement(): Promise<void> {
    const isVisible = await this.userManagementLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await this.userManagementLink.click();
      await this.waitForPageLoad();
    }
  }

  async goToSystemSettings(): Promise<void> {
    const isVisible = await this.systemSettingsLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await this.systemSettingsLink.click();
      await this.waitForPageLoad();
    }
  }

  async goToReports(): Promise<void> {
    const isVisible = await this.reportsLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await this.reportsLink.click();
      await this.waitForPageLoad();
    }
  }

  async hasRecentActivity(): Promise<boolean> {
    const activitySection = this.mainContent.locator('[data-testid="recent-activity"], .recent-activity, section:has-text("Recent")').first();
    return await activitySection.isVisible({ timeout: 3000 }).catch(() => false);
  }
}
