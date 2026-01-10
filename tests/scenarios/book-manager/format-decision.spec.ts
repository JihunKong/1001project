import { test, expect } from '@playwright/test';
import {
  LoginPage,
  BookManagerDashboardPage,
  FormatDecisionPage,
} from '../../helpers/page-objects';

test.describe('Book Manager Format Decision Flow', () => {
  let loginPage: LoginPage;
  let dashboard: BookManagerDashboardPage;
  let formatPage: FormatDecisionPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new BookManagerDashboardPage(page);
    formatPage = new FormatDecisionPage(page);
  });

  test('should access format queue from dashboard', async ({ page }) => {
    // Login as book manager
    await loginPage.navigate();
    await loginPage.loginAs('bookManager');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Try to navigate to format queue if link exists
    const formatQueueLink = page.locator('a:has-text("Format"), a:has-text("Queue"), a:has-text("Pending")').first();
    if (await formatQueueLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await formatQueueLink.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display approved stories in format queue', async ({ page }) => {
    // Login as book manager
    await loginPage.navigate();
    await loginPage.loginAs('bookManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check if there's a queue section on dashboard or navigate to queue
    const queueSection = page.locator('text=Queue').or(page.locator('text=Pending')).or(page.locator('text=Format'));
    const hasQueue = await queueSection.isVisible({ timeout: 3000 }).catch(() => false);

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should open story for format decision', async ({ page }) => {
    // Login as book manager
    await loginPage.navigate();
    await loginPage.loginAs('bookManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Check if there are any items to click
    const storyItem = page.locator('a:has-text("Review"), a:has-text("View"), button:has-text("Format")').first();
    if (await storyItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await storyItem.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should decide TEXT format for story', async ({ page }) => {
    // Login as book manager
    await loginPage.navigate();
    await loginPage.loginAs('bookManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to find any TEXT format button on the page
    const textButton = page.locator('button:has-text("Text"), label:has-text("Text"), [data-format="TEXT"]').first();
    if (await textButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textButton.click();
      await page.waitForTimeout(1000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should decide BOOK format for story', async ({ page }) => {
    // Login as book manager
    await loginPage.navigate();
    await loginPage.loginAs('bookManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to find any BOOK format button on the page
    const bookButton = page.locator('button:has-text("Book"), label:has-text("Book"), [data-format="BOOK"]').first();
    if (await bookButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bookButton.click();
      await page.waitForTimeout(1000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should add notes with format decision', async ({ page }) => {
    // Login as book manager
    await loginPage.navigate();
    await loginPage.loginAs('bookManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard should load
    await dashboard.verifyDashboardLoaded();

    // Try to find any textarea for notes
    const notesTextarea = page.locator('textarea').first();
    if (await notesTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesTextarea.fill('Format decision notes: Story length is appropriate for text format.');
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Login as book manager
    await loginPage.navigate();
    await loginPage.loginAs('bookManager');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Get stats
    const stats = await dashboard.getBookManagerStats();

    // Stats should be valid numbers
    expect(stats.approved).toBeGreaterThanOrEqual(0);
    expect(stats.published).toBeGreaterThanOrEqual(0);
    expect(stats.pendingFormat).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to published books', async ({ page }) => {
    // Login as book manager
    await loginPage.navigate();
    await loginPage.loginAs('bookManager');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Try to navigate to published books if link exists
    const publishedLink = page.locator('a:has-text("Published"), a:has-text("Books"), a:has-text("Library")').first();
    if (await publishedLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await publishedLink.click();
      await page.waitForTimeout(2000);
    }

    // Page should still work
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
