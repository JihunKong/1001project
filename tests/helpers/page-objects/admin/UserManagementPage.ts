import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export type SystemRole = 'LEARNER' | 'TEACHER' | 'WRITER' | 'INSTITUTION' | 'STORY_MANAGER' | 'BOOK_MANAGER' | 'CONTENT_ADMIN' | 'ADMIN';

export interface UserData {
  email: string;
  name: string;
  role: SystemRole;
}

export class UserManagementPage extends BasePage {
  get pageTitle(): string {
    return 'User Management';
  }

  get url(): string {
    return '/admin/users';
  }

  private get userRows() {
    return this.page.locator('[data-testid^="user-"], .user-row, tr.user-entry');
  }

  private get roleFilter() {
    return this.page.locator('select[name="role"], [data-testid="role-filter"]');
  }

  private get searchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  private get createUserButton() {
    return this.page.locator('button:has-text("Create User"), button:has-text("Add User")');
  }

  private get emailInput() {
    return this.page.locator('input[name="email"], input[type="email"]');
  }

  private get nameInput() {
    return this.page.locator('input[name="name"]');
  }

  private get roleSelect() {
    return this.page.locator('select[name="role"]');
  }

  private get submitButton() {
    return this.page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]');
  }

  private get paginationNext() {
    return this.page.locator('button:has-text("Next"), [aria-label="Next page"]');
  }

  private get paginationPrev() {
    return this.page.locator('button:has-text("Previous"), [aria-label="Previous page"]');
  }

  async getUserCount(): Promise<number> {
    return await this.userRows.count();
  }

  async filterByRole(role: SystemRole | 'all'): Promise<void> {
    await this.roleFilter.selectOption(role === 'all' ? '' : role);
    await this.waitForPageLoad();
  }

  async searchUser(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  async openCreateUserModal(): Promise<void> {
    await this.createUserButton.click();
    await this.page.waitForTimeout(500);
  }

  async fillUserForm(data: UserData): Promise<void> {
    await this.emailInput.fill(data.email);
    await this.nameInput.fill(data.name);
    await this.roleSelect.selectOption(data.role);
  }

  async submitUserForm(): Promise<void> {
    await this.submitButton.click();
    await this.waitForPageLoad();
  }

  async createUser(data: UserData): Promise<void> {
    await this.openCreateUserModal();
    await this.fillUserForm(data);
    await this.submitUserForm();
  }

  async getUserByEmail(email: string) {
    return this.page.locator(`[data-testid^="user-"]:has-text("${email}"), .user-row:has-text("${email}")`);
  }

  async getAllUserEmails(): Promise<string[]> {
    const emails: string[] = [];
    const count = await this.userRows.count();

    for (let i = 0; i < count; i++) {
      const emailElement = this.userRows.nth(i).locator('.user-email, [data-testid="user-email"]');
      const email = await emailElement.textContent();
      if (email) emails.push(email.trim());
    }

    return emails;
  }

  async changeUserRole(email: string, newRole: SystemRole): Promise<void> {
    const user = await this.getUserByEmail(email);
    const roleSelect = user.locator('select[name="role"], .role-select');

    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption(newRole);
    } else {
      // May need to click edit first
      const editButton = user.locator('button:has-text("Edit"), [aria-label="Edit"]');
      await editButton.click();
      await this.page.waitForTimeout(500);

      await this.roleSelect.selectOption(newRole);
      await this.submitButton.click();
    }

    await this.waitForPageLoad();
  }

  async deactivateUser(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    const deactivateButton = user.locator('button:has-text("Deactivate"), button:has-text("Disable")');

    await deactivateButton.click();

    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.waitForPageLoad();
  }

  async activateUser(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    const activateButton = user.locator('button:has-text("Activate"), button:has-text("Enable")');

    await activateButton.click();
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
}
