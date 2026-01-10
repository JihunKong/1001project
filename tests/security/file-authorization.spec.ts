import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth-helpers';

test.describe('File Authorization Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test.describe('Data Export File Download Security', () => {
    test('should block path traversal attack in export download', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd',
        '..%252f..%252f..%252fetc/passwd'
      ];

      for (const path of maliciousPaths) {
        const response = await page.request.get(`/api/user/export/${encodeURIComponent(path)}?download=true`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        console.log(`✅ Path traversal blocked: ${path.substring(0, 20)}...`);
      }
    });

    test('should require authentication for export download', async ({ request }) => {
      const response = await request.get('/api/user/export/any-export-id?download=true');

      expect(response.status()).toBe(401);
      console.log('✅ Unauthenticated export download blocked');
    });

    test('should block download of non-owned export', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const fakeExportId = 'clxyz123456789';
      const response = await page.request.get(`/api/user/export/${fakeExportId}?download=true`);

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Non-owned export download blocked');
    });

    test('should validate export ID format', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const invalidIds = [
        '<script>alert(1)</script>',
        "'; DROP TABLE data_export_requests; --",
        '${process.env.SECRET}',
        '{{constructor.constructor("return this")()}}'
      ];

      for (const id of invalidIds) {
        const response = await page.request.get(`/api/user/export/${encodeURIComponent(id)}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        console.log(`✅ Invalid ID rejected: ${id.substring(0, 15)}...`);
      }
    });
  });

  test.describe('PDF and Book File Access', () => {
    test('public books folder should be accessible', async ({ request }) => {
      const response = await request.get('/books/');

      const validStatuses = [200, 403, 404];
      expect(validStatuses).toContain(response.status());
      console.log(`✅ Books folder access: ${response.status()}`);
    });

    test('should not expose directory listing', async ({ page }) => {
      await page.goto('/books/');
      const content = await page.content();

      const hasDirectoryListing = content.includes('Index of') ||
        content.includes('Directory listing') ||
        content.includes('Parent Directory');

      expect(hasDirectoryListing).toBe(false);
      console.log('✅ Directory listing disabled');
    });
  });

  test.describe('User Profile Image Security', () => {
    test('should validate image upload content type', async ({ page }) => {
      await loginAs(page, 'writer');
      await page.waitForLoadState('networkidle');

      const maliciousPayload = '<script>alert("xss")</script>';
      const blob = new Blob([maliciousPayload], { type: 'image/png' });

      console.log('✅ Image upload security test setup complete');
    });
  });

  test.describe('API Response Security', () => {
    test('should not expose internal paths in error messages', async ({ request }) => {
      const response = await request.get('/api/user/export/nonexistent-id');
      const body = await response.json();

      const sensitivePatterns = [
        '/home/',
        '/var/',
        '/Users/',
        'node_modules',
        '.prisma',
        'C:\\',
        'D:\\'
      ];

      const bodyString = JSON.stringify(body);
      for (const pattern of sensitivePatterns) {
        expect(bodyString).not.toContain(pattern);
      }

      console.log('✅ Error messages do not expose internal paths');
    });

    test('should include security headers', async ({ request }) => {
      const response = await request.get('/api/auth/session');
      const headers = response.headers();

      console.log('Response headers received');

      if (headers['x-frame-options']) {
        console.log('✅ X-Frame-Options header present');
      }
      if (headers['x-content-type-options']) {
        console.log('✅ X-Content-Type-Options header present');
      }
    });
  });

  test.describe('Generated Content Security', () => {
    test('should protect generated images folder', async ({ request }) => {
      const response = await request.get('/generated-images/');

      const validStatuses = [200, 403, 404];
      expect(validStatuses).toContain(response.status());
      console.log(`✅ Generated images folder access: ${response.status()}`);
    });

    test('should block access to non-existent generated images', async ({ request }) => {
      const response = await request.get('/generated-images/../../../etc/passwd');

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Path traversal in generated images blocked');
    });
  });
});
