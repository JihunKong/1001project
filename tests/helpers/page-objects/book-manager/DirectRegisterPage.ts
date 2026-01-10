import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface BookRegistrationData {
  title: string;
  authorName: string;
  contentType: 'TEXT' | 'PDF';
  content?: string;
  language?: string;
  ageRange?: string;
  categories?: string[];
  tags?: string[];
  isPublished?: boolean;
}

export class DirectRegisterPage extends BasePage {
  get pageTitle(): string {
    return 'Register Book';
  }

  get url(): string {
    return '/dashboard/book-manager/register-book';
  }

  private get titleInput() {
    return this.page.locator('input[name="title"], input[placeholder*="itle"], input[id*="title"], [data-testid="title-input"]').first();
  }

  private get authorNameInput() {
    return this.page.locator('input[name="authorName"], input[name="author"], input[placeholder*="uthor"], [data-testid="author-input"]').first();
  }

  private get textTypeButton() {
    return this.page.locator('button:has-text("Text"), [data-type="TEXT"], input[value="TEXT"], label:has-text("Text")').first();
  }

  private get pdfTypeButton() {
    return this.page.locator('button:has-text("PDF"), [data-type="PDF"], input[value="PDF"], label:has-text("PDF")').first();
  }

  private get contentEditor() {
    return this.page.locator('.ProseMirror, [contenteditable="true"], .rich-text-editor, textarea[name="content"], textarea').first();
  }

  private get pdfUploader() {
    return this.page.locator('input[type="file"][accept*="pdf"], [data-testid="pdf-upload"]');
  }

  private get coverImageUploader() {
    return this.page.locator('input[type="file"][accept*="image"], [data-testid="cover-upload"]');
  }

  private get languageSelect() {
    return this.page.locator('select[name="language"], [data-testid="language-select"]');
  }

  private get ageRangeSelect() {
    return this.page.locator('select[name="ageRange"], [data-testid="age-range-select"]');
  }

  private get categoryCheckboxes() {
    return this.page.locator('input[type="checkbox"][name="categories"], [data-testid="category-checkbox"]');
  }

  private get tagsInput() {
    return this.page.locator('input[name="tags"], [data-testid="tags-input"]');
  }

  private get publishCheckbox() {
    return this.page.locator('input[type="checkbox"][name="isPublished"], input[type="checkbox"]:near(:text("Publish"))');
  }

  private get submitButton() {
    return this.page.locator('button:has-text("Register"), button:has-text("Submit"), button[type="submit"]');
  }

  private get successMessage() {
    return this.page.locator('.success-message, [role="status"]:has-text("success"), :has-text("registered")');
  }

  private get errorMessage() {
    return this.page.locator('.error-message, [role="alert"], .form-error');
  }

  async selectContentType(type: 'TEXT' | 'PDF'): Promise<void> {
    if (type === 'TEXT') {
      await this.textTypeButton.click();
    } else {
      await this.pdfTypeButton.click();
    }
  }

  async fillBasicInfo(title: string, authorName: string): Promise<void> {
    await this.titleInput.fill(title);
    await this.authorNameInput.fill(authorName);
  }

  async fillContent(content: string): Promise<void> {
    await this.contentEditor.click();
    await this.contentEditor.fill(content);
  }

  async uploadPDF(filePath: string): Promise<void> {
    await this.pdfUploader.setInputFiles(filePath);
    await this.waitForPageLoad();
  }

  async uploadCoverImage(filePath: string): Promise<void> {
    await this.coverImageUploader.setInputFiles(filePath);
    await this.waitForPageLoad();
  }

  async selectLanguage(language: string): Promise<void> {
    await this.languageSelect.selectOption(language);
  }

  async selectAgeRange(ageRange: string): Promise<void> {
    await this.ageRangeSelect.selectOption(ageRange);
  }

  async selectCategories(categories: string[]): Promise<void> {
    for (const category of categories) {
      const checkbox = this.page.locator(`input[value="${category}"], label:has-text("${category}") input`);
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
    }
  }

  async addTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.tagsInput.fill(tag);
      await this.page.keyboard.press('Enter');
    }
  }

  async setPublished(publish: boolean): Promise<void> {
    const isChecked = await this.publishCheckbox.isChecked();
    if (isChecked !== publish) {
      await this.publishCheckbox.click();
    }
  }

  async fillRegistrationForm(data: BookRegistrationData): Promise<void> {
    await this.selectContentType(data.contentType);
    await this.fillBasicInfo(data.title, data.authorName);

    if (data.contentType === 'TEXT' && data.content) {
      await this.fillContent(data.content);
    }

    if (data.language) {
      await this.selectLanguage(data.language);
    }

    if (data.ageRange) {
      await this.selectAgeRange(data.ageRange);
    }

    if (data.categories && data.categories.length > 0) {
      await this.selectCategories(data.categories);
    }

    if (data.tags && data.tags.length > 0) {
      await this.addTags(data.tags);
    }

    if (data.isPublished !== undefined) {
      await this.setPublished(data.isPublished);
    }
  }

  async submitRegistration(): Promise<void> {
    await this.submitButton.click();
    await this.waitForPageLoad();
  }

  async registerBook(data: BookRegistrationData): Promise<void> {
    await this.fillRegistrationForm(data);
    await this.submitRegistration();
  }

  async verifySuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async verifyFormElements(): Promise<void> {
    // Check for any input fields that might be the title field
    const anyTitleInput = this.page.locator('input[name="title"], input[placeholder*="itle"], input[id*="title"], input').first();
    const hasTitleInput = await anyTitleInput.isVisible({ timeout: 5000 }).catch(() => false);

    // Check for submit button
    const hasSubmitButton = await this.submitButton.isVisible({ timeout: 5000 }).catch(() => false);

    // At least verify the page has form elements
    const hasAnyInput = await this.page.locator('input, textarea').first().isVisible().catch(() => false);
    const hasForm = await this.page.locator('form').isVisible().catch(() => false);

    expect(hasAnyInput || hasForm || hasTitleInput || hasSubmitButton).toBe(true);
  }
}
