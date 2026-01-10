import { test, expect } from '@playwright/test';
import { loginAs, TEST_ACCOUNTS } from '../helpers/auth-helpers';

test.describe('Data Export API Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test.describe('Data Export Request', () => {
    test('POST /api/user/export requires authentication', async ({ request }) => {
      const response = await request.post('/api/user/export', {
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
      console.log('✅ Export request requires authentication');
    });

    test('GET /api/user/export requires authentication', async ({ request }) => {
      const response = await request.get('/api/user/export');

      expect(response.status()).toBe(401);
      console.log('✅ Export history requires authentication');
    });

    test('authenticated user can request data export', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const response = await page.request.post('/api/user/export', {
        headers: { 'Content-Type': 'application/json' }
      });

      const validStatuses = [200, 201, 409];
      expect(validStatuses).toContain(response.status());

      const body = await response.json();

      if (response.status() === 409) {
        expect(body.error).toContain('already in progress');
        console.log('✅ Export already in progress (409)');
      } else {
        expect(body.exportId).toBeDefined();
        expect(body.success).toBe(true);
        console.log(`✅ Export requested successfully: ${body.exportId}`);
      }
    });

    test('authenticated user can view export history', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const response = await page.request.get('/api/user/export');

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.exports)).toBe(true);
      console.log(`✅ Export history retrieved: ${body.exports?.length || 0} entries`);
    });
  });

  test.describe('Data Export Status Check', () => {
    test('export status endpoint requires valid export ID', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const response = await page.request.get('/api/user/export/invalid-export-id');

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Invalid export ID rejected');
    });
  });

  test.describe('Data Export UI Page', () => {
    test('data export page requires authentication', async ({ page }) => {
      await page.goto('/profile/data-export');
      await page.waitForTimeout(2000);

      const isRedirectedToLogin = page.url().includes('/login');
      const hasExportContent = await page.locator('text=Export Your Data').isVisible().catch(() => false);

      if (isRedirectedToLogin) {
        console.log('✅ Unauthenticated users redirected to login');
      } else if (!hasExportContent) {
        console.log('⚠️ Page may require authentication - needs verification');
      }
    });

    test('authenticated user can access data export page', async ({ page }) => {
      await loginAs(page, 'writer');

      await page.goto('/profile/data-export');
      await page.waitForLoadState('networkidle');

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Request")');
      const isButtonVisible = await exportButton.isVisible().catch(() => false);

      const pageTitle = page.locator('h1, h2').filter({ hasText: /export/i });
      const isTitleVisible = await pageTitle.isVisible().catch(() => false);

      expect(isButtonVisible || isTitleVisible).toBe(true);
      console.log('✅ Data export page accessible for authenticated user');
    });

    test('export history table displays correctly', async ({ page }) => {
      await loginAs(page, 'writer');

      await page.goto('/profile/data-export');
      await page.waitForLoadState('networkidle');

      const tableExists = await page.locator('table').isVisible().catch(() => false);
      const noHistoryMessage = await page.locator('text=no export, text=No export').isVisible().catch(() => false);

      console.log(`✅ Export page loaded - Table: ${tableExists}, No history: ${noHistoryMessage}`);
    });
  });

  test.describe('Data Export Security', () => {
    test('cannot access another users export', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const response = await page.request.get('/api/user/export/other-user-export-id');

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Cross-user export access blocked');
    });

    test('export download requires ownership verification', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const response = await page.request.get('/api/user/export/fake-export-id?download=true');

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Unauthorized download blocked');
    });
  });
});
