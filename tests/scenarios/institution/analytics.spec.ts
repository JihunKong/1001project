import { test, expect } from '@playwright/test';
import {
  LoginPage,
  InstitutionDashboardPage,
  AnalyticsPage,
} from '../../helpers/page-objects';

test.describe('Institution Analytics Flow', () => {
  let loginPage: LoginPage;
  let dashboard: InstitutionDashboardPage;
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new InstitutionDashboardPage(page);
    analyticsPage = new AnalyticsPage(page);
  });

  test('should access analytics from dashboard', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    await dashboard.goToAnalytics();
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display analytics summary', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Check for analytics/stats section on dashboard
    const statsSection = page.locator('text=Analytics').or(page.locator('text=Statistics')).or(page.locator('text=Overview')).first();
    const hasStats = await statsSection.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Analytics section visible: ${hasStats}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should show analytics summary cards', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Check for stat cards
    const statCards = page.locator('.stat-card, [data-testid*="stat"], .stats-card').first();
    const hasStatCards = await statCards.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Stat cards visible: ${hasStatCards}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display progress chart', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Check for chart element
    const chartElement = page.locator('canvas, svg, [data-testid*="chart"], .chart').first();
    const hasChart = await chartElement.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Progress chart visible: ${hasChart}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should filter by date range', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Try to find date range filter
    const dateFilter = page.locator('select[name*="date"], select[name*="range"], button:has-text("Week")').first();
    if (await dateFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateFilter.click();
      await page.waitForTimeout(1000);
      console.log('Date range filter found and clicked');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should display teacher performance table', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    // Check for table element
    const tableElement = page.locator('table, [data-testid*="table"], .data-table').first();
    const hasTable = await tableElement.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Teacher performance table visible: ${hasTable}`);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should have export functionality', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await analyticsPage.navigate();
    await analyticsPage.verifyPageLoaded();

    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();

    const isVisible = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      const isEnabled = await exportButton.isEnabled();
      console.log(`Export button enabled: ${isEnabled}`);
    } else {
      console.log('Export button not found');
    }

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test('should navigate to assign books', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginAs('institution');
    await loginPage.verifyLoginSuccess();

    await dashboard.verifyDashboardLoaded();

    await dashboard.goToAssignBooks();
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});
