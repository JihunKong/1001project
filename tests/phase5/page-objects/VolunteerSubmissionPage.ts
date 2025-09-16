import { Page, Locator, expect } from '@playwright/test';

export class VolunteerSubmissionPage {
  readonly page: Page;

  // Header elements
  readonly backButton: Locator;
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // Form elements
  readonly titleInput: Locator;
  readonly contentTextarea: Locator;
  readonly summaryTextarea: Locator;
  readonly languageSelect: Locator;
  readonly ageGroupSelect: Locator;
  readonly categorySelect: Locator;
  readonly tagsInput: Locator;

  // Action buttons
  readonly saveDraftButton: Locator;
  readonly previewButton: Locator;
  readonly submitButton: Locator;

  // Preview mode elements
  readonly previewTitle: Locator;
  readonly previewContent: Locator;
  readonly exitPreviewButton: Locator;

  // Sidebar elements
  readonly existingSubmissionsList: Locator;
  readonly refreshSubmissionsButton: Locator;
  readonly writingTips: Locator;

  // Notifications
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly autoSaveIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.backButton = page.locator('button').filter({ hasText: /back|arrow/i });
    this.pageTitle = page.locator('h1').filter({ hasText: /write.*story|submit/i });
    this.pageDescription = page.locator('p').filter({ hasText: /share.*creativity/i });

    // Form fields
    this.titleInput = page.locator('input[name="title"], input[placeholder*="title" i]');
    this.contentTextarea = page.locator('textarea[name="content"], textarea[placeholder*="story" i], .markdown-editor textarea');
    this.summaryTextarea = page.locator('textarea[name="summary"], textarea[placeholder*="summary" i]');
    this.languageSelect = page.locator('select[name="language"], select[id*="language"]');
    this.ageGroupSelect = page.locator('select[name="ageGroup"], select[name="ageRange"], select[id*="age"]');
    this.categorySelect = page.locator('select[name="category"], select[id*="category"]');
    this.tagsInput = page.locator('input[name="tags"], input[placeholder*="tag" i]');

    // Buttons
    this.saveDraftButton = page.locator('button').filter({ hasText: /save.*draft/i });
    this.previewButton = page.locator('button').filter({ hasText: /preview/i });
    this.submitButton = page.locator('button[type="submit"], button').filter({ hasText: /submit.*story/i });

    // Preview mode
    this.previewTitle = page.locator('.preview-mode h1, .preview h1, [data-testid="preview-title"]');
    this.previewContent = page.locator('.preview-mode .content, .preview .content, [data-testid="preview-content"]');
    this.exitPreviewButton = page.locator('button').filter({ hasText: /exit.*preview|edit/i });

    // Sidebar
    this.existingSubmissionsList = page.locator('.sidebar .submissions, [data-testid="submissions-list"]');
    this.refreshSubmissionsButton = page.locator('button[aria-label*="refresh"], button').filter({ hasText: /refresh/i });
    this.writingTips = page.locator('.writing-tips, [data-testid="writing-tips"]');

    // Notifications
    this.successMessage = page.locator('.success, .alert-success, [role="alert"]').filter({ hasText: /success|submitted/i });
    this.errorMessage = page.locator('.error, .alert-error, .alert-danger, [role="alert"]').filter({ hasText: /error|failed/i });
    this.autoSaveIndicator = page.locator('.auto-save, [data-testid="auto-save"]');
  }

  async navigateTo() {
    await this.page.goto('/dashboard/volunteer/submit');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await this.pageTitle.waitFor({ state: 'visible' });
    await this.titleInput.waitFor({ state: 'visible' });
  }

  async fillStoryForm(storyData: {
    title: string;
    content: string;
    summary?: string;
    language?: string;
    ageGroup?: string;
    category?: string;
    tags?: string[];
  }) {
    // Fill title
    await this.titleInput.fill(storyData.title);

    // Fill content
    await this.contentTextarea.fill(storyData.content);

    // Fill summary if provided
    if (storyData.summary) {
      await this.summaryTextarea.fill(storyData.summary);
    }

    // Select language if provided
    if (storyData.language && await this.languageSelect.isVisible()) {
      await this.languageSelect.selectOption(storyData.language);
    }

    // Select age group if provided
    if (storyData.ageGroup && await this.ageGroupSelect.isVisible()) {
      await this.ageGroupSelect.selectOption(storyData.ageGroup);
    }

    // Select category if provided
    if (storyData.category && await this.categorySelect.isVisible()) {
      await this.categorySelect.selectOption(storyData.category);
    }

    // Add tags if provided
    if (storyData.tags && storyData.tags.length > 0 && await this.tagsInput.isVisible()) {
      await this.tagsInput.fill(storyData.tags.join(', '));
    }
  }

  async saveDraft() {
    await this.saveDraftButton.click();
    await this.page.waitForTimeout(1000); // Wait for save operation
  }

  async togglePreview() {
    const isInPreview = await this.exitPreviewButton.isVisible();

    if (isInPreview) {
      await this.exitPreviewButton.click();
    } else {
      await this.previewButton.click();
    }

    // Wait for mode change
    await this.page.waitForTimeout(500);
  }

  async verifyPreviewMode() {
    await this.previewTitle.waitFor({ state: 'visible' });
    await this.previewContent.waitFor({ state: 'visible' });
    await expect(this.exitPreviewButton).toBeVisible();
  }

  async submitStory() {
    await this.submitButton.click();

    // Wait for either success or error message
    await Promise.race([
      this.successMessage.waitFor({ state: 'visible' }),
      this.errorMessage.waitFor({ state: 'visible' })
    ]);
  }

  async verifySubmissionSuccess() {
    await expect(this.successMessage).toBeVisible();
    // Check if redirected to dashboard
    await expect(this.page).toHaveURL(/\/dashboard\/volunteer/);
  }

  async verifySubmissionInList(title: string) {
    await this.refreshSubmissionsButton.click();
    await this.page.waitForTimeout(1000);

    const submissionItem = this.existingSubmissionsList
      .locator('.submission-item, .border')
      .filter({ hasText: title });

    await expect(submissionItem).toBeVisible();
    return submissionItem;
  }

  async getSubmissionStatus(title: string) {
    const submissionItem = await this.verifySubmissionInList(title);
    const statusBadge = submissionItem.locator('.status, [class*="status"], .badge');
    return await statusBadge.textContent();
  }

  async verifyAutoSave() {
    // Type something to trigger auto-save
    await this.titleInput.fill('Auto-save test');
    await this.page.waitForTimeout(2000);

    // Check for auto-save indicator
    const autoSaveVisible = await this.autoSaveIndicator.isVisible();
    return autoSaveVisible;
  }

  async verifyWritingTips() {
    await expect(this.writingTips).toBeVisible();

    // Check for common tip elements
    const tipElements = await this.writingTips.locator('li, .tip-item').count();
    expect(tipElements).toBeGreaterThan(0);
  }

  async getWordCount(): Promise<number> {
    const contentText = await this.contentTextarea.inputValue();
    return contentText.split(/\s+/).filter(word => word.length > 0).length;
  }

  async verifyFormValidation() {
    // Try to submit empty form
    await this.submitButton.click();

    // Should show validation errors
    const titleError = this.page.locator('.error, .invalid-feedback').first();
    await expect(titleError).toBeVisible();
  }

  async verifyCharacterCount() {
    const longContent = 'A'.repeat(10000);
    await this.contentTextarea.fill(longContent);

    // Check if character count is displayed
    const charCount = this.page.locator('.char-count, .character-count');
    if (await charCount.isVisible()) {
      const countText = await charCount.textContent();
      expect(countText).toContain('10000');
    }
  }
}