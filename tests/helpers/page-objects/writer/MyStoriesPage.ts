import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export type StoryStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'STORY_REVIEW'
  | 'STORY_APPROVED'
  | 'FORMAT_REVIEW'
  | 'CONTENT_REVIEW'
  | 'NEEDS_REVISION'
  | 'REJECTED'
  | 'PUBLISHED';

export interface StoryListItem {
  id: string;
  title: string;
  status: StoryStatus;
  createdAt: string;
}

export interface FeedbackItem {
  content: string;
  authorName: string;
  createdAt: string;
  role?: string;
}

export class MyStoriesPage extends BasePage {
  get pageTitle(): string {
    return 'My Stories';
  }

  get url(): string {
    return '/dashboard/writer/stories';
  }

  private get storyCards() {
    return this.page.locator('div:has(h3:has-text("Story"), h4:has-text("Story")), div:has(img):has-text("words"), [data-testid^="story-"], .story-card, .story-item');
  }

  private get statusFilter() {
    return this.page.locator('select[name="status"], [data-testid="status-filter"]').first();
  }

  private get searchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  private get emptyMessage() {
    return this.page.locator('[data-testid="empty-stories"], .empty-state, :has-text("No stories")');
  }

  private get newStoryButton() {
    return this.page.locator('a:has-text("New Story"), button:has-text("Create Story")');
  }

  private get paginationNext() {
    return this.page.locator('button:has-text("Next"), [aria-label="Next page"]');
  }

  private get paginationPrev() {
    return this.page.locator('button:has-text("Previous"), [aria-label="Previous page"]');
  }

  private get feedbackSection() {
    return this.page.locator('[data-testid="feedback-section"], .feedback-section, .feedback-list, [class*="feedback"]').first();
  }

  private get feedbackItems() {
    return this.page.locator('[data-testid^="feedback-"], .feedback-item, .feedback-card, .comment-item');
  }

  private get storyDetailModal() {
    return this.page.locator('[data-testid="story-detail-modal"], .story-modal, [role="dialog"]');
  }

  private get closeModalButton() {
    return this.page.locator('button:has-text("Close"), button[aria-label="Close"], [data-testid="close-modal"]');
  }

  private getStatusTab(status: string) {
    return this.page.locator('button').filter({ hasText: new RegExp(`^${status}`, 'i') }).first();
  }

  async clickStatusTab(status: 'Draft' | 'Pending' | 'In Review' | 'In Progress' | 'Published' | 'Needs Revision' | 'Rejected'): Promise<void> {
    const tab = this.getStatusTab(status);
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    await this.page.waitForTimeout(500);
    await this.waitForContentLoaded();
    await this.page.waitForTimeout(500);
  }

  async getTabCount(status: string): Promise<number> {
    const tab = this.getStatusTab(status);
    const tabText = await tab.textContent();
    if (!tabText) return 0;
    const match = tabText.match(/\((\d+)\)/);
    return match ? parseInt(match[1]) : 0;
  }

  async hasAnyStories(): Promise<boolean> {
    const draftCount = await this.getTabCount('Draft');
    const pendingCount = await this.getTabCount('Pending');
    const inReviewCount = await this.getTabCount('In Review');
    const inProgressCount = await this.getTabCount('In Progress');
    const publishedCount = await this.getTabCount('Published');
    return (draftCount + pendingCount + inReviewCount + inProgressCount + publishedCount) > 0;
  }

  async getStoryCount(): Promise<number> {
    return await this.storyCards.count();
  }

  async waitForContentLoaded(): Promise<void> {
    const loadingIndicator = this.page.locator('[class*="animate-spin"], [class*="loading"], [class*="spinner"]');
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    const hasContent = await this.storyCards.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await this.emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasContent && !hasEmpty) {
      await this.page.waitForTimeout(2000);
    }
  }

  async hasStories(): Promise<boolean> {
    await this.waitForContentLoaded();
    const count = await this.getStoryCount();
    return count > 0;
  }

  async getStoryByTitle(title: string) {
    return this.page.locator(`text=${title}`).first();
  }

  async clickStory(title: string): Promise<void> {
    const storyCard = await this.getStoryByTitle(title);
    await storyCard.click();
    await this.waitForPageLoad();
  }

  async getStoryStatus(title: string): Promise<StoryStatus | null> {
    const storyCard = await this.getStoryByTitle(title);
    const statusBadge = storyCard.locator('.status-badge, [data-status], .badge');
    const statusText = await statusBadge.textContent();

    if (!statusText) return null;

    const statusMap: Record<string, StoryStatus> = {
      'draft': 'DRAFT',
      'pending': 'PENDING',
      'under review': 'STORY_REVIEW',
      'story review': 'STORY_REVIEW',
      'approved': 'STORY_APPROVED',
      'format review': 'FORMAT_REVIEW',
      'content review': 'CONTENT_REVIEW',
      'needs revision': 'NEEDS_REVISION',
      'revision': 'NEEDS_REVISION',
      'rejected': 'REJECTED',
      'published': 'PUBLISHED',
    };

    const normalizedStatus = statusText.toLowerCase().trim();
    return statusMap[normalizedStatus] || null;
  }

  async filterByStatus(status: StoryStatus | 'all'): Promise<void> {
    const selectFilter = this.page.locator('select[name="status"]').first();
    const isSelectVisible = await selectFilter.isVisible({ timeout: 2000 }).catch(() => false);

    if (isSelectVisible) {
      await selectFilter.selectOption(status === 'all' ? '' : status);
    } else {
      const statusLabels: Record<string, string> = {
        'DRAFT': 'Draft',
        'PENDING': 'Pending',
        'STORY_REVIEW': 'In Review',
        'STORY_APPROVED': 'Approved',
        'FORMAT_REVIEW': 'Format Review',
        'CONTENT_REVIEW': 'Content Review',
        'NEEDS_REVISION': 'Needs Revision',
        'REJECTED': 'Rejected',
        'PUBLISHED': 'Published',
        'all': 'All'
      };
      const tabLabel = statusLabels[status] || status;
      const tab = this.page.locator(`button:has-text("${tabLabel}"), [role="tab"]:has-text("${tabLabel}")`).first();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
      }
    }
    await this.waitForPageLoad();
  }

  async searchStory(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async verifyStoryExists(title: string): Promise<void> {
    const storyCard = await this.getStoryByTitle(title);
    await expect(storyCard).toBeVisible();
  }

  async verifyStoryStatus(title: string, expectedStatus: StoryStatus): Promise<void> {
    const status = await this.getStoryStatus(title);
    expect(status).toBe(expectedStatus);
  }

  async clickNewStory(): Promise<void> {
    await this.newStoryButton.click();
    await this.waitForPageLoad();
  }

  async editStory(title: string): Promise<void> {
    const storyCard = await this.getStoryByTitle(title);
    const editButton = storyCard.locator('button:has-text("Edit"), a:has-text("Edit")');
    await editButton.click();
    await this.waitForPageLoad();
  }

  async deleteStory(title: string): Promise<void> {
    const storyCard = await this.getStoryByTitle(title);
    const deleteButton = storyCard.locator('button:has-text("Delete"), [aria-label="Delete"]');
    await deleteButton.click();

    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.waitForPageLoad();
  }

  async goToNextPage(): Promise<void> {
    if (await this.paginationNext.isEnabled()) {
      await this.paginationNext.click();
      await this.waitForPageLoad();
    }
  }

  async goToPrevPage(): Promise<void> {
    if (await this.paginationPrev.isEnabled()) {
      await this.paginationPrev.click();
      await this.waitForPageLoad();
    }
  }

  async getAllStoryTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.storyCards.count();

    for (let i = 0; i < count; i++) {
      const titleElement = this.storyCards.nth(i).locator('.story-title, h3, h4, [data-testid="story-title"]').first();
      const title = await titleElement.textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  async getStoriesByStatus(status: StoryStatus): Promise<string[]> {
    await this.filterByStatus(status);
    return await this.getAllStoryTitles();
  }

  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyMessage).toBeVisible();
  }

  async viewFeedback(title: string): Promise<void> {
    const storyCard = await this.getStoryByTitle(title);
    const feedbackButton = storyCard.locator('button:has-text("View Feedback"), button:has-text("Feedback"), a:has-text("Details")');

    if (await feedbackButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await feedbackButton.click();
    } else {
      await storyCard.click();
    }
    await this.page.waitForTimeout(1000);
  }

  async getFeedback(): Promise<FeedbackItem[]> {
    const feedback: FeedbackItem[] = [];
    const count = await this.feedbackItems.count();

    for (let i = 0; i < count; i++) {
      const item = this.feedbackItems.nth(i);
      const contentElement = item.locator('p, .content, .feedback-content').first();
      const authorElement = item.locator('.author, .author-name, [data-testid="author"]').first();
      const dateElement = item.locator('.date, time, [data-testid="date"]').first();

      const content = await contentElement.textContent() || '';
      const authorName = await authorElement.textContent() || 'Unknown';
      const createdAt = await dateElement.textContent() || '';

      feedback.push({
        content: content.trim(),
        authorName: authorName.trim(),
        createdAt: createdAt.trim(),
      });
    }

    return feedback;
  }

  async getLatestFeedback(): Promise<FeedbackItem | null> {
    const feedback = await this.getFeedback();
    return feedback.length > 0 ? feedback[feedback.length - 1] : null;
  }

  async hasFeedback(title: string): Promise<boolean> {
    await this.viewFeedback(title);
    const count = await this.feedbackItems.count();
    return count > 0;
  }

  async isEditButtonVisible(title: string): Promise<boolean> {
    const storyCard = await this.getStoryByTitle(title);
    const editButton = storyCard.locator('button:has-text("Edit"), a:has-text("Edit")');
    return await editButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async isEditButtonEnabled(title: string): Promise<boolean> {
    const storyCard = await this.getStoryByTitle(title);
    const editButton = storyCard.locator('button:has-text("Edit"), a:has-text("Edit")');
    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await editButton.isEnabled();
    }
    return false;
  }

  async closeModal(): Promise<void> {
    if (await this.storyDetailModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.closeModalButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async resubmitStory(title: string): Promise<void> {
    const storyCard = await this.getStoryByTitle(title);
    const resubmitButton = storyCard.locator('button:has-text("Resubmit"), button:has-text("Submit Again"), button:has-text("Submit for Review")');

    if (await resubmitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resubmitButton.click();
      await this.waitForPageLoad();
    }
  }

  async getRejectionReason(title: string): Promise<string | null> {
    await this.viewFeedback(title);
    const rejectionElement = this.page.locator('.rejection-reason, [data-testid="rejection-reason"], .feedback-content').first();
    if (await rejectionElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await rejectionElement.textContent();
    }
    return null;
  }
}
