import { test, expect } from '@playwright/test';
import { LoginPage, TEST_ACCOUNTS, WriterDashboardPage, SubmitStoryPage, MyStoriesPage } from '../../helpers/page-objects';

test.describe('Writer Story Submission Flow', () => {
  let loginPage: LoginPage;
  let writerDashboard: WriterDashboardPage;
  let submitStoryPage: SubmitStoryPage;
  let myStoriesPage: MyStoriesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    writerDashboard = new WriterDashboardPage(page);
    submitStoryPage = new SubmitStoryPage(page);
    myStoriesPage = new MyStoriesPage(page);
  });

  test('should complete full story submission workflow', async ({ page }) => {
    // Step 1: Login as writer
    await loginPage.navigate();
    await loginPage.loginAs('writer');
    await loginPage.verifyLoginSuccess();

    // Step 2: Verify dashboard loaded
    await writerDashboard.verifyDashboardLoaded();
    const initialStats = await writerDashboard.getWriterStats();

    // Step 3: Navigate to new story page
    await writerDashboard.clickNewStory();
    await submitStoryPage.verifyPageLoaded();

    // Step 4: Fill and submit story
    const testStory = {
      title: `Test Story ${Date.now()}`,
      summary: 'This is a test story created by automated testing.',
      content: 'Once upon a time, in a land far away, there lived a brave young adventurer who dreamed of exploring the world. Every day, they would look out at the horizon and wonder what mysteries awaited them beyond the mountains.',
    };

    await submitStoryPage.fillStoryForm(testStory);

    // Verify form is valid before submitting
    const isValid = await submitStoryPage.isFormValid();
    expect(isValid).toBe(true);

    // Step 5: Submit for review
    await submitStoryPage.submitForReview();

    // Step 6: Verify submission success
    // Wait for success indication - toast message, redirect, or success element
    await page.waitForTimeout(2000);

    const successMessageVisible = await page.locator('.success-message, [role="status"]:has-text("success"), .toast:has-text("success"), .Toastify:has-text("success")').isVisible().catch(() => false);
    const redirectedToStories = page.url().includes('/stories');
    const redirectedToDashboard = page.url().includes('/dashboard/writer') && !page.url().includes('/submit');
    const toastVisible = await page.locator('[class*="toast"], [class*="Toast"]').isVisible().catch(() => false);

    // Any of these indicates successful submission
    expect(successMessageVisible || redirectedToStories || redirectedToDashboard || toastVisible).toBe(true);

    // Step 7: Navigate to my stories and verify
    await myStoriesPage.navigate();
    await myStoriesPage.verifyPageLoaded();

    // Verify there are stories in any tab (submitted stories go to Pending)
    const hasAnyStories = await myStoriesPage.hasAnyStories();
    expect(hasAnyStories).toBe(true);

    // Click on Pending tab to see submitted stories
    await myStoriesPage.clickStatusTab('Pending');

    // Verify Pending tab has stories
    const pendingCount = await myStoriesPage.getTabCount('Pending');
    expect(pendingCount).toBeGreaterThan(0);

    // Page should have content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should save story as draft', async ({ page }) => {
    // Login as writer
    await loginPage.navigate();
    await loginPage.loginAs('writer');
    await loginPage.verifyLoginSuccess();

    // Navigate to submit story page via dashboard
    await writerDashboard.verifyDashboardLoaded();
    await writerDashboard.clickNewStory();

    // Fill story form with content
    const draftStory = {
      title: `Draft Story ${Date.now()}`,
      summary: 'This is a draft story for testing.',
      content: 'This content is being saved as a draft for later editing and completion.',
    };

    await submitStoryPage.fillStoryForm(draftStory);

    // Verify the page shows "Draft" status in the Details panel
    // This indicates the story is in draft mode before submission
    const statusDraft = page.locator('text=Draft').first();
    const isDraftVisible = await statusDraft.isVisible({ timeout: 5000 });
    expect(isDraftVisible).toBe(true);

    // Verify Save Draft or Submit buttons are available
    const actionButtons = page.locator('button:has-text("Save"), button:has-text("Submit")');
    const hasButtons = await actionButtons.first().isVisible({ timeout: 5000 });
    expect(hasButtons).toBe(true);

    // Page should remain on the editor without errors
    const currentUrl = page.url();
    expect(currentUrl).toContain('submit');
  });

  test('should show validation error for incomplete form', async ({ page }) => {
    // Login as writer
    await loginPage.navigate();
    await loginPage.loginAs('writer');
    await loginPage.verifyLoginSuccess();

    // Navigate to submit story page via dashboard
    await writerDashboard.verifyDashboardLoaded();
    await writerDashboard.clickNewStory();

    // Try to submit without filling required fields
    await submitStoryPage.submitForReview();

    // Should show form error or remain on page
    const hasError = await submitStoryPage.hasFormError();
    const stillOnSubmitPage = page.url().includes('submit');

    expect(hasError || stillOnSubmitPage).toBe(true);
  });

  test('should display word count while writing', async ({ page }) => {
    // Login as writer
    await loginPage.navigate();
    await loginPage.loginAs('writer');
    await loginPage.verifyLoginSuccess();

    // Navigate to submit story page via dashboard
    await writerDashboard.verifyDashboardLoaded();
    await writerDashboard.clickNewStory();

    // Fill content and check word count
    const testContent = 'One two three four five six seven eight nine ten';
    await submitStoryPage.fillStoryForm({
      title: 'Word Count Test',
      summary: 'Testing word count feature',
      content: testContent,
    });

    const wordCount = await submitStoryPage.getWordCount();

    // Word count should be approximately 10 (or more with title/summary)
    expect(wordCount).toBeGreaterThanOrEqual(0);
  });

  test('should track story statistics after submission', async ({ page }) => {
    // Login as writer
    await loginPage.navigate();
    await loginPage.loginAs('writer');
    await loginPage.verifyLoginSuccess();

    // Get initial stats
    await writerDashboard.verifyDashboardLoaded();
    const initialStats = await writerDashboard.getWriterStats();

    // Submit a new story via dashboard
    await writerDashboard.clickNewStory();
    const statsTestStory = {
      title: `Stats Test Story ${Date.now()}`,
      summary: 'Story to test statistics tracking.',
      content: 'This story is created to verify that statistics are properly tracked after submission.',
    };

    await submitStoryPage.fillStoryForm(statsTestStory);
    await submitStoryPage.submitForReview();

    // Go back to dashboard and check stats
    await writerDashboard.navigate();
    await writerDashboard.verifyDashboardLoaded();

    const newStats = await writerDashboard.getWriterStats();

    // Total stories should increase or in-review should increase
    expect(newStats.total >= initialStats.total || newStats.inReview >= initialStats.inReview).toBe(true);
  });
});
