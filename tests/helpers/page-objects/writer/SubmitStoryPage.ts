import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface StoryFormData {
  title: string;
  authorAlias?: string;
  summary: string;
  content: string;
  language?: string;
  ageRange?: string;
  category?: string;
  tags?: string[];
}

export class SubmitStoryPage extends BasePage {
  get pageTitle(): string {
    return 'Submit Story';
  }

  get url(): string {
    return '/dashboard/writer/submit-text';
  }

  private get titleInput() {
    return this.page.locator('input[name="title"], input[placeholder*="title" i]');
  }

  private get authorAliasInput() {
    return this.page.locator('input[name="authorAlias"], input[name="authorName"], input[placeholder*="author" i]');
  }

  private get summaryInput() {
    return this.page.locator('textarea[name="summary"], textarea[placeholder*="summary" i]');
  }

  private get contentEditor() {
    return this.page.locator('.ProseMirror, [contenteditable="true"], .tiptap, .rich-text-editor');
  }

  private get languageSelect() {
    return this.page.locator('select[name="language"], [data-testid="language-select"]');
  }

  private get ageRangeSelect() {
    return this.page.locator('select[name="ageRange"], [data-testid="age-range-select"]');
  }

  private get categorySelect() {
    return this.page.locator('select[name="category"], [data-testid="category-select"]');
  }

  private get tagsInput() {
    return this.page.locator('input[name="tags"], [data-testid="tags-input"]');
  }

  private get saveDraftButton() {
    return this.page.locator('button:has-text("Save Draft"), button:has-text("Save")');
  }

  private get submitButton() {
    return this.page.locator('button:has-text("Submit"), button:has-text("Submit for Review")');
  }

  private get previewButton() {
    return this.page.locator('button:has-text("Preview")');
  }

  private get wordCount() {
    return this.page.locator('[data-testid="word-count"], .word-count, :text("Word Count") + *, :has-text("Word Count"):not(:has(*:has-text("Word Count")))');
  }

  private get formError() {
    return this.page.locator('.form-error, .error-message, [role="alert"]');
  }

  private get successMessage() {
    return this.page.locator('.success-message, [role="status"]:has-text("success")');
  }

  async fillStoryForm(data: StoryFormData): Promise<void> {
    // Fill title if input exists
    if (await this.titleInput.isVisible()) {
      await this.titleInput.fill(data.title);
    }

    // Fill author alias if input exists
    if (data.authorAlias && await this.authorAliasInput.isVisible().catch(() => false)) {
      await this.authorAliasInput.fill(data.authorAlias);
    }

    // Fill summary if input exists
    if (data.summary && await this.summaryInput.isVisible().catch(() => false)) {
      await this.summaryInput.fill(data.summary);
    }

    // Wait for editor to load (no longer showing "Loading editor...")
    await this.page.waitForSelector('.ProseMirror, [contenteditable="true"], .tiptap', { timeout: 15000 });

    // Fill content in rich text editor
    const editor = this.page.locator('.ProseMirror, [contenteditable="true"], .tiptap').first();
    if (await editor.isVisible()) {
      await editor.click();
      await this.page.waitForTimeout(500);
      await this.page.keyboard.type(data.content);
    }

    // Optional fields - only fill if visible
    if (data.language && await this.languageSelect.isVisible().catch(() => false)) {
      await this.languageSelect.selectOption(data.language);
    }

    if (data.ageRange && await this.ageRangeSelect.isVisible().catch(() => false)) {
      await this.ageRangeSelect.selectOption(data.ageRange);
    }

    if (data.category && await this.categorySelect.isVisible().catch(() => false)) {
      await this.categorySelect.selectOption(data.category);
    }

    if (data.tags && data.tags.length > 0 && await this.tagsInput.isVisible().catch(() => false)) {
      for (const tag of data.tags) {
        await this.tagsInput.fill(tag);
        await this.page.keyboard.press('Enter');
      }
    }
  }

  async saveDraft(): Promise<void> {
    await this.saveDraftButton.click();
    await this.waitForPageLoad();
  }

  async submitForReview(): Promise<void> {
    await this.submitButton.click();

    // Handle Terms & Disclosures modal if it appears
    const termsModal = this.page.locator('[role="dialog"]:has-text("Terms"), .modal:has-text("Terms")');
    if (await termsModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Check the agreement checkboxes using specific IDs or labels
      const agreeCheckbox = this.page.locator('#agree-terms, input[id*="agree"]').first();
      const originalWorkCheckbox = this.page.locator('#confirm-original, input[id*="original"]').first();

      if (await agreeCheckbox.isVisible()) {
        await agreeCheckbox.check();
      }
      if (await originalWorkCheckbox.isVisible()) {
        await originalWorkCheckbox.check();
      }

      // Click I Agree button
      const agreeButton = this.page.locator('button:has-text("I Agree"), button:has-text("Agree")');
      await agreeButton.click();

      // Wait for modal to close or page to navigate
      await this.page.waitForTimeout(1000);
      await Promise.race([
        termsModal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {}),
        this.page.waitForURL(/stories|dashboard/, { timeout: 15000 }).catch(() => {}),
      ]);
    }

    await this.waitForPageLoad();
  }

  async createAndSaveDraft(data: StoryFormData): Promise<void> {
    await this.navigate();
    await this.fillStoryForm(data);
    await this.saveDraft();
  }

  async createAndSubmit(data: StoryFormData): Promise<void> {
    await this.navigate();
    await this.fillStoryForm(data);
    await this.submitForReview();
  }

  async getWordCount(): Promise<number> {
    // Try multiple selectors to find word count
    const selectors = [
      '[data-testid="word-count"]',
      '.word-count',
      'text=/Word Count.*\\d+/',
    ];

    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          const text = await element.textContent();
          if (text) {
            const match = text.match(/\d+/);
            if (match) return parseInt(match[0]);
          }
        }
      } catch {
        continue;
      }
    }

    // Try to find word count in Details section
    const detailsSection = this.page.locator('text=Word Count').locator('..').locator('xpath=following-sibling::*[1] | following::*[1]');
    if (await detailsSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await detailsSection.textContent();
      if (text) {
        const match = text.match(/\d+/);
        if (match) return parseInt(match[0]);
      }
    }

    // Last resort: search entire page for word count pattern
    const pageContent = await this.page.content();
    const wordCountMatch = pageContent.match(/Word Count[:\s]*(\d+)/i);
    if (wordCountMatch) {
      return parseInt(wordCountMatch[1]);
    }

    return 0;
  }

  async hasFormError(): Promise<boolean> {
    return await this.formError.isVisible();
  }

  async getFormError(): Promise<string> {
    return await this.formError.textContent() || '';
  }

  async verifySubmissionSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  async verifyRedirectToStories(): Promise<void> {
    await this.waitForUrl(/\/stories|\/story/);
  }

  async previewStory(): Promise<void> {
    await this.previewButton.click();
    await this.waitForPageLoad();
  }

  async isFormValid(): Promise<boolean> {
    let hasTitle = false;
    let hasContent = false;

    if (await this.titleInput.isVisible()) {
      const titleValue = await this.titleInput.inputValue();
      hasTitle = titleValue.length > 0;
    }

    if (await this.contentEditor.isVisible()) {
      const contentText = await this.contentEditor.textContent();
      hasContent = (contentText?.length || 0) > 0;
    }

    return hasTitle && hasContent;
  }
}
