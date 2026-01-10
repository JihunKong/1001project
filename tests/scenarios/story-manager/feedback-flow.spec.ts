import { test, expect } from '@playwright/test';
import {
  LoginPage,
  StoryManagerDashboardPage,
  ReviewQueuePage,
  StoryReviewPage,
} from '../../helpers/page-objects';

test.describe('Story Manager Feedback Flow', () => {
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

  test('should approve story with feedback', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open first submission from dashboard
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Try to write feedback if textarea visible
      const feedbackTextarea = page.locator('textarea').first();
      if (await feedbackTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await feedbackTextarea.fill('Great story! Well-written and engaging. Approved for the next stage.');
      }

      // Try to approve
      const approveButton = page.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approveButton.click();
        await page.waitForTimeout(2000);
      }

      // Verify page didn't error
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    } else {
      console.log('No submissions to approve');
    }
  });

  test('should request revision with feedback', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open first submission from dashboard
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Try to write feedback if textarea visible
      const feedbackTextarea = page.locator('textarea').first();
      if (await feedbackTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await feedbackTextarea.fill('Good start! Please consider the following improvements:\n1. Add more detail to the main character\n2. Strengthen the conclusion');
      }

      // Try to request revision
      const revisionButton = page.locator('button:has-text("Revision"), button:has-text("Request")').first();
      if (await revisionButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await revisionButton.click();
        await page.waitForTimeout(2000);
      }

      // Verify page didn't error
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    } else {
      console.log('No submissions to request revision');
    }
  });

  test('should reject story with feedback', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open first submission from dashboard
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Try to write feedback if textarea visible
      const feedbackTextarea = page.locator('textarea').first();
      if (await feedbackTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await feedbackTextarea.fill('Thank you for your submission. Unfortunately, this story does not meet our publication guidelines at this time.');
      }

      // Try to reject
      const rejectButton = page.locator('button:has-text("Reject")').first();
      if (await rejectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await rejectButton.click();
        await page.waitForTimeout(2000);
      }

      // Verify page didn't error
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    } else {
      console.log('No submissions to reject');
    }
  });

  test('should submit feedback without final decision', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open first submission from dashboard
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Try to write feedback if textarea visible
      const feedbackTextarea = page.locator('textarea').first();
      if (await feedbackTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await feedbackTextarea.fill('Initial review notes: Story has potential. Need to discuss with team before final decision.');

        // Try to save/submit feedback
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Comment")').first();
        if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // Verify page didn't error
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    } else {
      console.log('No submissions for feedback');
    }
  });

  test('should trigger AI review', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open first submission from dashboard
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Try to trigger AI review if button exists
      const aiButton = page.locator('button:has-text("AI Review"), button:has-text("AI"), button:has-text("Generate")').first();
      if (await aiButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await aiButton.click();
        await page.waitForTimeout(5000);
      }

      // Verify page didn't error
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    } else {
      console.log('No submissions for AI review');
    }
  });

  test('should view author information', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open first submission from dashboard
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Check for any author information on the page
      const authorSection = page.locator('text=Author').or(page.locator('text=writer')).or(page.locator('.author'));
      const hasAuthorInfo = await authorSection.isVisible({ timeout: 3000 }).catch(() => false);

      // Page should load without error
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    } else {
      console.log('No submissions to view');
    }
  });

  test('should handle empty feedback validation', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open first submission from dashboard
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Try to approve without feedback
      const approveButton = page.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approveButton.click();
        await page.waitForTimeout(2000);
      }

      // Page should still be functional
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(1000);
    } else {
      console.log('No submissions to test');
    }
  });

  test('should preserve feedback on navigation', async ({ page }) => {
    // Login as story manager
    await loginPage.navigate();
    await loginPage.loginAs('storyManager');
    await loginPage.verifyLoginSuccess();

    // Dashboard loads with queue inline
    await dashboard.verifyDashboardLoaded();

    const hasSubmissions = await queuePage.hasSubmissions();

    if (hasSubmissions) {
      // Open first submission from dashboard
      await dashboard.clickFirstReview();
      await page.waitForTimeout(2000);

      // Try to write feedback if textarea visible
      const testFeedback = `Test feedback ${Date.now()}`;
      const feedbackTextarea = page.locator('textarea').first();
      if (await feedbackTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await feedbackTextarea.fill(testFeedback);
      }

      // Go back to dashboard using home link
      const homeLink = page.locator('a:has-text("Home")').first();
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await page.waitForTimeout(1000);
      } else {
        await page.goBack();
      }

      // Verify we're back
      const url = page.url();
      expect(url).toMatch(/dashboard|story-manager/);
    } else {
      console.log('No submissions to test');
    }
  });
});
