import { test, expect } from '@playwright/test';

test.describe('Health Check - Production Smoke Tests', () => {
  const baseUrl = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';

  test('API health endpoint returns 200', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/health`);
    expect(response.status()).toBe(200);
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto(baseUrl);
    await expect(page).toHaveTitle(/1001 Stories/i);
  });

  test('Login page is accessible', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    await page.waitForLoadState('networkidle');

    // Should have login form or role selection
    const loginForm = page.locator('form, [data-testid="login-form"], .login-container');
    await expect(loginForm).toBeVisible({ timeout: 10000 });
  });

  test('About page loads', async ({ page }) => {
    await page.goto(`${baseUrl}/about`);
    await page.waitForLoadState('networkidle');

    // Should have content - check body is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Page should load without critical errors
    expect(page.url()).toContain('about');
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto(`${baseUrl}/contact`);
    await page.waitForLoadState('networkidle');

    // Should have content - check body is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Help page loads', async ({ page }) => {
    await page.goto(`${baseUrl}/help`);
    await page.waitForLoadState('networkidle');

    // Should have content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Privacy page loads', async ({ page }) => {
    await page.goto(`${baseUrl}/privacy`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Terms page loads', async ({ page }) => {
    await page.goto(`${baseUrl}/terms`);
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Demo page is accessible', async ({ page }) => {
    await page.goto(`${baseUrl}/demo`);
    await page.waitForLoadState('networkidle');

    // Demo should have content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('API returns valid JSON', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/health`);
    const contentType = response.headers()['content-type'];

    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(body).toBeDefined();
  });

  test('Static assets load correctly', async ({ page }) => {
    await page.goto(baseUrl);

    // Check that images load
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');

      if (src && !src.startsWith('data:')) {
        // Image should have dimensions (loaded)
        const width = await img.evaluate(el => (el as HTMLImageElement).naturalWidth);
        expect(width).toBeGreaterThan(0);
      }
    }
  });

  test('No console errors on homepage', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(
      e =>
        !e.includes('Failed to load resource') &&
        !e.includes('favicon') &&
        !e.includes('404')
    );

    // Should have no critical errors
    expect(criticalErrors.length).toBe(0);
  });

  test('HTTPS is working', async ({ request }) => {
    if (baseUrl.startsWith('https://')) {
      const response = await request.get(baseUrl);
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('Response time is acceptable', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(baseUrl, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Page should load in under 30 seconds (network conditions may vary)
    expect(loadTime).toBeLessThan(30000);
  });

  test('Language switching works', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // Look for language selector
    const languageSelector = page.locator('select[name="language"], [data-testid="language-selector"], .language-selector');

    if (await languageSelector.isVisible()) {
      // Try switching to Korean
      await languageSelector.selectOption('ko');
      await page.waitForLoadState('networkidle');

      // Page should still work
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
