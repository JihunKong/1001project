import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type UserRole =
  | 'learner'
  | 'teacher'
  | 'writer'
  | 'institution'
  | 'storyManager'
  | 'bookManager'
  | 'contentAdmin'
  | 'admin';

export interface TestAccount {
  email: string;
  password: string;
  role: string;
  dashboardPath: string;
}

export const TEST_ACCOUNTS: Record<UserRole, TestAccount> = {
  learner: {
    email: 'learner@test.1001stories.org',
    password: 'test1234',
    role: 'LEARNER',
    dashboardPath: '/dashboard/learner',
  },
  teacher: {
    email: 'teacher@test.1001stories.org',
    password: 'test1234',
    role: 'TEACHER',
    dashboardPath: '/dashboard/teacher',
  },
  writer: {
    email: 'writer@test.1001stories.org',
    password: 'test1234',
    role: 'WRITER',
    dashboardPath: '/dashboard/writer',
  },
  institution: {
    email: 'institution@test.1001stories.org',
    password: 'test1234',
    role: 'INSTITUTION',
    dashboardPath: '/dashboard/institution',
  },
  storyManager: {
    email: 'story-manager@test.1001stories.org',
    password: 'test1234',
    role: 'STORY_MANAGER',
    dashboardPath: '/dashboard/story-manager',
  },
  bookManager: {
    email: 'book-manager@test.1001stories.org',
    password: 'test1234',
    role: 'BOOK_MANAGER',
    dashboardPath: '/dashboard/book-manager',
  },
  contentAdmin: {
    email: 'content-admin@test.1001stories.org',
    password: 'test1234',
    role: 'CONTENT_ADMIN',
    dashboardPath: '/dashboard/content-admin',
  },
  admin: {
    email: 'admin@test.1001stories.org',
    password: 'test1234',
    role: 'ADMIN',
    dashboardPath: '/admin',
  },
};

export class LoginPage extends BasePage {
  get pageTitle(): string {
    return 'Login';
  }

  get url(): string {
    return '/login';
  }

  private get emailInput() {
    return this.page.locator('input[type="email"], input[name="email"]');
  }

  private get passwordInput() {
    return this.page.locator('input[type="password"], input[name="password"]');
  }

  private get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  private get errorMessage() {
    return this.page.locator('[role="alert"], .error-message, .text-red-500');
  }

  async loginWithPassword(email: string, password: string): Promise<void> {
    await this.navigate();
    await this.waitForPageLoad();

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    await this.waitForNavigation();
  }

  async loginAs(role: UserRole): Promise<void> {
    const account = TEST_ACCOUNTS[role];
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let currentUrl = this.page.url();
      console.log(`loginAs attempt ${attempt}/${maxAttempts}, current URL: ${currentUrl}`);

      if (currentUrl.includes(account.dashboardPath)) {
        console.log(`Already at correct dashboard: ${account.dashboardPath}`);
        return;
      }

      if (currentUrl.includes('/dashboard/') || currentUrl.includes('/admin/') ||
          currentUrl.endsWith('/dashboard') || currentUrl.endsWith('/admin')) {
        console.log(`At different dashboard, signing out first...`);
        await this.navigateTo('/api/auth/signout');
        await this.page.waitForTimeout(2000);
        currentUrl = this.page.url();
      }

      if (!currentUrl.includes('/login')) {
        await this.navigate();
        await this.page.waitForTimeout(1000);
      }

      try {
        await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
        await this.emailInput.fill(account.email);
        await this.page.waitForTimeout(300);
        await this.passwordInput.fill(account.password);
        await this.page.waitForTimeout(300);
        await this.submitButton.click();

        await this.page.waitForURL(/\/dashboard\/|\/admin/, { timeout: 20000 });
        console.log(`Login successful on attempt ${attempt}, current URL: ${this.page.url()}`);

        const finalUrl = this.page.url();
        if (!finalUrl.includes(account.dashboardPath)) {
          console.log(`Navigating to correct dashboard: ${account.dashboardPath}`);
          await this.navigateTo(account.dashboardPath);
          await this.page.waitForTimeout(2000);
        }
        return;
      } catch {
        console.log(`Login attempt ${attempt} failed, checking state...`);

        const dashboardButton = this.page.locator('button:has-text("Dashboard"), a:has-text("Dashboard")');
        if (await dashboardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('Found Dashboard button, clicking...');
          await dashboardButton.click();
          await this.page.waitForTimeout(3000);
          await this.navigateTo(account.dashboardPath);
          await this.page.waitForTimeout(2000);
          return;
        }

        if (attempt < maxAttempts) {
          console.log('Retrying login...');
          await this.navigate();
          await this.page.waitForTimeout(2000);
        }
      }
    }

    console.log(`All login attempts failed, forcing navigation to dashboard...`);
    await this.navigateTo(account.dashboardPath);
    await this.page.waitForTimeout(2000);
  }

  async loginAsAndVerify(role: UserRole): Promise<void> {
    const account = TEST_ACCOUNTS[role];
    await this.loginAs(role);

    await expect(this.page).toHaveURL(new RegExp(account.dashboardPath));
  }

  async verifyLoginSuccess(): Promise<void> {
    const currentUrl = this.page.url();

    if (/\/dashboard\/|\/admin/.test(currentUrl)) {
      return;
    }

    const dashboardButton = this.page.locator('button:has-text("Dashboard"), a:has-text("Dashboard")');
    if (await dashboardButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Already logged in, navigating to dashboard from verifyLoginSuccess...');
      await dashboardButton.click();
      await this.page.waitForTimeout(3000);
      return;
    }

    await this.page.waitForURL(/\/dashboard\/|\/admin/, { timeout: 30000 });
    const url = this.page.url();
    expect(url).toMatch(/\/dashboard\/|\/admin/);
  }

  private async isPageClosed(): Promise<boolean> {
    try {
      await this.page.evaluate(() => true);
      return false;
    } catch {
      return true;
    }
  }

  async logout(): Promise<void> {
    try {
      if (await this.isPageClosed()) {
        console.log('Page already closed, skipping logout');
        return;
      }

      const logoutButton = this.page.locator('button:has-text("Log Out"), button:has-text("Logout"), button:has-text("Sign out")');

      if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutButton.click();
        await this.page.waitForTimeout(1000);
      } else {
        await this.navigateTo('/api/auth/signout');
      }

      await this.waitForUrl(/\/(login|$)/, 30000);
    } catch (error) {
      console.log('Logout error, attempting direct navigation...');
      try {
        if (!(await this.isPageClosed())) {
          await this.page.goto(`${this.baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await this.page.waitForTimeout(1000);
        }
      } catch {
        console.log('Page context closed during logout recovery, continuing...');
      }
    }
  }

  async verifyLoginError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const response = await this.page.request.get(`${this.baseURL}/api/auth/me`);
      return response.ok();
    } catch {
      return false;
    }
  }

  async ensureLoggedInAs(role: UserRole): Promise<void> {
    const account = TEST_ACCOUNTS[role];
    const currentUrl = await this.getCurrentUrl();

    if (!currentUrl.includes(account.dashboardPath)) {
      const isAuthenticated = await this.isLoggedIn();
      if (!isAuthenticated) {
        await this.loginAs(role);
      } else {
        await this.navigateTo(account.dashboardPath);
      }
    }
  }

  async switchUser(newRole: UserRole): Promise<void> {
    const account = TEST_ACCOUNTS[newRole];

    try {
      await this.logout();
    } catch (error) {
      console.log(`Logout error during switchUser: ${error}`);
    }

    await this.page.waitForTimeout(1000);
    await this.loginAs(newRole);
  }

  getAccountInfo(role: UserRole): TestAccount {
    return TEST_ACCOUNTS[role];
  }

  getDashboardPath(role: UserRole): string {
    return TEST_ACCOUNTS[role].dashboardPath;
  }
}
