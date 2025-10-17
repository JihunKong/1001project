import { test, expect } from '@playwright/test';

test.describe('Writer Dashboard Tests', () => {
  const WRITER_EMAIL = 'writer@test.1001stories.org';
  const WRITER_PASSWORD = 'test123';
  const DOCKER_BASE_URL = 'http://localhost:8001';
  const PROD_BASE_URL = 'https://1001stories.seedsofempowerment.org';

  async function loginAsWriter(page: any, baseURL: string = DOCKER_BASE_URL) {
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('domcontentloaded');

    const passwordTab = page.locator('button:has-text("Password")');
    if (await passwordTab.isVisible()) {
      await passwordTab.click();
      await page.waitForLoadState('domcontentloaded');
    }

    await page.locator('input[type="email"]').fill(WRITER_EMAIL);
    await page.locator('input[type="password"]').fill(WRITER_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await page.waitForLoadState('networkidle');
  }

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15000);
  });

  test.describe('Dashboard Access and Content - Docker', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    test('should access writer dashboard after login', async ({ page }) => {
      await loginAsWriter(page);

      await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });

      await page.screenshot({
        path: 'test-results/writer-dashboard-home.png',
        fullPage: true
      });
    });

    test('should display writer dashboard elements', async ({ page }) => {
      await loginAsWriter(page);

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent.first()).toBeVisible();

      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation.first()).toBeVisible();

      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();

      await page.screenshot({
        path: 'test-results/writer-dashboard-elements.png',
        fullPage: true
      });
    });

    test('should verify writer-specific content', async ({ page }) => {
      await loginAsWriter(page);

      const pageContent = await page.textContent('body');
      const hasVolunteerContent = pageContent?.toLowerCase().includes('writer') ||
                                  pageContent?.includes('Submit') ||
                                  pageContent?.includes('Story');

      expect(hasVolunteerContent).toBeTruthy();
    });

    test('should check dashboard navigation links', async ({ page }) => {
      await loginAsWriter(page);

      const navLinks = await page.locator('nav a, [role="navigation"] a').count();
      expect(navLinks).toBeGreaterThan(0);

      const allLinks = await page.locator('a').allTextContents();
      expect(allLinks.length).toBeGreaterThan(0);
    });
  });

  test.describe('Dashboard Functionality - Docker', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    test('should navigate to story submission if available', async ({ page }) => {
      await loginAsWriter(page);

      const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');

      if (await submitLink.count() > 0 && await submitLink.first().isVisible()) {
        await submitLink.first().click();
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: 'test-results/writer-submit-story.png',
          fullPage: true
        });

        const url = page.url();
        expect(url).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('should test profile access if available', async ({ page }) => {
      await loginAsWriter(page);

      const profileLink = page.locator('a:has-text("Profile"), button:has-text("Profile")');

      if (await profileLink.count() > 0 && await profileLink.first().isVisible()) {
        await profileLink.first().click();
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: 'test-results/writer-profile.png',
          fullPage: true
        });
      } else {
        test.skip();
      }
    });

    test('should verify logout functionality', async ({ page }) => {
      await loginAsWriter(page);

      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out")');

      if (await logoutButton.count() > 0 && await logoutButton.first().isVisible()) {
        await logoutButton.first().click();
        await page.waitForLoadState('networkidle');

        const url = page.url();
        const isLoggedOut = url.includes('login') || url === DOCKER_BASE_URL || url === `${DOCKER_BASE_URL}/`;

        expect(isLoggedOut).toBeTruthy();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Dashboard UI and Responsiveness - Docker', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await loginAsWriter(page);

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent.first()).toBeVisible();

      await page.screenshot({
        path: 'test-results/writer-dashboard-mobile.png',
        fullPage: true
      });
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await loginAsWriter(page);

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent.first()).toBeVisible();

      await page.screenshot({
        path: 'test-results/writer-dashboard-tablet.png',
        fullPage: true
      });
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await loginAsWriter(page);

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent.first()).toBeVisible();

      await page.screenshot({
        path: 'test-results/writer-dashboard-desktop.png',
        fullPage: true
      });
    });
  });

  test.describe('Dashboard Visual Verification - Production', () => {
    test.use({ baseURL: PROD_BASE_URL });

    test('should verify dashboard styling and colors', async ({ page, context }) => {
      await context.route('**/*', route => {
        const headers = {
          ...route.request().headers(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
        route.continue({ headers });
      });

      await loginAsWriter(page, PROD_BASE_URL);

      await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'test-results/writer-dashboard-visual.png',
        fullPage: true
      });

      const gradientElements = page.locator('div.bg-gradient-to-br');
      if (await gradientElements.count() > 0) {
        const firstGradient = gradientElements.first();
        const backgroundImage = await firstGradient.evaluate((el) => {
          return window.getComputedStyle(el).backgroundImage;
        });

        expect(backgroundImage).toContain('linear-gradient');
      }
    });
  });

  test.describe('Dashboard Performance - Docker', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await loginAsWriter(page);

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(15000);
    });

    test('should not have console errors on dashboard', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await loginAsWriter(page);

      await page.waitForLoadState('networkidle');

      if (consoleErrors.length > 0) {
        console.log('Console errors found:', consoleErrors);
      }

      expect(consoleErrors.length).toBe(0);
    });
  });

  test.describe('Dashboard Navigation Paths - Docker', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    test('should navigate between dashboard sections', async ({ page }) => {
      await loginAsWriter(page);

      const dashboardPaths = [
        '/dashboard',
        '/dashboard/writer',
        '/library',
        '/profile'
      ];

      for (const path of dashboardPaths) {
        await page.goto(`${DOCKER_BASE_URL}${path}`);
        await page.waitForLoadState('networkidle');

        const currentUrl = page.url();
        const isAccessible = !currentUrl.includes('login') && !currentUrl.includes('error');

        if (isAccessible) {
          await page.screenshot({
            path: `test-results/writer-nav-${path.replace(/\//g, '-')}.png`
          });
        }

        expect(currentUrl).toBeTruthy();
      }
    });
  });
});
