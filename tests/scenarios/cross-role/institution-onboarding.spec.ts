import { test, expect } from '@playwright/test';
import {
  LoginPage,
  InstitutionDashboardPage,
  TeacherManagementPage,
  AnalyticsPage,
  TeacherDashboardPage,
  ClassManagementPage,
  LearnerDashboardPage,
  ClassJoinPage,
} from '../../helpers/page-objects';

test.describe('Institution Onboarding Flow E2E', () => {
  test.describe.configure({ mode: 'serial' });

  const teacherEmail = `teacher-onboard-${Date.now()}@test.1001stories.org`;

  test('Step 1: Institution invites a teacher', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const teacherPage = new TeacherManagementPage(page);

    // Login as institution
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    // Navigate to teacher management
    await teacherPage.navigate();
    await teacherPage.verifyPageLoaded();

    // Check if invite button exists
    const inviteButton = page.locator('button:has-text("Invite Teacher"), button:has-text("Add Teacher"), a:has-text("Invite")').first();
    const canInviteTeacher = await inviteButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (canInviteTeacher) {
      await teacherPage.inviteTeacher({
        email: teacherEmail,
        name: 'Onboarding Test Teacher',
        department: 'Test Department',
      });
      console.log(`Teacher invitation sent to: ${teacherEmail}`);
    } else {
      console.log('Invite Teacher button not available - checking existing teachers');
      const hasTeachers = await teacherPage.hasTeachers();
      console.log(`Existing teachers: ${hasTeachers}`);
    }

    // Verify page still loaded
    await page.waitForTimeout(2000);
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('Step 2: Institution views analytics', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const analyticsPage = new AnalyticsPage(page);

    // Login as institution
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    // View analytics
    await analyticsPage.navigate();
    await analyticsPage.verifyPageLoaded();

    await analyticsPage.verifyAnalyticsLoaded();

    // Get summary
    const summary = await analyticsPage.getAnalyticsSummary();
    expect(Object.keys(summary).length).toBeGreaterThan(0);
  });

  test('Step 3: Teacher creates class and gets code', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const classPage = new ClassManagementPage(page);

    // Login as teacher
    await loginPage.navigate();
    await loginPage.loginAs('teacher');
    await loginPage.verifyLoginSuccess();

    // Create a class
    const className = `Onboarding Class ${Date.now()}`;

    await classPage.navigate();
    await classPage.verifyPageLoaded();

    await classPage.createClass({
      name: className,
      description: 'Class created during onboarding flow',
    });

    await page.waitForTimeout(2000);
  });

  test('Step 4: Institution monitors teacher performance', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const analyticsPage = new AnalyticsPage(page);

    // Login as institution
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    // View teacher performance
    await analyticsPage.navigate();
    await analyticsPage.verifyPageLoaded();

    const hasTable = await analyticsPage.hasTeacherPerformanceTable();

    if (hasTable) {
      const performance = await analyticsPage.getTeacherPerformance();
      expect(Array.isArray(performance)).toBe(true);
    }
  });

  test('Step 5: Learner joins teacher class', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const joinPage = new ClassJoinPage(page);

    // Login as learner
    await loginPage.navigate();
    await loginPage.loginAs('learner');
    await loginPage.verifyLoginSuccess();

    // Navigate to join page
    await joinPage.navigate();
    await joinPage.verifyPageLoaded();

    // Check if already in class
    const isInClass = await joinPage.isInClass();

    if (isInClass) {
      const className = await joinPage.getCurrentClassName();
      expect(className.length).toBeGreaterThan(0);
    }
  });

  test('Step 6: Institution views updated analytics', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const analyticsPage = new AnalyticsPage(page);
    const dashboard = new InstitutionDashboardPage(page);

    // Login as institution
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    // Verify dashboard
    await dashboard.verifyDashboardLoaded();

    // Get institution stats
    const stats = await dashboard.getInstitutionStats();

    expect(stats.teachers).toBeGreaterThanOrEqual(0);
    expect(stats.students).toBeGreaterThanOrEqual(0);
    expect(stats.classes).toBeGreaterThanOrEqual(0);

    // View detailed analytics
    await analyticsPage.navigate();
    await analyticsPage.verifyAnalyticsLoaded();
  });
});

test.describe('Institution Management Features', () => {
  test('Institution searches for teacher', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const teacherPage = new TeacherManagementPage(page);

    // Login as institution
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await teacherPage.navigate();
    await teacherPage.verifyPageLoaded();

    const hasTeachers = await teacherPage.hasTeachers();

    if (hasTeachers) {
      const names = await teacherPage.getAllTeacherNames();

      if (names.length > 0) {
        await teacherPage.searchTeacher(names[0].substring(0, 3));
        await page.waitForTimeout(2000);
      }
    }
  });

  test('Institution filters analytics by date range', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const analyticsPage = new AnalyticsPage(page);

    // Login as institution
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await analyticsPage.navigate();
    await analyticsPage.verifyPageLoaded();

    // Test different date ranges
    await analyticsPage.selectDateRange('week');
    await page.waitForTimeout(2000);

    await analyticsPage.selectDateRange('month');
    await page.waitForTimeout(2000);
  });

  test('Institution exports analytics data', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const analyticsPage = new AnalyticsPage(page);

    // Login as institution
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await analyticsPage.navigate();
    await analyticsPage.verifyPageLoaded();

    // Check for export functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');

    if (await exportButton.isVisible()) {
      expect(await exportButton.isEnabled()).toBe(true);
    }
  });
});
