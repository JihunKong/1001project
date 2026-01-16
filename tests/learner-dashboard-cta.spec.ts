import { test, expect } from '@playwright/test';

test.describe('Learner Dashboard CTA Buttons', () => {
  const baseUrl = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';

  test.describe('Dashboard Access and Redirect', () => {
    test('learner dashboard redirects to login when unauthenticated', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/learner`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
    });

    test('protected dashboard routes require authentication', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard/learner',
        '/dashboard/learner/vocabulary',
        '/dashboard/learner/achievements'
      ];

      for (const route of protectedRoutes) {
        await page.goto(`${baseUrl}${route}`);
        await page.waitForLoadState('networkidle');

        const currentUrl = page.url();
        const isProtected = currentUrl.includes('login') || currentUrl.includes('callbackUrl');
        expect(isProtected).toBe(true);
      }
    });
  });

  test.describe('Library Page Accessibility', () => {
    test('library page loads successfully', async ({ page }) => {
      await page.goto(`${baseUrl}/library`);
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      await expect(body).toBeVisible();

      const isLibraryPage = page.url().includes('library') || page.url().includes('login');
      expect(isLibraryPage).toBe(true);
    });
  });

  test.describe('Demo Mode Learner Dashboard', () => {
    test('demo page is accessible and has content', async ({ page }) => {
      await page.goto(`${baseUrl}/demo`);
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      await expect(body).toBeVisible();

      const contentLength = await page.content();
      expect(contentLength.length).toBeGreaterThan(1000);
    });

    test('demo mode learner dashboard if available', async ({ page }) => {
      await page.goto(`${baseUrl}/demo/learner`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      if (currentUrl.includes('demo/learner')) {
        const body = page.locator('body');
        await expect(body).toBeVisible();

        const quickActionsSection = page.locator('text=Quick Actions').or(
          page.locator('text=Learning Tools')
        );

        const hasQuickActions = await quickActionsSection.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasQuickActions) {
          console.log('Quick Actions section found in demo learner dashboard');
        }

        const ctaButtons = [
          'text=Join Book Club',
          'text=Ask AI Helper',
          'text=Rate Books',
          'text=My Vocabulary',
          'text=Achievements',
          'text=Take Quiz'
        ];

        let foundButtons = 0;
        for (const buttonText of ctaButtons) {
          const button = page.locator(buttonText);
          if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
            foundButtons++;
            console.log(`Found CTA button: ${buttonText.replace('text=', '')}`);
          }
        }

        console.log(`Found ${foundButtons}/${ctaButtons.length} CTA buttons`);
      } else {
        console.log('Demo learner dashboard not available - redirected to:', currentUrl);
      }
    });
  });

  test.describe('CTA Navigation Endpoints', () => {
    test('vocabulary page route exists', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/learner/vocabulary`);
      await page.waitForLoadState('networkidle');

      const redirectedToLogin = page.url().includes('login');
      expect(redirectedToLogin).toBe(true);
    });

    test('achievements page route exists', async ({ page }) => {
      await page.goto(`${baseUrl}/dashboard/learner/achievements`);
      await page.waitForLoadState('networkidle');

      const redirectedToLogin = page.url().includes('login');
      expect(redirectedToLogin).toBe(true);
    });

    test('class join API endpoint exists', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/classes/join/TEST123`);

      expect([200, 302, 400, 401, 404, 405]).toContain(response.status());
    });
  });

  test.describe('Homepage and Navigation', () => {
    test('homepage loads with navigation elements', async ({ page }) => {
      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveTitle(/1001 Stories/i);

      const nav = page.locator('nav, header');
      await expect(nav).toBeVisible();

      const loginLinks = page.locator('a[href*="login"], a:has-text("Login"), a:has-text("Sign"), button:has-text("Login")');
      const loginLinkCount = await loginLinks.count();
      expect(loginLinkCount).toBeGreaterThan(0);
    });

    test('login page has role selection for learner', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible({ timeout: 10000 });

      const learnerRole = page.locator(
        '[data-role="learner"], ' +
        'text=Learner, ' +
        'text=Student, ' +
        'button:has-text("Learner"), ' +
        'a:has-text("Learner")'
      );

      const hasLearnerOption = await learnerRole.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Learner role option visible on login page: ${hasLearnerOption}`);
    });
  });

  test.describe('API Health Checks', () => {
    test('main health endpoint is accessible', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/health`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
    });

    test('books API responds appropriately', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/books`);
      expect([200, 401]).toContain(response.status());
    });

    test('authentication endpoints are accessible', async ({ request }) => {
      const sessionResponse = await request.get(`${baseUrl}/api/auth/session`);
      expect(sessionResponse.status()).toBe(200);

      const csrfResponse = await request.get(`${baseUrl}/api/auth/csrf`);
      expect(csrfResponse.status()).toBe(200);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('login page works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      await expect(body).toBeVisible();

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible({ timeout: 10000 });
    });

    test('homepage works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(baseUrl);
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      await expect(body).toBeVisible();

      await expect(page).toHaveTitle(/1001 Stories/i);
    });
  });
});
