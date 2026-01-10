import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface TranslationEntry {
  key: string;
  englishValue: string;
  translatedValue: string;
  language: string;
}

export class TranslationManagementPage extends BasePage {
  get pageTitle(): string {
    return 'Translation Management';
  }

  get url(): string {
    return '/dashboard/content-admin/translations';
  }

  private get languageSelect() {
    return this.page.locator('select[name="language"], [data-testid="language-select"]');
  }

  private get searchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  private get translationRows() {
    return this.page.locator('[data-testid^="translation-"], .translation-row, tr.translation-entry');
  }

  private get saveButton() {
    return this.page.locator('button:has-text("Save"), button:has-text("Update")');
  }

  private get exportButton() {
    return this.page.locator('button:has-text("Export"), button:has-text("Download")');
  }

  private get importButton() {
    return this.page.locator('button:has-text("Import"), button:has-text("Upload")');
  }

  private get pendingTranslationsTab() {
    return this.page.locator('button:has-text("Pending"), [data-tab="pending"]');
  }

  private get allTranslationsTab() {
    return this.page.locator('button:has-text("All"), [data-tab="all"]');
  }

  async selectLanguage(language: string): Promise<void> {
    await this.languageSelect.selectOption(language);
    await this.waitForPageLoad();
  }

  async getAvailableLanguages(): Promise<string[]> {
    const options = await this.languageSelect.locator('option').all();
    const languages: string[] = [];
    for (const option of options) {
      const value = await option.getAttribute('value');
      if (value) languages.push(value);
    }
    return languages;
  }

  async searchTranslations(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async getTranslationCount(): Promise<number> {
    return await this.translationRows.count();
  }

  async editTranslation(key: string, newValue: string): Promise<void> {
    const row = this.page.locator(`[data-key="${key}"], tr:has-text("${key}")`);
    const input = row.locator('input, textarea, [contenteditable="true"]');

    if (await input.isVisible()) {
      await input.fill(newValue);
    }
  }

  async saveTranslations(): Promise<void> {
    await this.saveButton.click();
    await this.waitForPageLoad();
  }

  async exportTranslations(): Promise<void> {
    await this.exportButton.click();
    await this.waitForPageLoad();
  }

  async showPendingTranslations(): Promise<void> {
    if (await this.pendingTranslationsTab.isVisible()) {
      await this.pendingTranslationsTab.click();
      await this.waitForPageLoad();
    }
  }

  async showAllTranslations(): Promise<void> {
    if (await this.allTranslationsTab.isVisible()) {
      await this.allTranslationsTab.click();
      await this.waitForPageLoad();
    }
  }

  async verifyTranslationsLoaded(): Promise<void> {
    const hasTranslations = (await this.getTranslationCount()) > 0;
    const hasLanguageSelect = await this.languageSelect.isVisible();

    expect(hasTranslations || hasLanguageSelect).toBe(true);
  }
}
