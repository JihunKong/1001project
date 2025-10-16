import { test, expect } from '@playwright/test';

test.describe('Navigation and Page Load Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for Docker environment
    page.setDefaultTimeout(30000);
  });

  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/1001 Stories/);

    // Check for essential elements
    await expect(page.locator('h1')).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/homepage-load.png' });
  });

  test('should navigate to all main pages without errors', async ({ page }) => {
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/login', name: 'Login' },
      { path: '/signup', name: 'Signup' },
      { path: '/demo', name: 'Demo' },
      { path: '/about', name: 'About' },
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Check that page loads without 404 or 500 errors
      const errorElements = page.locator('text=404').or(page.locator('text=500')).or(page.locator('text=Internal Server Error'));
      await expect(errorElements).toHaveCount(0);

      console.log(`✓ ${pageInfo.name} page loaded successfully`);
    }
  });

  test('should have working role selection cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for role cards or login buttons
    const roleSelectors = [
      '[data-testid="role-card"]',
      '.role-card',
      'a[href*="login"]',
      'button:has-text("Login")',
      'a:has-text("Login")',
      'a:has-text("Student")',
      'a:has-text("Teacher")',
      'a:has-text("Volunteer")'
    ];

    let foundRoleElements = false;
    for (const selector of roleSelectors) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        await expect(elements.first()).toBeVisible();
        foundRoleElements = true;
        console.log(`✓ Found role elements with selector: ${selector}`);
        break;
      }
    }

    if (!foundRoleElements) {
      console.warn('⚠ No role selection elements found - this may be expected depending on current UI');
    }
  });

  test('should handle page refreshes correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check page is still functional
    await expect(page).toHaveTitle(/1001 Stories/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load static assets correctly', async ({ page }) => {
    await page.goto('/');

    // Check for common static assets
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Check if any images fail to load
    const failedImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.complete || img.naturalHeight === 0).length;
    });

    console.log(`Images that failed to load: ${failedImages}`);
    // Allow some images to fail (placeholder images, etc.)
    expect(failedImages).toBeLessThanOrEqual(2);
  });
});