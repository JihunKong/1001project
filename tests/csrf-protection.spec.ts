import { test, expect } from '@playwright/test';

test.describe('CSRF Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin login
    await page.goto('/login');
    
    // Wait for login form and enter admin credentials
    await page.fill('[type="email"]', 'admin@1001stories.org');
    await page.click('button[type="submit"]');
    
    // Wait for magic link email message (in real test, we'd mock this)
    await page.waitForSelector('text=Check your email', { timeout: 5000 });
    
    // For testing purposes, we'll navigate directly to admin after login
    // In real scenarios, this would be handled by clicking the magic link
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
  });

  test('should generate CSRF token on admin page load', async ({ page }) => {
    // Check that CSRF token is available in sessionStorage
    const csrfToken = await page.evaluate(() => {
      return sessionStorage.getItem('csrf-token');
    });
    
    expect(csrfToken).not.toBeNull();
    expect(csrfToken).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
  });

  test('should include CSRF token in admin API requests', async ({ page }) => {
    let csrfHeaderSent = false;
    
    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('/api/admin/')) {
        const headers = request.headers();
        if (headers['x-csrf-token']) {
          csrfHeaderSent = true;
        }
      }
    });

    // Trigger an admin API call by refreshing users list
    await page.click('button:has-text("Refresh")');
    await page.waitForTimeout(1000);
    
    expect(csrfHeaderSent).toBe(true);
  });

  test('should reject admin requests without CSRF token', async ({ page }) => {
    // Make a direct API call without CSRF token
    const response = await page.request.delete('/api/admin/users/test-user-id', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('CSRF token required');
  });

  test('should reject admin requests with invalid CSRF token', async ({ page }) => {
    // Make a direct API call with invalid CSRF token
    const response = await page.request.delete('/api/admin/users/test-user-id', {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'invalid-token-12345'
      }
    });
    
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('CSRF token required');
  });

  test('should allow public API requests without CSRF token', async ({ page }) => {
    // Public APIs should work without CSRF token
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('should refresh CSRF token automatically', async ({ page }) => {
    // Get initial token
    const initialToken = await page.evaluate(() => {
      return sessionStorage.getItem('csrf-token');
    });
    
    // Wait for token refresh (testing the 50-minute interval would be impractical,
    // so we'll manually trigger a refresh)
    await page.evaluate(() => {
      // Trigger token refresh manually for testing
      window.dispatchEvent(new Event('csrf-token-refresh'));
    });
    
    await page.waitForTimeout(2000);
    
    const newToken = await page.evaluate(() => {
      return sessionStorage.getItem('csrf-token');
    });
    
    expect(newToken).not.toBeNull();
    expect(newToken).not.toBe(initialToken);
  });
});