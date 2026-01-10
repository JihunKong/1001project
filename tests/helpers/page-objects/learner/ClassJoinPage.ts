import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ClassJoinPage extends BasePage {
  get pageTitle(): string {
    return 'Join Class';
  }

  get url(): string {
    return '/dashboard/learner/join-class';
  }

  private get classCodeInput() {
    return this.page.locator('input[name="classCode"], input[name="code"], input[placeholder*="code" i]');
  }

  private get joinButton() {
    return this.page.locator('button:has-text("Join"), button:has-text("Submit"), button[type="submit"]');
  }

  private get successMessage() {
    return this.page.locator('.success-message, [role="status"]:has-text("joined"), :has-text("Successfully joined")');
  }

  private get errorMessage() {
    return this.page.locator('.error-message, [role="alert"], .form-error');
  }

  private get currentClassInfo() {
    return this.page.locator('[data-testid="current-class"], .current-class, .class-info');
  }

  async enterClassCode(code: string): Promise<void> {
    await this.classCodeInput.fill(code);
  }

  async submitJoinRequest(): Promise<void> {
    await this.joinButton.click();
    await this.waitForPageLoad();
  }

  async joinClass(code: string): Promise<void> {
    await this.enterClassCode(code);
    await this.submitJoinRequest();
  }

  async verifyJoinSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || '';
  }

  async isInClass(): Promise<boolean> {
    return await this.currentClassInfo.isVisible();
  }

  async getCurrentClassName(): Promise<string> {
    if (await this.isInClass()) {
      return (await this.currentClassInfo.textContent()) || '';
    }
    return '';
  }

  async leaveClass(): Promise<void> {
    const leaveButton = this.page.locator('button:has-text("Leave"), button:has-text("Leave Class")');

    if (await leaveButton.isVisible()) {
      await leaveButton.click();

      const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await this.waitForPageLoad();
    }
  }
}
