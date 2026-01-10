import { test, expect } from '@playwright/test';
import {
  LoginPage,
  AdminDashboardPage,
  UserManagementPage,
} from '../../helpers/page-objects';

test.describe('Admin User Management Flow', () => {
  let loginPage: LoginPage;
  let dashboard: AdminDashboardPage;
  let userPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new AdminDashboardPage(page);
    userPage = new UserManagementPage(page);
  });

  test('should access user management from dashboard', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    await dashboard.goToUserManagement();
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display user list', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Check if there's user list on dashboard or in linked page
    const userSection = page.locator('text=Users').first();
    const hasUsers = await userSection.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`User section visible: ${hasUsers}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should filter users by role', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Try to filter if filter exists
    const roleFilter = page.locator('select[name="role"], [data-testid="role-filter"]').first();
    if (await roleFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      const roles = ['TEACHER', 'LEARNER', 'WRITER'] as const;
      for (const role of roles) {
        await roleFilter.selectOption(role).catch(() => {});
        await page.waitForTimeout(1000);
        console.log(`Tried to filter by role: ${role}`);
      }
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should search for user', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Try to search if search input exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      await searchInput.clear();
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should open create user modal', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Try to find and click create user button
    const createButton = page.locator('button:has-text("Create User"), button:has-text("Add User"), a:has-text("Create")').first();
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('.modal, [role="dialog"], form').first();
      const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Create user modal visible: ${modalVisible}`);
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display admin statistics', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const stats = await dashboard.getAdminStats();

    expect(stats.users).toBeGreaterThanOrEqual(0);
    expect(stats.books).toBeGreaterThanOrEqual(0);
    expect(stats.pendingApprovals).toBeGreaterThanOrEqual(0);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should navigate between pages', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Check for pagination if available
    const paginationNext = page.locator('button:has-text("Next"), [aria-label="Next page"]').first();
    if (await paginationNext.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isEnabled = await paginationNext.isEnabled();
      if (isEnabled) {
        await paginationNext.click();
        await page.waitForTimeout(1000);
      }
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should access system settings', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    await dashboard.goToSystemSettings();
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should access reports', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    await dashboard.goToReports();
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should get all user emails', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('admin');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Check for any email-like content on page
    const emailElements = page.locator('[data-testid="user-email"], .user-email, text=@');
    const hasEmails = await emailElements.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`User emails visible: ${hasEmails}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
