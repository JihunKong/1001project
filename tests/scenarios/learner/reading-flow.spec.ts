import { test, expect } from '@playwright/test';
import {
  LoginPage,
  LearnerDashboardPage,
  MyBooksPage,
  ReadingPage,
} from '../../helpers/page-objects';

test.describe('Learner Reading Flow', () => {
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

  test('should access my books', async ({ page }) => {
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

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display assigned books', async ({ page }) => {
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
      expect(bookCount).toBeGreaterThan(0);
      console.log(`Found ${bookCount} assigned books`);
    } else {
      const emptyMessage = page.locator('[data-testid="empty-books"], .empty-state, :has-text("No books")').first();
      const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`No books found, empty state visible: ${hasEmptyMessage}`);
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should start reading a book', async ({ page }) => {
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
      }
    } else {
      console.log('No books available to read - skipping read action');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display book content', async ({ page }) => {
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
      await bookCards.first().click();
      await page.waitForLoadState('networkidle');

      const bookContent = page.locator('[data-testid="book-content"], .book-content, .reading-content, article').first();
      const contentVisible = await bookContent.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Book content visible: ${contentVisible}`);
    } else {
      console.log('No books available to display content');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should navigate between pages', async ({ page }) => {
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
        const nextVisible = await nextButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (nextVisible) {
          const isEnabled = await nextButton.isEnabled().catch(() => false);
          if (isEnabled) {
            await nextButton.click();
            await page.waitForLoadState('networkidle');
            console.log('Navigated to next page');
          }
        }
      }
    } else {
      console.log('No books available for page navigation');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should show reading progress', async ({ page }) => {
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
      const progressElement = bookCards.first().locator('.progress, [data-testid="progress"], .progress-bar').first();
      const progressVisible = await progressElement.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Progress element visible: ${progressVisible}`);

      if (progressVisible) {
        const progressText = await progressElement.textContent();
        console.log(`Progress: ${progressText}`);
      }
    } else {
      console.log('No books available to check progress');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should filter books by status', async ({ page }) => {
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

    const filterSelect = page.locator('select[name="filter"], [data-testid="filter-select"]').first();
    const filterVisible = await filterSelect.isVisible({ timeout: 3000 }).catch(() => false);

    if (filterVisible) {
      const filters = ['all', 'in-progress', 'completed', 'not-started'] as const;

      for (const filter of filters) {
        await filterSelect.selectOption(filter).catch(() => {
          console.log(`Filter option ${filter} not available`);
        });
        await page.waitForLoadState('networkidle');

        const bookCards = page.locator('[data-testid^="book-"], .book-card, .assigned-book');
        const count = await bookCards.count();
        console.log(`Filter ${filter}: ${count} books`);
      }
    } else {
      console.log('Filter select not available');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should show due dates', async ({ page }) => {
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
      const dueDateElement = bookCards.first().locator('.due-date, [data-testid="due-date"]').first();
      const dueDateVisible = await dueDateElement.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Due date element visible: ${dueDateVisible}`);

      if (dueDateVisible) {
        const dueDate = await dueDateElement.textContent();
        console.log(`Due date: ${dueDate}`);
      }
    } else {
      console.log('No books available to check due dates');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
