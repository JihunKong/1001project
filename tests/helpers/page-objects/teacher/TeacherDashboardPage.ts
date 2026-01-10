import { Page, expect } from '@playwright/test';
import { DashboardPage } from '../DashboardPage';
import { UserRole } from '../LoginPage';

export class TeacherDashboardPage extends DashboardPage {
  protected readonly role: UserRole = 'teacher';

  get pageTitle(): string {
    return 'Teacher Dashboard';
  }

  private get classesCard() {
    return this.page.locator('[data-testid="my-classes"], .stat-card:has-text("Classes"), .stat-card:has-text("Class")');
  }

  private get studentsCard() {
    return this.page.locator('[data-testid="total-students"], .stat-card:has-text("Students"), .stat-card:has-text("Learners")');
  }

  private get assignmentsCard() {
    return this.page.locator('[data-testid="assignments"], .stat-card:has-text("Assignments"), .stat-card:has-text("Assigned")');
  }

  private get createClassButton() {
    return this.page.locator('button:has-text("Create Class"), a:has-text("New Class")');
  }

  private get myClassesLink() {
    return this.page.locator('a:has-text("My Classes"), a:has-text("Classes")');
  }

  private get assignBooksLink() {
    return this.page.locator('a:has-text("Assign Books"), a:has-text("Assignments")');
  }

  private get progressLink() {
    return this.page.locator('a:has-text("Progress"), a:has-text("Student Progress")');
  }

  private get libraryLink() {
    return this.page.locator('a:has-text("Library")');
  }

  async verifyDashboardElements(): Promise<void> {
    await this.verifyDashboardLoaded();
  }

  async getTeacherStats(): Promise<{
    classes: number;
    students: number;
    assignments: number;
  }> {
    const stats = await this.getStats();
    return {
      classes: parseInt(stats['Classes'] || stats['My Classes'] || '0'),
      students: parseInt(stats['Students'] || stats['Total Students'] || stats['Learners'] || '0'),
      assignments: parseInt(stats['Assignments'] || stats['Book Assignments'] || '0'),
    };
  }

  async clickCreateClass(): Promise<void> {
    await this.createClassButton.click();
    await this.waitForPageLoad();
  }

  async goToMyClasses(): Promise<void> {
    await this.myClassesLink.click();
    await this.waitForPageLoad();
  }

  async goToAssignBooks(): Promise<void> {
    await this.assignBooksLink.click();
    await this.waitForPageLoad();
  }

  async goToProgress(): Promise<void> {
    await this.progressLink.click();
    await this.waitForPageLoad();
  }

  async goToLibrary(): Promise<void> {
    await this.libraryLink.click();
    await this.waitForPageLoad();
  }

  async hasRecentActivity(): Promise<boolean> {
    const activitySection = this.page.locator('[data-testid="recent-activity"], .recent-activity, section:has-text("Recent")');
    return await activitySection.isVisible();
  }
}
