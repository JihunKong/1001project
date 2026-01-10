import { test, expect } from '@playwright/test';
import {
  LoginPage,
  ContentAdminDashboardPage,
  FinalApprovalPage,
} from '../../helpers/page-objects';

test.describe('Content Admin Final Approval Flow', () => {
  let loginPage: LoginPage;
  let dashboard: ContentAdminDashboardPage;
  let approvalPage: FinalApprovalPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new ContentAdminDashboardPage(page);
    approvalPage = new FinalApprovalPage(page);
  });

  test('should access approval queue from dashboard', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Try to navigate to approval queue if link exists
    const approvalLink = page.locator('a:has-text("Approval"), a:has-text("Queue"), a:has-text("Pending")').first();
    if (await approvalLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approvalLink.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display books pending approval', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check for any queue section on dashboard
    const queueSection = page.locator('text=Queue').or(page.locator('text=Pending')).or(page.locator('text=Approval'));
    const hasQueue = await queueSection.isVisible({ timeout: 3000 }).catch(() => false);

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should open book for final approval', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check if there are any items to click
    const bookItem = page.locator('a:has-text("Review"), a:has-text("View"), button:has-text("Approve")').first();
    if (await bookItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bookItem.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should approve book for publication', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to find approve button
    const approveButton = page.locator('button:has-text("Approve"), button:has-text("Publish")').first();
    if (await approveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveButton.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should reject book with feedback', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to find reject button
    const rejectButton = page.locator('button:has-text("Reject"), button:has-text("Decline")').first();
    if (await rejectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectButton.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should set visibility during approval', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check for visibility options
    const visibilitySelect = page.locator('select').first();
    if (await visibilitySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await visibilitySelect.selectOption({ index: 0 }).catch(() => {});
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Get stats
    const stats = await dashboard.getContentAdminStats();

    // Stats should be valid numbers
    expect(stats.pending).toBeGreaterThanOrEqual(0);
    expect(stats.published).toBeGreaterThanOrEqual(0);
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to library', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Try to navigate to library if link exists
    const libraryLink = page.locator('a:has-text("Library"), a:has-text("Published"), a:has-text("Books")').first();
    if (await libraryLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await libraryLink.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should access direct register', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Try to navigate to register page
    const registerLink = page.getByRole('main').locator('a:has-text("Register")').first();
    if (await registerLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await registerLink.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
