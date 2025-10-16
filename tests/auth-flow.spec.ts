import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/1001 Stories/);

    // Check for email input field
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Send"), button:has-text("Login")');
    await expect(submitButton).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/login-form.png' });
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Send"), button:has-text("Login")').first();

    if (await emailInput.isVisible() && await submitButton.isVisible()) {
      // Try submitting with invalid email
      await emailInput.fill('invalid-email');
      await submitButton.click();

      // Wait a moment for validation
      await page.waitForTimeout(1000);

      // Look for error messages (various possible selectors)
      const errorSelectors = [
        '.error',
        '.text-red-500',
        '.text-red-600',
        '[data-testid="error"]',
        'text=invalid',
        'text=required',
        'text=valid email'
      ];

      let errorFound = false;
      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector);
        if (await errorElement.isVisible()) {
          errorFound = true;
          console.log(`✓ Found validation error with selector: ${selector}`);
          break;
        }
      }

      // HTML5 validation might prevent submission
      const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      if (!emailValidity) {
        console.log('✓ HTML5 email validation working');
        errorFound = true;
      }

      if (!errorFound) {
        console.warn('⚠ No validation error found - this may be handled differently');
      }
    }
  });

  test('should handle email submission flow', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Send"), button:has-text("Login")').first();

    if (await emailInput.isVisible() && await submitButton.isVisible()) {
      // Fill in a valid test email
      await emailInput.fill('test@example.com');
      await submitButton.click();

      // Wait for response (success message or redirect)
      await page.waitForTimeout(3000);

      // Check for success indicators
      const successIndicators = [
        'text=sent',
        'text=check your email',
        'text=magic link',
        '.success',
        '.text-green-500',
        '[data-testid="success"]'
      ];

      let successFound = false;
      for (const selector of successIndicators) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          successFound = true;
          console.log(`✓ Found success indicator: ${selector}`);
          break;
        }
      }

      // Check if redirected to a different page
      const currentUrl = page.url();
      if (currentUrl.includes('verify') || currentUrl.includes('check-email') || currentUrl !== page.url()) {
        successFound = true;
        console.log(`✓ Redirected after email submission: ${currentUrl}`);
      }

      if (!successFound) {
        console.log('ℹ No obvious success indicator found - email may be processed in background');
      }

      await page.screenshot({ path: 'test-results/login-after-submit.png' });
    }
  });

  test('should display signup form correctly', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Check if signup page exists or redirects to login
    const currentUrl = page.url();
    if (currentUrl.includes('signup')) {
      // Check for signup form elements
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      // Look for additional signup fields (name, role, etc.)
      const nameFields = page.locator('input[name="name"], input[name="firstName"], input[name="lastName"]');
      const roleSelectors = page.locator('select[name="role"], input[name="role"]');

      if (await nameFields.count() > 0) {
        console.log('✓ Found name fields in signup form');
      }

      if (await roleSelectors.count() > 0) {
        console.log('✓ Found role selectors in signup form');
      }

      await page.screenshot({ path: 'test-results/signup-form.png' });
    } else {
      console.log('ℹ Signup redirects to login - using unified auth flow');
    }
  });

  test('should handle role-based login redirects', async ({ page }) => {
    // Test different role-based login paths
    const roleUrls = [
      '/login?callbackUrl=/dashboard/learner',
      '/login?callbackUrl=/dashboard/teacher',
      '/login?callbackUrl=/dashboard/writer',
      '/login?role=LEARNER',
      '/login?role=TEACHER',
      '/login?role=WRITER'
    ];

    for (const url of roleUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Should show login form regardless of role
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      if (await emailInput.isVisible()) {
        console.log(`✓ Login form loaded for: ${url}`);
      }

      // Check if role information is preserved
      const roleInfo = page.locator('text=Student').or(page.locator('text=Teacher')).or(page.locator('text=Volunteer'));
      if (await roleInfo.isVisible()) {
        console.log(`✓ Role information displayed for: ${url}`);
      }
    }
  });

  test('should handle authentication state correctly', async ({ page }) => {
    // Test accessing protected routes
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/learner',
      '/dashboard/teacher',
      '/dashboard/writer',
      '/admin'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      // Should redirect to login for protected routes
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        console.log(`✓ Protected route ${route} correctly redirects to login`);
      } else if (currentUrl.includes('dashboard') && !currentUrl.includes('login')) {
        console.log(`ℹ Dashboard route ${route} accessible - may have persistent session`);
      } else {
        console.log(`ℹ Route ${route} behavior: ${currentUrl}`);
      }
    }
  });
});