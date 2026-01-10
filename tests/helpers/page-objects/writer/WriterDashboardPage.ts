import { Page, expect } from '@playwright/test';
import { DashboardPage } from '../DashboardPage';
import { UserRole } from '../LoginPage';

export class WriterDashboardPage extends DashboardPage {
  protected readonly role: UserRole = 'writer';

  get pageTitle(): string {
    return 'Writer Dashboard';
  }

  private get totalStoriesCard() {
    return this.page.locator('[data-testid="total-stories"], .stat-card:has-text("Total")');
  }

  private get publishedStoriesCard() {
    return this.page.locator('[data-testid="published-stories"], .stat-card:has-text("Published")');
  }

  private get inReviewStoriesCard() {
    return this.page.locator('[data-testid="in-review-stories"], .stat-card:has-text("Review")');
  }

  private get newStoryButton() {
    return this.page.locator('a:has-text("Write New Story"), a:has-text("New Story"), a:has-text("Submit Story"), button:has-text("Write New Story")').first();
  }

  private get myStoriesLink() {
    return this.page.locator('a:has-text("My Stories"), a:has-text("Stories")').first();
  }

  private get libraryLink() {
    return this.page.locator('a:has-text("Library")').first();
  }

  private get notificationsLink() {
    return this.page.locator('a:has-text("Notifications")');
  }

  async verifyDashboardElements(): Promise<void> {
    await this.verifyDashboardLoaded();
  }

  async getWriterStats(): Promise<{
    total: number;
    published: number;
    inReview: number;
  }> {
    const stats = await this.getStats();
    return {
      total: parseInt(stats['Total Stories'] || stats['Total'] || '0'),
      published: parseInt(stats['Published'] || stats['Published Stories'] || '0'),
      inReview: parseInt(stats['In Review'] || stats['Under Review'] || '0'),
    };
  }

  async clickNewStory(): Promise<void> {
    await this.newStoryButton.click();
    await this.waitForPageLoad();
  }

  async goToMyStories(): Promise<void> {
    await this.myStoriesLink.click();
    await this.waitForPageLoad();
    await this.expectUrlContains('/stories');
  }

  async goToLibrary(): Promise<void> {
    await this.libraryLink.click();
    await this.waitForPageLoad();
    await this.expectUrlContains('/library');
  }

  async goToNotifications(): Promise<void> {
    await this.notificationsLink.click();
    await this.waitForPageLoad();
    await this.expectUrlContains('/notifications');
  }

  async hasRecentActivity(): Promise<boolean> {
    const activitySection = this.page.locator('[data-testid="recent-activity"], .recent-activity, section:has-text("Recent")');
    return await activitySection.isVisible();
  }

  async getRecentStories(): Promise<string[]> {
    const storyItems = this.page.locator('[data-testid="recent-story"], .story-item, .story-card');
    const count = await storyItems.count();
    const stories: string[] = [];

    for (let i = 0; i < count; i++) {
      const title = await storyItems.nth(i).locator('.story-title, h3, h4').textContent();
      if (title) stories.push(title.trim());
    }

    return stories;
  }
}
