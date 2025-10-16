import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';

// Test accounts
const accounts = {
  volunteer: 'volunteer@test.1001stories.org',
  storyManager: 'story-manager@test.1001stories.org',
  bookManager: 'book-manager@test.1001stories.org',
  contentAdmin: 'content-admin@test.1001stories.org',
};

// Helper function to login via password
async function loginWithPassword(page: any, email: string, password: string = 'test1234') {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Click on Password tab
  const passwordTab = page.locator('button').filter({ hasText: 'Password' });
  await passwordTab.click();
  await page.waitForTimeout(1000);

  // Fill email and password
  await page.fill('#email', email);
  await page.fill('#password', password);

  // Take screenshot before submit
  await page.screenshot({
    path: `screenshots/publishing-workflow/debug-${email.split('@')[0]}-before-submit.png`
  });

  // Click sign in
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  console.log(`✅ Logged in as ${email}`);
  await page.waitForTimeout(1000);
}

test.describe('Complete Publishing Workflow', () => {
  const screenshotDir = path.join(__dirname, '../screenshots/publishing-workflow');
  let submissionId: string;

  test.beforeAll(async () => {
    console.log('Starting complete publishing workflow test');
    console.log('Screenshots will be saved to:', screenshotDir);
  });

  test('Step 1: VOLUNTEER - Submit text story', async ({ page }) => {
    console.log('\n=== STEP 1: VOLUNTEER SUBMISSION ===');

    // Navigate to submit page
    await page.goto(`${BASE_URL}/dashboard/writer/submit-text`);

    // Check if redirected to login
    if (page.url().includes('/login')) {
      await loginWithPassword(page, accounts.volunteer);

      // After login, navigate again
      await page.goto(`${BASE_URL}/dashboard/writer/submit-text`);
    }

    // Wait for form to load
    await page.waitForSelector('input#title', { timeout: 10000 });

    // Take screenshot of empty form
    await page.screenshot({
      path: path.join(screenshotDir, '01-volunteer-empty-form.png'),
      fullPage: true
    });

    // Fill in the story submission form
    await page.fill('input#title', 'Test Story for Publishing Workflow');
    await page.fill('input#authorAlias', 'Test Author');
    await page.selectOption('select#ageRange', '8-12');
    await page.selectOption('select#readingLevel', 'Intermediate');

    // Fill in the rich text editor
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill(`Once upon a time, in a small village nestled between mountains, there lived a curious child named Maya.

Maya loved to explore the forests around her home, discovering new plants and animals every day.

One day, she found a mysterious golden seed that would change her life forever...`);

    // Fill summary
    await page.fill('textarea#summary', 'A story about Maya, a curious child who discovers a magical golden seed in the forest.');

    // Scroll to tags section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Add tags one by one
    const tags = ['adventure', 'discovery', 'nature'];
    for (const tag of tags) {
      await page.fill('input[placeholder*="tag"]', tag);
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(300);
    }

    // Scroll to copyright section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check all required checkboxes
    await page.check('input[type="checkbox"]:near(:text("This is my original work"))');
    await page.waitForTimeout(200);
    await page.check('input[type="checkbox"]:near(:text("I confirm that I own the copyright"))');
    await page.waitForTimeout(200);
    await page.check('input[type="checkbox"]:near(:text("Terms & Disclosures"))');
    await page.waitForTimeout(300);

    // Take screenshot of filled form
    await page.screenshot({
      path: path.join(screenshotDir, '02-volunteer-filled-form.png'),
      fullPage: true
    });

    // Submit the form (creates draft)
    await page.click('button:has-text("Submit for Review")');

    // Wait for redirect to dashboard
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of draft created
    await page.screenshot({
      path: path.join(screenshotDir, '03-volunteer-draft-created.png'),
      fullPage: true
    });

    // Now actually submit for review from the dashboard
    const submitButton = page.locator('button:has-text("Submit for Review")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Take screenshot after submission
      await page.screenshot({
        path: path.join(screenshotDir, '04-volunteer-submitted-for-review.png'),
        fullPage: true
      });
    }

    console.log('✅ VOLUNTEER submission completed');
  });

  test('Step 2: STORY_MANAGER - Review and approve story', async ({ page }) => {
    console.log('\n=== STEP 2: STORY_MANAGER REVIEW ===');

    // Login as story manager
    await page.goto(`${BASE_URL}/dashboard/story-manager`);

    if (page.url().includes('/login')) {
      await loginWithPassword(page, accounts.storyManager);
      await page.goto(`${BASE_URL}/dashboard/story-manager`);
    }

    // Wait for dashboard to load
    await page.waitForSelector('text="Story Manager Dashboard"', { timeout: 10000 });

    // Take screenshot of dashboard
    await page.screenshot({
      path: path.join(screenshotDir, '04-story-manager-dashboard.png'),
      fullPage: true
    });

    // Find the submitted story in the queue
    const submissionCard = page.locator('.submission-card, [data-testid="submission-card"]').first();

    if (await submissionCard.count() > 0) {
      // Take screenshot of submission card
      await page.screenshot({
        path: path.join(screenshotDir, '05-story-manager-pending-submissions.png'),
        fullPage: true
      });

      // Click to review
      await submissionCard.click();

      // Wait for review page
      await page.waitForTimeout(2000);

      // Take screenshot of review page
      await page.screenshot({
        path: path.join(screenshotDir, '06-story-manager-review-page.png'),
        fullPage: true
      });

      // Approve the story
      const approveButton = page.locator('button:has-text("Approve")');
      if (await approveButton.count() > 0) {
        await approveButton.click();
        await page.waitForTimeout(2000);

        // Take screenshot of approval success
        await page.screenshot({
          path: path.join(screenshotDir, '07-story-manager-approval-success.png'),
          fullPage: true
        });
      }
    }

    console.log('✅ STORY_MANAGER review completed');
  });

  test('Step 3: BOOK_MANAGER - Decide publication format', async ({ page }) => {
    console.log('\n=== STEP 3: BOOK_MANAGER FORMAT DECISION ===');

    // Login as book manager
    await page.goto(`${BASE_URL}/dashboard/book-manager`);

    if (page.url().includes('/login')) {
      await loginWithPassword(page, accounts.bookManager);
      await page.goto(`${BASE_URL}/dashboard/book-manager`);
    }

    // Wait for dashboard
    await page.waitForSelector('text="Book Manager Dashboard"', { timeout: 10000 });

    // Take screenshot of dashboard
    await page.screenshot({
      path: path.join(screenshotDir, '08-book-manager-dashboard.png'),
      fullPage: true
    });

    // Find approved stories waiting for format decision
    const storyCard = page.locator('.story-card, [data-testid="story-card"]').first();

    if (await storyCard.count() > 0) {
      await page.screenshot({
        path: path.join(screenshotDir, '09-book-manager-pending-stories.png'),
        fullPage: true
      });

      // Click to decide format
      await storyCard.click();
      await page.waitForTimeout(2000);

      // Take screenshot of format decision page
      await page.screenshot({
        path: path.join(screenshotDir, '10-book-manager-format-page.png'),
        fullPage: true
      });

      // Choose "Text" format (for AI image generation)
      const textFormatButton = page.locator('button:has-text("Text Format")');
      if (await textFormatButton.count() > 0) {
        await textFormatButton.click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: path.join(screenshotDir, '11-book-manager-format-selected.png'),
          fullPage: true
        });
      }
    }

    console.log('✅ BOOK_MANAGER format decision completed');
  });

  test('Step 4: CONTENT_ADMIN - Final approval and publish', async ({ page }) => {
    console.log('\n=== STEP 4: CONTENT_ADMIN FINAL APPROVAL ===');

    // Login as content admin
    await page.goto(`${BASE_URL}/dashboard/content-admin`);

    if (page.url().includes('/login')) {
      await loginWithPassword(page, accounts.contentAdmin);
      await page.goto(`${BASE_URL}/dashboard/content-admin`);
    }

    // Wait for dashboard
    await page.waitForSelector('text="Content Admin Dashboard"', { timeout: 10000 });

    // Take screenshot of dashboard
    await page.screenshot({
      path: path.join(screenshotDir, '12-content-admin-dashboard.png'),
      fullPage: true
    });

    // Find stories ready for final approval
    const contentCard = page.locator('.content-card, [data-testid="content-card"]').first();

    if (await contentCard.count() > 0) {
      await page.screenshot({
        path: path.join(screenshotDir, '13-content-admin-pending-content.png'),
        fullPage: true
      });

      // Click to review
      await contentCard.click();
      await page.waitForTimeout(2000);

      // Take screenshot of final review page
      await page.screenshot({
        path: path.join(screenshotDir, '14-content-admin-review-page.png'),
        fullPage: true
      });

      // Publish the content
      const publishButton = page.locator('button:has-text("Publish")');
      if (await publishButton.count() > 0) {
        await publishButton.click();
        await page.waitForTimeout(3000);

        // Take screenshot of publish success
        await page.screenshot({
          path: path.join(screenshotDir, '15-content-admin-publish-success.png'),
          fullPage: true
        });
      }
    }

    console.log('✅ CONTENT_ADMIN final approval completed');
  });

  test('Step 5: Verify published content in library', async ({ page }) => {
    console.log('\n=== STEP 5: VERIFY PUBLISHED CONTENT ===');

    // Go to library
    await page.goto(`${BASE_URL}/library`);

    // Wait for library to load
    await page.waitForSelector('text="Library"', { timeout: 10000 });

    // Take screenshot of library
    await page.screenshot({
      path: path.join(screenshotDir, '16-library-with-published-story.png'),
      fullPage: true
    });

    // Search for the published story
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Test Story for Publishing Workflow');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(screenshotDir, '17-library-search-result.png'),
        fullPage: true
      });
    }

    // Click on the story to view details
    const storyLink = page.locator('text="Test Story for Publishing Workflow"').first();
    if (await storyLink.count() > 0) {
      await storyLink.click();
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: path.join(screenshotDir, '18-published-story-detail.png'),
        fullPage: true
      });
    }

    console.log('✅ Published content verification completed');
  });

  test.afterAll(async () => {
    console.log('\n=== PUBLISHING WORKFLOW TEST COMPLETED ===');
    console.log(`All screenshots saved to: ${screenshotDir}`);
  });
});
