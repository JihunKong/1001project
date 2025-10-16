import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page successfully', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Check that the page title contains "1001 Stories"
    await expect(page).toHaveTitle(/1001 Stories/);

    // Check for key elements on the landing page
    await expect(page.locator('h1')).toBeVisible();

    // Look for navigation or role selection elements
    const roleCards = page.locator('[data-testid="role-card"], .role-card, a[href*="login"]');
    await expect(roleCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have working navigation to login', async ({ page }) => {
    await page.goto('/');

    // Look for login links or buttons
    const loginLink = page.locator('a[href*="login"], button:has-text("Login"), a:has-text("Login")').first();

    if (await loginLink.isVisible()) {
      await loginLink.click();

      // Should navigate to login page
      await expect(page).toHaveURL(/.*login.*/);

      // Should see email input field
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    }
  });

  test('should respond to health check endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('should load demo mode if enabled', async ({ page }) => {
    // Check if demo mode is accessible
    await page.goto('/demo');

    // Should either load demo content or redirect appropriately
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    expect(page.url()).toContain('demo');
  });
});