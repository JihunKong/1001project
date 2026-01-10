import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export type ReviewStatus = 'PENDING' | 'STORY_REVIEW' | 'NEEDS_REVISION' | 'STORY_APPROVED' | 'REJECTED';

export interface QueuedStory {
  id: string;
  title: string;
  author: string;
  submittedAt: string;
  status: ReviewStatus;
}

export class ReviewQueuePage extends BasePage {
  get pageTitle(): string {
    return 'Story Manager Dashboard';
  }

  get url(): string {
    return '/dashboard/story-manager';
  }

  private get storyItems() {
    return this.page.locator('a[href*="/dashboard/story-manager/review/"]');
  }

  private get storyRows() {
    return this.page.locator('table tbody tr, [class*="submission"], [class*="queue"] > div').filter({ has: this.page.locator('text=Review') });
  }

  private get statusFilter() {
    return this.page.locator('select').filter({ has: this.page.locator('option') }).first();
  }

  private get emptyQueueMessage() {
    return this.page.locator('text=No submissions')
      .or(this.page.locator('text=No stories'))
      .or(this.page.locator('[data-testid="empty-queue"]'));
  }

  private get refreshButton() {
    return this.page.locator('button:has-text("Refresh"), button[aria-label="Refresh"]');
  }

  async getQueueCount(): Promise<number> {
    return await this.storyItems.count();
  }

  async hasSubmissions(): Promise<boolean> {
    await this.waitForApiResponse('/api/text-submissions', 15000);
    await this.page.waitForTimeout(1000);
    return (await this.getQueueCount()) > 0;
  }

  async waitForSubmissions(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      await this.page.reload();
      await this.waitForApiResponse('/api/text-submissions', 15000);
      await this.page.waitForTimeout(1000);
      const count = await this.getQueueCount();
      if (count > 0) {
        return true;
      }
      await this.page.waitForTimeout(2000);
    }
    return false;
  }

  async getSubmissionByTitle(title: string) {
    return this.page.locator(`[data-testid^="submission-"]:has-text("${title}"), .submission-card:has-text("${title}")`);
  }

  async clickSubmission(title: string): Promise<void> {
    const submission = await this.getSubmissionByTitle(title);
    await submission.click();
    await this.waitForPageLoad();
  }

  async getFirstSubmission() {
    return this.storyItems.first();
  }

  async clickFirstSubmission(): Promise<void> {
    const firstReview = this.storyItems.first();
    await firstReview.click();
    await this.waitForPageLoad();
  }

  async filterByStatus(status: ReviewStatus | 'all'): Promise<void> {
    const filterSelect = this.statusFilter;
    if (await filterSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      const labelMap: Record<string, string> = {
        'all': 'All Submissions',
        'PENDING': 'Pending Review',
        'STORY_REVIEW': 'In Review',
        'NEEDS_REVISION': 'Needs Revision',
        'STORY_APPROVED': 'Approved',
        'REJECTED': 'Rejected',
      };

      const value = status === 'all' ? 'all' : status;
      const label = labelMap[status] || status;

      await filterSelect.selectOption({ value }).catch(async () => {
        await filterSelect.selectOption({ label });
      });

      await this.waitForApiResponse('/api/text-submissions', 10000);
      await this.page.waitForTimeout(500);
    }
  }

  async getAllSubmissionTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.storyItems.count();

    for (let i = 0; i < count; i++) {
      const titleElement = this.storyItems.nth(i).locator('.submission-title, h3, h4, [data-testid="title"]');
      const title = await titleElement.textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  async refreshQueue(): Promise<void> {
    if (await this.refreshButton.isVisible()) {
      await this.refreshButton.click();
      await this.waitForPageLoad();
    } else {
      await this.page.reload();
      await this.waitForPageLoad();
    }
  }

  async verifyEmptyQueue(): Promise<void> {
    await expect(this.emptyQueueMessage).toBeVisible();
  }

  async getSubmissionStatus(title: string): Promise<ReviewStatus | null> {
    const submission = await this.getSubmissionByTitle(title);
    const statusBadge = submission.locator('.status-badge, [data-status], .badge');
    const statusText = await statusBadge.textContent();

    if (!statusText) return null;

    const statusMap: Record<string, ReviewStatus> = {
      'pending': 'PENDING',
      'story review': 'STORY_REVIEW',
      'under review': 'STORY_REVIEW',
      'needs revision': 'NEEDS_REVISION',
      'revision': 'NEEDS_REVISION',
      'approved': 'STORY_APPROVED',
      'rejected': 'REJECTED',
    };

    return statusMap[statusText.toLowerCase().trim()] || null;
  }
}
