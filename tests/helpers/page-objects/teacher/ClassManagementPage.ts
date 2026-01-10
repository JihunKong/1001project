import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface ClassData {
  name: string;
  description?: string;
  gradeLevel?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  code: string;
  studentCount: number;
}

export class ClassManagementPage extends BasePage {
  get pageTitle(): string {
    return 'My Classes';
  }

  get url(): string {
    return '/dashboard/teacher/classes';
  }

  private get classCards() {
    return this.page.locator('[data-testid^="class-"], .class-card, .class-item');
  }

  private get createClassButton() {
    return this.page.locator('button:has-text("Create Class"), button:has-text("New Class"), a:has-text("Create")').first();
  }

  private get classNameInput() {
    return this.page.locator('input[name="name"], input[name="className"], input[placeholder*="class name" i]');
  }

  private get classDescriptionInput() {
    return this.page.locator('textarea[name="description"], input[name="description"]');
  }

  private get gradeLevelSelect() {
    return this.page.locator('select[name="gradeLevel"], [data-testid="grade-select"]');
  }

  private get submitButton() {
    return this.page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]');
  }

  private get classCodeDisplay() {
    return this.page.locator('[data-testid="class-code"], .class-code, code');
  }

  private get emptyClassesMessage() {
    return this.page.locator('[data-testid="empty-classes"], .empty-state, :has-text("No classes")');
  }

  async getClassCount(): Promise<number> {
    return await this.classCards.count();
  }

  async hasClasses(): Promise<boolean> {
    return (await this.getClassCount()) > 0;
  }

  async getClassByName(name: string) {
    return this.page.locator(`[data-testid^="class-"]:has-text("${name}"), .class-card:has-text("${name}")`);
  }

  async clickClass(name: string): Promise<void> {
    const classCard = await this.getClassByName(name);
    await classCard.click();
    await this.waitForPageLoad();
  }

  async openCreateClassModal(): Promise<void> {
    const button = this.createClassButton;
    const isVisible = await button.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await button.click();
      await this.page.waitForTimeout(1000);
    } else {
      console.log('Create Class button not visible');
    }
  }

  async fillClassForm(data: ClassData): Promise<void> {
    await this.classNameInput.fill(data.name);

    if (data.description) {
      await this.classDescriptionInput.fill(data.description);
    }

    if (data.gradeLevel) {
      await this.gradeLevelSelect.selectOption(data.gradeLevel);
    }
  }

  async submitClassForm(): Promise<void> {
    await this.submitButton.click();
    await this.waitForPageLoad();
  }

  async createClass(data: ClassData): Promise<void> {
    await this.openCreateClassModal();
    await this.fillClassForm(data);
    await this.submitClassForm();
  }

  async getClassCode(className: string): Promise<string> {
    const classCard = await this.getClassByName(className);
    const codeElement = classCard.locator('.class-code, [data-testid="class-code"], code');

    if (await codeElement.isVisible()) {
      return (await codeElement.textContent()) || '';
    }

    // Click class to see code
    await classCard.click();
    await this.waitForPageLoad();

    return (await this.classCodeDisplay.textContent()) || '';
  }

  async getAllClassNames(): Promise<string[]> {
    const names: string[] = [];
    const count = await this.classCards.count();

    for (let i = 0; i < count; i++) {
      const nameElement = this.classCards.nth(i).locator('.class-name, h3, h4, [data-testid="class-name"]');
      const name = await nameElement.textContent();
      if (name) names.push(name.trim());
    }

    return names;
  }

  async deleteClass(name: string): Promise<void> {
    const classCard = await this.getClassByName(name);
    const deleteButton = classCard.locator('button:has-text("Delete"), [aria-label="Delete"]');

    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.waitForPageLoad();
  }

  async verifyEmptyClasses(): Promise<void> {
    await expect(this.emptyClassesMessage).toBeVisible();
  }

  async getStudentCount(className: string): Promise<number> {
    const classCard = await this.getClassByName(className);
    const countElement = classCard.locator('.student-count, [data-testid="student-count"]');

    const countText = await countElement.textContent();
    if (!countText) return 0;

    const match = countText.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }
}
