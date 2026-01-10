import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface TeacherData {
  email: string;
  name: string;
  department?: string;
}

export class TeacherManagementPage extends BasePage {
  get pageTitle(): string {
    return 'Teacher Management';
  }

  get url(): string {
    return '/dashboard/institution/teachers';
  }

  private get teacherRows() {
    return this.page.locator('[data-testid^="teacher-"], .teacher-row, tr.teacher-entry');
  }

  private get inviteTeacherButton() {
    return this.page.locator('button:has-text("Invite Teacher"), button:has-text("Add Teacher"), a:has-text("Invite")').first();
  }

  private get emailInput() {
    return this.page.locator('input[name="email"], input[type="email"]');
  }

  private get nameInput() {
    return this.page.locator('input[name="name"], input[name="teacherName"]');
  }

  private get departmentInput() {
    return this.page.locator('input[name="department"], select[name="department"]');
  }

  private get submitButton() {
    return this.page.locator('button:has-text("Invite"), button:has-text("Add"), button[type="submit"]');
  }

  private get searchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  private get emptyTeachersMessage() {
    return this.page.locator('[data-testid="empty-teachers"], .empty-state, :has-text("No teachers")');
  }

  async getTeacherCount(): Promise<number> {
    return await this.teacherRows.count();
  }

  async hasTeachers(): Promise<boolean> {
    return (await this.getTeacherCount()) > 0;
  }

  async openInviteModal(): Promise<void> {
    const button = this.inviteTeacherButton;
    const isVisible = await button.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await button.click();
      await this.page.waitForTimeout(1000);
    } else {
      console.log('Invite Teacher button not visible');
    }
  }

  async fillInviteForm(data: TeacherData): Promise<void> {
    await this.emailInput.fill(data.email);
    await this.nameInput.fill(data.name);

    if (data.department) {
      const isSelect = await this.departmentInput.evaluate(el => el.tagName === 'SELECT');
      if (isSelect) {
        await this.departmentInput.selectOption(data.department);
      } else {
        await this.departmentInput.fill(data.department);
      }
    }
  }

  async submitInvite(): Promise<void> {
    await this.submitButton.click();
    await this.waitForPageLoad();
  }

  async inviteTeacher(data: TeacherData): Promise<void> {
    await this.openInviteModal();
    await this.fillInviteForm(data);
    await this.submitInvite();
  }

  async searchTeacher(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async getAllTeacherNames(): Promise<string[]> {
    const names: string[] = [];
    const count = await this.teacherRows.count();

    for (let i = 0; i < count; i++) {
      const nameElement = this.teacherRows.nth(i).locator('.teacher-name, [data-testid="teacher-name"]');
      const name = await nameElement.textContent();
      if (name) names.push(name.trim());
    }

    return names;
  }

  async getTeacherByName(name: string) {
    return this.page.locator(`[data-testid^="teacher-"]:has-text("${name}"), .teacher-row:has-text("${name}")`);
  }

  async removeTeacher(name: string): Promise<void> {
    const teacher = await this.getTeacherByName(name);
    const removeButton = teacher.locator('button:has-text("Remove"), [aria-label="Remove"]');

    await removeButton.click();

    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.waitForPageLoad();
  }

  async viewTeacherClasses(name: string): Promise<void> {
    const teacher = await this.getTeacherByName(name);
    const viewButton = teacher.locator('button:has-text("View"), a:has-text("Classes")');

    await viewButton.click();
    await this.waitForPageLoad();
  }

  async verifyEmptyTeachers(): Promise<void> {
    await expect(this.emptyTeachersMessage).toBeVisible();
  }
}
