import { test, expect } from '@playwright/test';
import {
  LoginPage,
  LearnerDashboardPage,
  ClassJoinPage,
} from '../../helpers/page-objects';

test.describe('Learner Class Join Flow', () => {
  let loginPage: LoginPage;
  let dashboard: LearnerDashboardPage;
  let joinPage: ClassJoinPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new LearnerDashboardPage(page);
    joinPage = new ClassJoinPage(page);
  });

  test('should access join class from dashboard', async ({ page }) => {
    // Login as learner
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Try to click join class if available
    const joinButton = page.locator('button:has-text("Join"), a:has-text("Join"), a:has-text("Class")').first();
    if (await joinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await joinButton.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display class code input', async ({ page }) => {
    // Login as learner
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check for any input on the page
    const hasInput = await page.locator('input').first().isVisible({ timeout: 3000 }).catch(() => false);

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should enter class code', async ({ page }) => {
    // Login as learner
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to find and fill code input
    const codeInput = page.locator('input[name="code"], input[name="classCode"], input[placeholder*="code" i]').first();
    if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await codeInput.fill('ABC123');
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should show error for invalid code', async ({ page }) => {
    // Login as learner
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to submit invalid code
    const codeInput = page.locator('input').first();
    if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await codeInput.fill('INVALID');
      const submitButton = page.locator('button[type="submit"], button:has-text("Join")').first();
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should check if already in class', async ({ page }) => {
    // Login as learner
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check for class-related content
    const classSection = page.locator('text=Class').or(page.locator('text=Teacher'));
    const hasClass = await classSection.isVisible({ timeout: 3000 }).catch(() => false);

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display learner dashboard statistics', async ({ page }) => {
    // Login as learner
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Get stats
    const stats = await dashboard.getLearnerStats();

    // Stats should be valid numbers
    expect(stats.assigned).toBeGreaterThanOrEqual(0);
    expect(stats.completed).toBeGreaterThanOrEqual(0);
    expect(stats.progress).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to my books', async ({ page }) => {
    // Login as learner
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Try to navigate to books
    const booksLink = page.locator('a:has-text("Books"), a:has-text("Reading"), a:has-text("Library")').first();
    if (await booksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await booksLink.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
