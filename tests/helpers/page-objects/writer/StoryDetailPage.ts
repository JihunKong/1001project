import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface Comment {
  id?: string;
  content: string;
  authorName: string;
  createdAt: string;
  role?: string;
}

export interface WorkflowHistoryItem {
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

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

export class StoryDetailPage extends BasePage {
  private storyId: string = '';

  get pageTitle(): string {
    return 'Story Detail';
  }

  get url(): string {
    return `/dashboard/writer/stories/${this.storyId}`;
  }

  setStoryId(id: string): void {
    this.storyId = id;
  }

  private get storyTitle() {
    return this.page.locator('[data-testid="story-title"], h1, .story-title').first();
  }

  private get storyContent() {
    return this.page.locator('[data-testid="story-content"], .story-content, article, .content-area').first();
  }

  private get statusBadge() {
    return this.page.locator('.status-badge, [data-status], [data-testid="status"], .badge').first();
  }

  private get editButton() {
    return this.page.locator('button:has-text("Edit"), a:has-text("Edit Story"), [data-testid="edit-button"]');
  }

  private get saveButton() {
    return this.page.locator('button:has-text("Save"), button:has-text("Update")');
  }

  private get submitButton() {
    return this.page.locator('button:has-text("Submit"), button:has-text("Submit for Review"), button:has-text("Resubmit")');
  }

  private get cancelButton() {
    return this.page.locator('button:has-text("Cancel"), button:has-text("Discard")');
  }

  private get commentSection() {
    return this.page.locator('[data-testid="comments-section"], .comments-section, .feedback-section, [class*="comment"]').first();
  }

  private get commentItems() {
    return this.page.locator('[data-testid^="comment-"], .comment-item, .comment-card, .feedback-item');
  }

  private get workflowHistorySection() {
    return this.page.locator('[data-testid="workflow-history"], .workflow-history, .history-section, [class*="history"]').first();
  }

  private get historyItems() {
    return this.page.locator('[data-testid^="history-"], .history-item, .workflow-item, .timeline-item');
  }

  private get feedbackMessages() {
    return this.page.locator('[data-testid^="feedback-"], .feedback-message, .reviewer-feedback, .rejection-reason');
  }

  private get titleInput() {
    return this.page.locator('input[name="title"], [data-testid="title-input"]');
  }

  private get contentEditor() {
    return this.page.locator('textarea[name="content"], [data-testid="content-editor"], .rich-text-editor, .ql-editor');
  }

  async navigateToStory(storyId: string): Promise<void> {
    this.storyId = storyId;
    await this.navigateTo(`/dashboard/writer/stories/${storyId}`);
  }

  async getStoryTitle(): Promise<string> {
    return await this.storyTitle.textContent() || '';
  }

  async getStoryContent(): Promise<string> {
    return await this.storyContent.textContent() || '';
  }

  async getCurrentStatus(): Promise<string> {
    const statusText = await this.statusBadge.textContent();
    return statusText?.trim() || '';
  }

  async getStatusAsEnum(): Promise<StoryStatus | null> {
    const statusText = await this.getCurrentStatus();
    const statusMap: Record<string, StoryStatus> = {
      'draft': 'DRAFT',
      'pending': 'PENDING',
      'story review': 'STORY_REVIEW',
      'under review': 'STORY_REVIEW',
      'in review': 'STORY_REVIEW',
      'approved': 'STORY_APPROVED',
      'story approved': 'STORY_APPROVED',
      'format review': 'FORMAT_REVIEW',
      'content review': 'CONTENT_REVIEW',
      'needs revision': 'NEEDS_REVISION',
      'revision required': 'NEEDS_REVISION',
      'rejected': 'REJECTED',
      'published': 'PUBLISHED',
    };
    return statusMap[statusText.toLowerCase()] || null;
  }

  async isEditButtonEnabled(): Promise<boolean> {
    if (await this.editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await this.editButton.isEnabled();
    }
    return false;
  }

  async isEditButtonVisible(): Promise<boolean> {
    return await this.editButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async clickEdit(): Promise<void> {
    await this.editButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getComments(): Promise<Comment[]> {
    const comments: Comment[] = [];
    const count = await this.commentItems.count();

    for (let i = 0; i < count; i++) {
      const item = this.commentItems.nth(i);
      const contentElement = item.locator('p, .comment-content, .content, .text').first();
      const authorElement = item.locator('.author, .author-name, .commenter, [data-testid="author"]').first();
      const dateElement = item.locator('.date, .timestamp, time, [data-testid="date"]').first();
      const roleElement = item.locator('.role, .badge, [data-testid="role"]').first();

      const content = await contentElement.textContent() || '';
      const authorName = await authorElement.textContent() || 'Unknown';
      const createdAt = await dateElement.textContent() || '';
      const role = await roleElement.textContent().catch(() => '') || '';

      comments.push({
        content: content.trim(),
        authorName: authorName.trim(),
        createdAt: createdAt.trim(),
        role: role.trim(),
      });
    }

    return comments;
  }

  async getCommentCount(): Promise<number> {
    return await this.commentItems.count();
  }

  async hasComments(): Promise<boolean> {
    return (await this.getCommentCount()) > 0;
  }

  async getLatestComment(): Promise<Comment | null> {
    const comments = await this.getComments();
    return comments.length > 0 ? comments[comments.length - 1] : null;
  }

  async getWorkflowHistory(): Promise<WorkflowHistoryItem[]> {
    const history: WorkflowHistoryItem[] = [];
    const count = await this.historyItems.count();

    for (let i = 0; i < count; i++) {
      const item = this.historyItems.nth(i);
      const actionElement = item.locator('.action, .event, [data-testid="action"]').first();
      const actorElement = item.locator('.actor, .user, [data-testid="actor"]').first();
      const timestampElement = item.locator('.timestamp, time, .date, [data-testid="timestamp"]').first();
      const detailsElement = item.locator('.details, .description, [data-testid="details"]').first();

      const action = await actionElement.textContent() || '';
      const actor = await actorElement.textContent() || '';
      const timestamp = await timestampElement.textContent() || '';
      const details = await detailsElement.textContent().catch(() => '') || '';

      history.push({
        action: action.trim(),
        actor: actor.trim(),
        timestamp: timestamp.trim(),
        details: details.trim(),
      });
    }

    return history;
  }

  async hasWorkflowHistory(): Promise<boolean> {
    return await this.workflowHistorySection.isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getFeedbackMessages(): Promise<string[]> {
    const messages: string[] = [];
    const count = await this.feedbackMessages.count();

    for (let i = 0; i < count; i++) {
      const text = await this.feedbackMessages.nth(i).textContent();
      if (text) messages.push(text.trim());
    }

    return messages;
  }

  async hasRejectionReason(): Promise<boolean> {
    const messages = await this.getFeedbackMessages();
    return messages.length > 0;
  }

  async getRejectionReason(): Promise<string | null> {
    const messages = await this.getFeedbackMessages();
    return messages.length > 0 ? messages[0] : null;
  }

  async updateTitle(newTitle: string): Promise<void> {
    await this.clickEdit();
    await this.titleInput.clear();
    await this.titleInput.fill(newTitle);
  }

  async updateContent(newContent: string): Promise<void> {
    await this.clickEdit();
    const isContentVisible = await this.contentEditor.isVisible({ timeout: 3000 }).catch(() => false);
    if (isContentVisible) {
      await this.contentEditor.clear();
      await this.contentEditor.fill(newContent);
    }
  }

  async saveChanges(): Promise<void> {
    await this.saveButton.click();
    await this.waitForPageLoad();
  }

  async submitForReview(): Promise<void> {
    await this.submitButton.click();
    await this.waitForPageLoad();
  }

  async cancelEdit(): Promise<void> {
    await this.cancelButton.click();
    await this.page.waitForTimeout(500);
  }

  async editAndResubmit(newContent?: string): Promise<void> {
    await this.clickEdit();

    if (newContent) {
      const isContentVisible = await this.contentEditor.isVisible({ timeout: 3000 }).catch(() => false);
      if (isContentVisible) {
        await this.contentEditor.fill(newContent);
      }
    }

    await this.submitForReview();
  }

  async verifyStoryLoaded(): Promise<void> {
    await expect(this.storyTitle).toBeVisible({ timeout: 10000 });
  }

  async verifyStatusIs(expectedStatus: StoryStatus): Promise<void> {
    const status = await this.getStatusAsEnum();
    expect(status).toBe(expectedStatus);
  }

  async verifyCommentsExist(): Promise<void> {
    expect(await this.hasComments()).toBe(true);
  }

  async verifyNoComments(): Promise<void> {
    expect(await this.hasComments()).toBe(false);
  }
}
