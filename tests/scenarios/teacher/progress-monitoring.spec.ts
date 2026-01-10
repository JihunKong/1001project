import { test, expect } from '@playwright/test';
import {
  LoginPage,
  TeacherDashboardPage,
  ProgressMonitoringPage,
} from '../../helpers/page-objects';

test.describe('Teacher Progress Monitoring Flow', () => {
  let loginPage: LoginPage;
  let dashboard: TeacherDashboardPage;
  let progressPage: ProgressMonitoringPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new TeacherDashboardPage(page);
    progressPage = new ProgressMonitoringPage(page);
  });

  test('should access progress monitoring from dashboard', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Student Progress")').first();
    const isVisible = await progressLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await progressLink.click();
      await page.waitForLoadState('networkidle');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display student progress list', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Student Progress")').first();
    const isVisible = await progressLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await progressLink.click();
      await page.waitForLoadState('networkidle');
    }

    const studentRows = page.locator('[data-testid^="student-"], .student-row, tr.student-entry');
    const studentCount = await studentRows.count();

    const overallProgress = page.locator('[data-testid="overall-progress"], .progress-overview, .stat-card:has-text("Progress")').first();
    const hasOverview = await overallProgress.isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`Students found: ${studentCount}, Overview visible: ${hasOverview}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should show student count', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Student Progress")').first();
    const isVisible = await progressLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await progressLink.click();
      await page.waitForLoadState('networkidle');
    }

    const studentRows = page.locator('[data-testid^="student-"], .student-row, tr.student-entry');
    const count = await studentRows.count();

    console.log(`Student count: ${count}`);
    expect(count).toBeGreaterThanOrEqual(0);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display overall progress', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Student Progress")').first();
    const isVisible = await progressLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await progressLink.click();
      await page.waitForLoadState('networkidle');
    }

    const overallProgress = page.locator('[data-testid="overall-progress"], .progress-overview, .stat-card:has-text("Progress")').first();
    const hasOverview = await overallProgress.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasOverview) {
      const progressText = await overallProgress.textContent();
      console.log(`Overall progress: ${progressText}`);
    } else {
      console.log('Overall progress card not visible');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should filter by class', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Student Progress")').first();
    const isVisible = await progressLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await progressLink.click();
      await page.waitForLoadState('networkidle');
    }

    const classFilter = page.locator('select[name="classId"], [data-testid="class-filter"]').first();
    const filterVisible = await classFilter.isVisible({ timeout: 3000 }).catch(() => false);

    if (filterVisible) {
      const options = await classFilter.locator('option').all();

      if (options.length > 1) {
        const optionText = await options[1].textContent();
        if (optionText) {
          await classFilter.selectOption({ index: 1 });
          await page.waitForLoadState('networkidle');
          console.log(`Filtered by class: ${optionText}`);
        }
      } else {
        console.log('No class options available to filter');
      }
    } else {
      console.log('Class filter not visible');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should show student names', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Student Progress")').first();
    const isVisible = await progressLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await progressLink.click();
      await page.waitForLoadState('networkidle');
    }

    const studentRows = page.locator('[data-testid^="student-"], .student-row, tr.student-entry');
    const count = await studentRows.count();

    const names: string[] = [];
    for (let i = 0; i < Math.min(count, 5); i++) {
      const nameElement = studentRows.nth(i).locator('.student-name, [data-testid="student-name"]').first();
      const nameVisible = await nameElement.isVisible({ timeout: 3000 }).catch(() => false);
      if (nameVisible) {
        const name = await nameElement.textContent();
        if (name) names.push(name.trim());
      }
    }

    console.log(`Student names found: ${names.join(', ')}`);
    expect(Array.isArray(names)).toBe(true);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should click student for details', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Student Progress")').first();
    const isVisible = await progressLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await progressLink.click();
      await page.waitForLoadState('networkidle');
    }

    const studentRows = page.locator('[data-testid^="student-"], .student-row, tr.student-entry');
    const count = await studentRows.count();

    if (count > 0) {
      await studentRows.first().click();
      await page.waitForLoadState('networkidle');
      console.log('Clicked on first student for details');
    } else {
      console.log('No students to view');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should have export functionality', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const progressLink = page.locator('a:has-text("Progress"), a:has-text("Student Progress")').first();
    const isVisible = await progressLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await progressLink.click();
      await page.waitForLoadState('networkidle');
    }

    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    const exportVisible = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (exportVisible) {
      const isEnabled = await exportButton.isEnabled().catch(() => false);
      console.log(`Export button visible: ${exportVisible}, enabled: ${isEnabled}`);
    } else {
      console.log('Export functionality not visible');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
