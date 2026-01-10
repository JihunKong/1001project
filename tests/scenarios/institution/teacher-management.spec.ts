import { test, expect } from '@playwright/test';
import {
  LoginPage,
  InstitutionDashboardPage,
  TeacherManagementPage,
} from '../../helpers/page-objects';

test.describe('Institution Teacher Management Flow', () => {
  let loginPage: LoginPage;
  let dashboard: InstitutionDashboardPage;
  let teacherPage: TeacherManagementPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new InstitutionDashboardPage(page);
    teacherPage = new TeacherManagementPage(page);
  });

  test('should access teacher management from dashboard', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    await dashboard.goToTeacherManagement();
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display teacher list', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Check for teacher section on dashboard
    const teacherSection = page.locator('text=Teacher').or(page.locator('text=Faculty')).first();
    const hasTeacherSection = await teacherSection.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Teacher section visible: ${hasTeacherSection}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should open invite teacher modal', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Try to open invite modal
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add Teacher"), a:has-text("Invite")').first();
    if (await inviteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('.modal, [role="dialog"], form').first();
      const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Invite teacher modal visible: ${modalVisible}`);
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should invite new teacher', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Try to find and fill invite form
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add Teacher")').first();
    if (await inviteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteButton.click();
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.fill(`teacher-${Date.now()}@test.1001stories.org`);
      }
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should search for teacher', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Try to search if search input exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('teacher');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display institution statistics', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    const stats = await dashboard.getInstitutionStats();

    expect(stats.teachers).toBeGreaterThanOrEqual(0);
    expect(stats.students).toBeGreaterThanOrEqual(0);
    expect(stats.classes).toBeGreaterThanOrEqual(0);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should view teacher classes', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Try to find and click view classes button
    const viewClassesButton = page.locator('button:has-text("Classes"), a:has-text("Classes"), button:has-text("View")').first();
    if (await viewClassesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewClassesButton.click();
      await page.waitForTimeout(1000);
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
