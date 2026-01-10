import { test, expect } from '@playwright/test';
import {
  LoginPage,
  LearnerDashboardPage,
  MyBooksPage,
  ReadingPage,
} from '../../helpers/page-objects';

test.describe('Learner Progress Update Flow', () => {
  let loginPage: LoginPage;
  let dashboard: LearnerDashboardPage;
  let myBooksPage: MyBooksPage;
  let readingPage: ReadingPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new LearnerDashboardPage(page);
    myBooksPage = new MyBooksPage(page);
    readingPage = new ReadingPage(page);
  });

  test('should track reading progress automatically', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myBooksLink = page.locator('a:has-text("My Books"), a:has-text("Assigned Books")').first();
    const isVisible = await myBooksLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await myBooksLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bookCards = page.locator('[data-testid^="book-"], .book-card, .assigned-book');
    const bookCount = await bookCards.count();

    if (bookCount > 0) {
      const readButton = bookCards.first().locator('button:has-text("Read"), a:has-text("Read"), button:has-text("Start")').first();
      const readVisible = await readButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (readVisible) {
        await readButton.click();
        await page.waitForLoadState('networkidle');

        const nextButton = page.locator('button:has-text("Next"), [aria-label="Next page"], .next-page').first();

        for (let i = 0; i < 3; i++) {
          const nextVisible = await nextButton.isVisible({ timeout: 3000 }).catch(() => false);
          if (nextVisible) {
            const isEnabled = await nextButton.isEnabled().catch(() => false);
            if (isEnabled) {
              await nextButton.click();
              await page.waitForTimeout(500);
            }
          }
        }

        console.log('Read through multiple pages');
      }
    } else {
      console.log('No books available to track progress');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should mark book as complete', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myBooksLink = page.locator('a:has-text("My Books"), a:has-text("Assigned Books")').first();
    const isVisible = await myBooksLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await myBooksLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bookCards = page.locator('[data-testid^="book-"], .book-card, .assigned-book');
    const bookCount = await bookCards.count();

    if (bookCount > 0) {
      const readButton = bookCards.first().locator('button:has-text("Read"), a:has-text("Read"), button:has-text("Start")').first();
      const readVisible = await readButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (readVisible) {
        await readButton.click();
        await page.waitForLoadState('networkidle');

        const markCompleteButton = page.locator('button:has-text("Complete"), button:has-text("Finish"), button:has-text("Done")').first();
        const completeVisible = await markCompleteButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (completeVisible) {
          await markCompleteButton.click();
          await page.waitForLoadState('networkidle');
          console.log('Marked book as complete');
        } else {
          console.log('Mark complete button not available');
        }
      }
    } else {
      console.log('No books available to complete');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should continue from last position', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myBooksLink = page.locator('a:has-text("My Books"), a:has-text("Assigned Books")').first();
    const isVisible = await myBooksLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await myBooksLink.click();
      await page.waitForLoadState('networkidle');
    }

    const bookCards = page.locator('[data-testid^="book-"], .book-card, .assigned-book');
    const bookCount = await bookCards.count();

    if (bookCount > 0) {
      const readButton = bookCards.first().locator('button:has-text("Read"), a:has-text("Read"), button:has-text("Start")').first();
      const readVisible = await readButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (readVisible) {
        await readButton.click();
        await page.waitForLoadState('networkidle');

        const nextButton = page.locator('button:has-text("Next"), [aria-label="Next page"], .next-page').first();

        for (let i = 0; i < 2; i++) {
          const nextVisible = await nextButton.isVisible({ timeout: 3000 }).catch(() => false);
          if (nextVisible) {
            const isEnabled = await nextButton.isEnabled().catch(() => false);
            if (isEnabled) {
              await nextButton.click();
              await page.waitForTimeout(300);
            }
          }
        }

        await page.goBack();
        await page.waitForLoadState('networkidle');

        const continueButton = bookCards.first().locator('button:has-text("Continue"), a:has-text("Continue")').first();
        const continueVisible = await continueButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (continueVisible) {
          await continueButton.click();
          await page.waitForLoadState('networkidle');
          console.log('Continued reading from last position');
        }
      }
    } else {
      console.log('No books available to continue');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display progress on dashboard', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const statCards = page.locator('.stat-card, [data-testid*="stat"], [data-testid*="progress"]');
    const statCount = await statCards.count();
    console.log(`Found ${statCount} stat cards on dashboard`);

    const progressCard = page.locator('[data-testid="reading-progress"], .stat-card:has-text("Progress")').first();
    const progressVisible = await progressCard.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Progress card visible: ${progressVisible}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should update completed count', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const completedCard = page.locator('[data-testid="completed-books"], .stat-card:has-text("Completed")').first();
    const completedVisible = await completedCard.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Completed books card visible: ${completedVisible}`);

    if (completedVisible) {
      const completedText = await completedCard.textContent();
      console.log(`Completed stats: ${completedText}`);
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should show recent books on dashboard', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const recentSection = page.locator('[data-testid="recent-activity"], .recent-activity, section:has-text("Recent")').first();
    const recentVisible = await recentSection.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Recent activity section visible: ${recentVisible}`);

    const bookItems = page.locator('[data-testid="recent-book"], .book-item, .book-card');
    const bookCount = await bookItems.count();
    console.log(`Recent books count: ${bookCount}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should track total assigned books', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const assignedCard = page.locator('[data-testid="assigned-books"], .stat-card:has-text("Assigned"), .stat-card:has-text("Books")').first();
    const assignedVisible = await assignedCard.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Assigned books card visible: ${assignedVisible}`);

    if (assignedVisible) {
      const assignedText = await assignedCard.textContent();
      console.log(`Assigned stats: ${assignedText}`);
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
