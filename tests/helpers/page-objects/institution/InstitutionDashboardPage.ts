import { Page, expect } from '@playwright/test';
import { DashboardPage } from '../DashboardPage';
import { UserRole } from '../LoginPage';

export class InstitutionDashboardPage extends DashboardPage {
  protected readonly role: UserRole = 'institution';

  get pageTitle(): string {
    return 'Institution Dashboard';
  }

  private get mainContent() {
    return this.page.getByRole('main');
  }

  private get teachersCard() {
    return this.mainContent.locator('[data-testid="total-teachers"], .stat-card:has-text("Teachers")').first();
  }

  private get studentsCard() {
    return this.mainContent.locator('[data-testid="total-students"], .stat-card:has-text("Students"), .stat-card:has-text("Learners")').first();
  }

  private get classesCard() {
    return this.mainContent.locator('[data-testid="total-classes"], .stat-card:has-text("Classes")').first();
  }

  private get teacherManagementLink() {
    return this.mainContent.locator('a:has-text("Teachers"), a:has-text("Manage Teachers")').first();
  }

  private get analyticsLink() {
    return this.mainContent.locator('a:has-text("Analytics"), a:has-text("Reports")').first();
  }

  private get assignBooksLink() {
    return this.mainContent.locator('a:has-text("Assign Books"), a:has-text("Book Assignments")').first();
  }

  async verifyDashboardElements(): Promise<void> {
    await this.verifyDashboardLoaded();
  }

  async getInstitutionStats(): Promise<{
    teachers: number;
    students: number;
    classes: number;
  }> {
    const stats = await this.getStats();
    return {
      teachers: parseInt(stats['Teachers'] || stats['Total Teachers'] || '0'),
      students: parseInt(stats['Students'] || stats['Total Students'] || stats['Learners'] || '0'),
      classes: parseInt(stats['Classes'] || stats['Total Classes'] || '0'),
    };
  }

  async goToTeacherManagement(): Promise<void> {
    const isVisible = await this.teacherManagementLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await this.teacherManagementLink.click();
      await this.waitForPageLoad();
    }
  }

  async goToAnalytics(): Promise<void> {
    const isVisible = await this.analyticsLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await this.analyticsLink.click();
      await this.waitForPageLoad();
    }
  }

  async goToAssignBooks(): Promise<void> {
    const isVisible = await this.assignBooksLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await this.assignBooksLink.click();
      await this.waitForPageLoad();
    }
  }

  async hasRecentActivity(): Promise<boolean> {
    const activitySection = this.mainContent.locator('[data-testid="recent-activity"], .recent-activity, section:has-text("Recent")').first();
    return await activitySection.isVisible({ timeout: 3000 }).catch(() => false);
  }
}
