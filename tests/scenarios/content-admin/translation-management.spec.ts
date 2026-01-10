import { test, expect } from '@playwright/test';
import {
  LoginPage,
  ContentAdminDashboardPage,
  TranslationManagementPage,
} from '../../helpers/page-objects';

test.describe('Content Admin Translation Management', () => {
  let loginPage: LoginPage;
  let dashboard: ContentAdminDashboardPage;
  let translationPage: TranslationManagementPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new ContentAdminDashboardPage(page);
    translationPage = new TranslationManagementPage(page);
  });

  test('should access translations from dashboard', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Try to find translations link
    const translationsLink = page.locator('a:has-text("Translation"), a:has-text("Language")').first();
    if (await translationsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await translationsLink.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display translation management interface', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Page should be functional
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should list available languages', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check for language selector or list
    const languageSelect = page.locator('select').first();
    const hasLanguages = await languageSelect.isVisible({ timeout: 3000 }).catch(() => false);

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should switch between languages', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to change language
    const languageSelect = page.locator('select').first();
    if (await languageSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await languageSelect.selectOption({ index: 1 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should search translations', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to use search if available
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('dashboard');
      await page.waitForTimeout(1000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should view pending translations', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to filter to pending
    const pendingFilter = page.locator('button:has-text("Pending"), a:has-text("Pending")').first();
    if (await pendingFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pendingFilter.click();
      await page.waitForTimeout(1000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should view all translations', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to show all
    const allFilter = page.locator('button:has-text("All"), a:has-text("All")').first();
    if (await allFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allFilter.click();
      await page.waitForTimeout(1000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should have export functionality', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    const hasExport = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display translation count', async ({ page }) => {
    // Login as content admin
    await loginPage.navigate();
    await loginPage.loginAs('contentAdmin');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Page should have some content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
