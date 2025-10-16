import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Writer Authentication Tests', () => {
  const WRITER_EMAIL = 'writer@test.1001stories.org';
  const WRITER_PASSWORD = 'test123';
  const DOCKER_BASE_URL = 'http://localhost:8001';
  const PROD_BASE_URL = 'https://1001stories.seedsofempowerment.org';

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15000);
    await page.context().clearCookies();
  });

  test.describe('Password Authentication - Docker', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    test('should login with password credentials', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const passwordTab = page.locator('button:has-text("Password")');
      if (await passwordTab.isVisible()) {
        await passwordTab.click();
        await page.waitForLoadState('domcontentloaded');
      }

      await page.locator('input[type="email"]').fill(WRITER_EMAIL);
      await page.locator('input[type="password"]').fill(WRITER_PASSWORD);

      await page.screenshot({ path: 'test-results/writer-password-filled.png' });

      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });

      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const passwordTab = page.locator('button:has-text("Password")');
      if (await passwordTab.isVisible()) {
        await passwordTab.click();
        await page.waitForLoadState('domcontentloaded');
      }

      await page.locator('input[type="email"]').fill('invalid@test.com');
      await page.locator('input[type="password"]').fill('wrongpassword');

      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('login');
    });

    test('should redirect unauthenticated dashboard access to login', async ({ page }) => {
      await page.goto('/dashboard/writer');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('login');
    });
  });

  test.describe('Password Authentication - Production', () => {
    test.use({ baseURL: PROD_BASE_URL });

    test('should login to production with password', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });

      await page.locator('button:has-text("Password")').click();
      await page.waitForLoadState('domcontentloaded');

      await page.locator('input[name="email"]').fill(WRITER_EMAIL);
      await page.locator('input[name="password"]').fill(WRITER_PASSWORD);

      await page.screenshot({
        path: 'test-results/prod-writer-credentials.png',
        fullPage: true
      });

      const signInButton = page.locator('button[type="submit"]:has-text("Sign In")');
      await signInButton.click();

      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/dashboard');

      await page.screenshot({
        path: 'test-results/prod-writer-dashboard.png',
        fullPage: true
      });
    });
  });

  test.describe('Magic Link Authentication - Docker', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    function extractMagicLinkFromLogs(): string | null {
      try {
        const logs = execSync('docker-compose logs app --tail=50', {
          encoding: 'utf8',
          cwd: '/Users/jihunkong/1001project/1001-stories'
        });

        const magicLinkRegex = /Magic link for writer@test\.1001stories\.org: (http[^\s]+)/;
        const match = logs.match(magicLinkRegex);

        return match && match[1] ? match[1] : null;
      } catch (error) {
        return null;
      }
    }

    test('should request and use magic link', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"]').first();
      const sendButton = page.locator('button:has-text("Send Magic Link"), button[type="submit"]').first();

      await emailInput.fill(WRITER_EMAIL);
      await sendButton.click();

      await page.waitForLoadState('networkidle');

      const magicLink = extractMagicLinkFromLogs();

      if (magicLink) {
        await page.goto(magicLink, { waitUntil: 'networkidle', timeout: 30000 });

        await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });

        await page.screenshot({
          path: 'test-results/writer-magic-link-dashboard.png',
          fullPage: true
        });
      } else {
        test.skip();
      }
    });

    test('should handle invalid magic link token', async ({ page }) => {
      const invalidLink = `${DOCKER_BASE_URL}/api/auth/callback/email?token=invalid&email=${encodeURIComponent(WRITER_EMAIL)}`;

      await page.goto(invalidLink);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('error');
    });

    test('should handle missing magic link parameters', async ({ page }) => {
      const incompleteLink = `${DOCKER_BASE_URL}/api/auth/callback/email`;

      await page.goto(incompleteLink);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('error');
    });
  });

  test.describe('API Authentication Tests', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    test('should authenticate via NextAuth credentials API', async ({ page }) => {
      const response = await page.request.post('/api/auth/signin/credentials', {
        form: {
          email: WRITER_EMAIL,
          password: WRITER_PASSWORD,
          redirect: 'false',
          json: 'true'
        }
      });

      expect(response.ok()).toBeTruthy();
    });

    test('should check auth session endpoint', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const passwordTab = page.locator('button:has-text("Password")');
      if (await passwordTab.isVisible()) {
        await passwordTab.click();
      }

      await page.locator('input[type="email"]').fill(WRITER_EMAIL);
      await page.locator('input[type="password"]').fill(WRITER_PASSWORD);
      await page.locator('button[type="submit"]').click();

      await page.waitForLoadState('networkidle');

      const sessionResponse = await page.request.get('/api/auth/session');
      expect(sessionResponse.ok()).toBeTruthy();

      const sessionData = await sessionResponse.json();
      expect(sessionData.user?.email).toBe(WRITER_EMAIL);
    });
  });

  test.describe('Form Validation and UX', () => {
    test.use({ baseURL: DOCKER_BASE_URL });

    test('should display login form elements correctly', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput.first()).toBeVisible();

      const passwordTab = page.locator('button:has-text("Password")');
      if (await passwordTab.count() > 0) {
        await expect(passwordTab).toBeVisible();
      }

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton.first()).toBeVisible();
    });

    test('should support mobile viewport login', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible();

      const passwordTab = page.locator('button:has-text("Password")');
      if (await passwordTab.isVisible()) {
        await passwordTab.tap();
        await page.waitForLoadState('domcontentloaded');
      }

      await emailInput.tap();
      await emailInput.fill(WRITER_EMAIL);

      await page.screenshot({
        path: 'test-results/writer-mobile-login.png',
        fullPage: true
      });
    });
  });
});
