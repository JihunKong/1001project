import { Page, expect } from '@playwright/test';
import { DashboardPage } from '../DashboardPage';
import { UserRole } from '../LoginPage';

export class StoryManagerDashboardPage extends DashboardPage {
  protected readonly role: UserRole = 'storyManager';

  get pageTitle(): string {
    return 'Story Manager Dashboard';
  }

  private get reviewQueueCard() {
    return this.page.locator('[data-testid="review-queue"], .stat-card:has-text("Review Queue"), .stat-card:has-text("Pending")');
  }

  private get approvedStoriesCard() {
    return this.page.locator('[data-testid="approved-stories"], .stat-card:has-text("Approved")');
  }

  private get rejectedStoriesCard() {
    return this.page.locator('[data-testid="rejected-stories"], .stat-card:has-text("Rejected")');
  }

  private get reviewQueueLink() {
    return this.page.locator('a:has-text("Story Review"), a:has-text("Review Queue"), a:has-text("Queue")');
  }

  private get submissionsFilter() {
    return this.page.locator('select:has-text("All Submissions"), button:has-text("All Submissions"), [data-testid="submissions-filter"]');
  }

  private get storySubmissionsQueue() {
    return this.page.locator('text=Story Submissions Queue').locator('xpath=ancestor::section | ancestor::div[contains(@class, "queue")]');
  }

  private get reviewButtons() {
    return this.page.locator('a:has-text("Review"), button:has-text("Review")').filter({ hasNotText: 'Story Review' });
  }

  private get myReviewsLink() {
    return this.page.locator('a:has-text("My Reviews"), a:has-text("Reviewed")');
  }

  private get directRegisterLink() {
    return this.page.locator('a:has-text("Register Book"), a:has-text("Direct Register")');
  }

  async verifyDashboardElements(): Promise<void> {
    await this.verifyDashboardLoaded();
  }

  async getStoryManagerStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const stats = await this.getStats();
    return {
      pending: parseInt(stats['Review Queue'] || stats['Pending'] || stats['To Review'] || '0'),
      approved: parseInt(stats['Approved'] || stats['Approved Stories'] || '0'),
      rejected: parseInt(stats['Rejected'] || stats['Rejected Stories'] || '0'),
    };
  }

  async goToReviewQueue(): Promise<void> {
    await this.reviewQueueLink.click();
    await this.waitForPageLoad();
  }

  async verifyQueueVisible(): Promise<boolean> {
    const queueHeader = this.page.locator('text=Story Submissions Queue')
      .or(this.page.locator('text=Review Queue'))
      .or(this.page.locator('h2:has-text("Submissions")'));
    return await queueHeader.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getQueueItemCount(): Promise<number> {
    const reviewLinks = this.reviewButtons;
    return await reviewLinks.count();
  }

  async clickFirstReview(): Promise<void> {
    const firstReview = this.reviewButtons.first();
    await firstReview.click();
    await this.waitForPageLoad();
  }

  async filterSubmissions(filter: string): Promise<void> {
    const filterSelect = this.page.locator('select').filter({ hasText: 'All Submissions' }).or(this.page.locator('select').first());
    if (await filterSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterSelect.selectOption({ label: filter });
      await this.page.waitForTimeout(1000);
    }
  }

  async goToMyReviews(): Promise<void> {
    await this.myReviewsLink.click();
    await this.waitForPageLoad();
    await this.expectUrlContains('/reviews');
  }

  async goToDirectRegister(): Promise<void> {
    await this.directRegisterLink.click();
    await this.waitForPageLoad();
    await this.expectUrlContains('/register');
  }

  async getPendingReviewCount(): Promise<number> {
    const stats = await this.getStoryManagerStats();
    return stats.pending;
  }

  async hasRecentActivity(): Promise<boolean> {
    const activitySection = this.page.locator('[data-testid="recent-activity"], .recent-activity, section:has-text("Recent")');
    return await activitySection.isVisible();
  }
}
