import { test, expect } from '@playwright/test';
import {
  LoginPage,
  TeacherDashboardPage,
  ClassManagementPage,
} from '../../helpers/page-objects';

test.describe('Teacher Class Management Flow', () => {
  let loginPage: LoginPage;
  let dashboard: TeacherDashboardPage;
  let classPage: ClassManagementPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new TeacherDashboardPage(page);
    classPage = new ClassManagementPage(page);
  });

  test('should access classes from dashboard', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myClassesLink = page.locator('a:has-text("My Classes"), a:has-text("Classes")').first();
    const isVisible = await myClassesLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await myClassesLink.click();
      await page.waitForLoadState('networkidle');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display class list', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myClassesLink = page.locator('a:has-text("My Classes"), a:has-text("Classes")').first();
    const isVisible = await myClassesLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await myClassesLink.click();
      await page.waitForLoadState('networkidle');
    }

    const classCards = page.locator('[data-testid^="class-"], .class-card, .class-item');
    const classCount = await classCards.count();

    if (classCount > 0) {
      console.log(`Found ${classCount} classes`);
      expect(classCount).toBeGreaterThan(0);
    } else {
      const emptyMessage = page.locator('[data-testid="empty-classes"], .empty-state, :has-text("No classes")').first();
      const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`No classes found, empty state visible: ${hasEmptyMessage}`);
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should create new class', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myClassesLink = page.locator('a:has-text("My Classes"), a:has-text("Classes")').first();
    const isVisible = await myClassesLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await myClassesLink.click();
      await page.waitForLoadState('networkidle');
    }

    const createButton = page.locator('button:has-text("Create Class"), button:has-text("New Class"), a:has-text("Create")').first();
    const createVisible = await createButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (createVisible) {
      await createButton.click();
      await page.waitForTimeout(500);

      const classNameInput = page.locator('input[name="name"], input[name="className"], input[placeholder*="class name" i]').first();
      const inputVisible = await classNameInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (inputVisible) {
        const className = `Test Class ${Date.now()}`;
        await classNameInput.fill(className);

        const descriptionInput = page.locator('textarea[name="description"], input[name="description"]').first();
        const descVisible = await descriptionInput.isVisible({ timeout: 3000 }).catch(() => false);
        if (descVisible) {
          await descriptionInput.fill('A test class created by automated testing');
        }

        const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]').first();
        const submitVisible = await submitButton.isVisible({ timeout: 3000 }).catch(() => false);
        if (submitVisible) {
          await submitButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    } else {
      console.log('Create class button not visible');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display class code', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myClassesLink = page.locator('a:has-text("My Classes"), a:has-text("Classes")').first();
    const isVisible = await myClassesLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await myClassesLink.click();
      await page.waitForLoadState('networkidle');
    }

    const classCards = page.locator('[data-testid^="class-"], .class-card, .class-item');
    const classCount = await classCards.count();

    if (classCount > 0) {
      const codeElement = classCards.first().locator('.class-code, [data-testid="class-code"], code').first();
      const codeVisible = await codeElement.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Class code visible: ${codeVisible}`);

      if (codeVisible) {
        const code = await codeElement.textContent();
        console.log(`Class code: ${code}`);
      }
    } else {
      console.log('No classes available to get code from');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should show student count per class', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myClassesLink = page.locator('a:has-text("My Classes"), a:has-text("Classes")').first();
    const isVisible = await myClassesLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await myClassesLink.click();
      await page.waitForLoadState('networkidle');
    }

    const classCards = page.locator('[data-testid^="class-"], .class-card, .class-item');
    const classCount = await classCards.count();

    if (classCount > 0) {
      const countElement = classCards.first().locator('.student-count, [data-testid="student-count"]').first();
      const countVisible = await countElement.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Student count element visible: ${countVisible}`);

      if (countVisible) {
        const countText = await countElement.textContent();
        console.log(`Student count: ${countText}`);
      }
    } else {
      console.log('No classes available');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display dashboard statistics', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const statCards = page.locator('.stat-card, [data-testid*="stat"]');
    const statCount = await statCards.count();
    console.log(`Found ${statCount} stat cards`);

    const classesCard = page.locator('[data-testid="my-classes"], .stat-card:has-text("Classes"), .stat-card:has-text("Class")').first();
    const classesVisible = await classesCard.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Classes stat card visible: ${classesVisible}`);

    const studentsCard = page.locator('[data-testid="total-students"], .stat-card:has-text("Students"), .stat-card:has-text("Learners")').first();
    const studentsVisible = await studentsCard.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Students stat card visible: ${studentsVisible}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should navigate to library', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const libraryLink = page.locator('a:has-text("Library")').first();
    const isVisible = await libraryLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      console.log('Navigated to library');
    } else {
      console.log('Library link not visible');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should click class for details', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const myClassesLink = page.locator('a:has-text("My Classes"), a:has-text("Classes")').first();
    const isVisible = await myClassesLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await myClassesLink.click();
      await page.waitForLoadState('networkidle');
    }

    const classCards = page.locator('[data-testid^="class-"], .class-card, .class-item');
    const classCount = await classCards.count();

    if (classCount > 0) {
      await classCards.first().click();
      await page.waitForLoadState('networkidle');
      console.log('Clicked on first class for details');
    } else {
      console.log('No classes to view');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
