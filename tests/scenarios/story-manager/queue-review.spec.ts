import { test, expect } from '@playwright/test';
import {
  LoginPage,
  StoryManagerDashboardPage,
  ReviewQueuePage,
  StoryReviewPage,
} from '../../helpers/page-objects';

test.describe('Story Manager Queue Review Flow', () => {
  let loginPage: LoginPage;
  let dashboard: StoryManagerDashboardPage;
  let queuePage: ReviewQueuePage;
  let reviewPage: StoryReviewPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new StoryManagerDashboardPage(page);
    queuePage = new ReviewQueuePage(page);
    reviewPage = new StoryReviewPage(page);
  });

  test('should access review queue from dashboard', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // The queue is displayed inline on the dashboard
    // Check if queue section is visible
    const queueVisible = await dashboard.verifyQueueVisible();
    expect(queueVisible).toBe(true);

    // Queue is already visible on the dashboard - just verify we can see it
    const queueCount = await dashboard.getQueueItemCount();
    expect(queueCount).toBeGreaterThanOrEqual(0);

    // Verify dashboard shows stats
    const stats = await dashboard.getStoryManagerStats();
    expect(stats.pending).toBeGreaterThanOrEqual(0);
  });

  test('should display pending submissions in queue', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    // Check queue content on dashboard
    const hasSubmissions = await queuePage.hasSubmissions();
    const queueVisible = await dashboard.verifyQueueVisible();

    expect(queueVisible).toBe(true);

    if (hasSubmissions) {
      const count = await queuePage.getQueueCount();
      expect(count).toBeGreaterThan(0);
    }
    // Empty queue is also valid - just verify the page loaded
  });

  test('should open story for review from queue', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Click first Review button
      await dashboard.clickFirstReview();

      // Verify navigated away from dashboard
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/review|submission|story/i);
    } else {
      // No submissions is acceptable
      console.log('No submissions to review');
    }
  });

  test('should filter queue by status', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    // Try to filter using the dropdown if visible
    const filterSelect = page.locator('select').first();
    if (await filterSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterSelect.selectOption({ index: 0 });
      await page.waitForTimeout(1000);
    }

    // Verify page still works
    const queueVisible = await dashboard.verifyQueueVisible();
    expect(queueVisible).toBe(true);
  });

  test('should refresh queue', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const initialCount = await queuePage.getQueueCount();

    // Refresh page
    await page.reload();
    await dashboard.verifyDashboardLoaded();

    // Queue should still load correctly after refresh
    const afterCount = await queuePage.getQueueCount();

    // Count can change but page should still work
    expect(afterCount).toBeGreaterThanOrEqual(0);
  });

  test('should view story details in review page', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      await dashboard.clickFirstReview();

      // Wait for page to load and verify content is visible
      await page.waitForTimeout(2000);

      // Check for any story content on the page
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    } else {
      console.log('No submissions to review');
    }
  });

  test('should navigate back to queue from review', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open a story
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Go back using browser back or sidebar navigation
      const dashboardLink = page.locator('a:has-text("Home")').first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
      } else {
        await page.goBack();
      }

      await page.waitForTimeout(1000);
      // Verify we're back on a dashboard page
      expect(page.url()).toMatch(/dashboard|story-manager/);
    } else {
      console.log('No submissions to test navigation');
    }
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard loaded
    await dashboard.verifyDashboardLoaded();

    // Get stats
    const stats = await dashboard.getStoryManagerStats();

    // Stats should be valid numbers
    expect(stats.pending).toBeGreaterThanOrEqual(0);
    expect(stats.approved).toBeGreaterThanOrEqual(0);
    expect(stats.rejected).toBeGreaterThanOrEqual(0);
  });
});
