import { test, expect } from '@playwright/test';

test.describe('Password Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display password tab and allow switching', async ({ page }) => {
    // Check that Magic Link tab is active by default
    const magicLinkTab = page.getByRole('button', { name: /magic link/i });
    const passwordTab = page.getByRole('button', { name: /password/i });

    await expect(magicLinkTab).toBeVisible();
    await expect(passwordTab).toBeVisible();

    // Click on Password tab
    await passwordTab.click();

    // Verify password form is displayed
    await expect(page.getByPlaceholder(/enter your email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Switch to password tab
    await page.getByRole('button', { name: /password/i }).click();

    // Enter invalid credentials
    await page.getByPlaceholder(/enter your email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/enter your password/i).fill('wrongpassword');

    // Click sign in
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Switch to password tab
    await page.getByRole('button', { name: /password/i }).click();

    // Enter valid test credentials
    await page.getByPlaceholder(/enter your email/i).fill('volunteer@test.1001stories.org');
    await page.getByPlaceholder(/enter your password/i).fill('test123');

    // Click sign in
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });

    // Verify dashboard is loaded
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for user menu or logout button as confirmation
    const userMenu = page.getByRole('button', { name: /user menu|profile|logout/i });
    await expect(userMenu).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty email field', async ({ page }) => {
    // Switch to password tab
    await page.getByRole('button', { name: /password/i }).click();

    // Leave email empty and enter password
    await page.getByPlaceholder(/enter your password/i).fill('test123');

    // Click sign in
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for validation error
    await expect(page.getByText(/email.*required/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty password field', async ({ page }) => {
    // Switch to password tab
    await page.getByRole('button', { name: /password/i }).click();

    // Enter email but leave password empty
    await page.getByPlaceholder(/enter your email/i).fill('volunteer@test.1001stories.org');

    // Click sign in
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for validation error
    await expect(page.getByText(/password.*required/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show password visibility toggle', async ({ page }) => {
    // Switch to password tab
    await page.getByRole('button', { name: /password/i }).click();

    const passwordInput = page.getByPlaceholder(/enter your password/i);
    const toggleButton = page.getByRole('button', { name: /show password|hide password|toggle password/i });

    // Check initial state (password should be hidden)
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again to hide password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should maintain form state when switching tabs', async ({ page }) => {
    // Enter email in Magic Link tab
    await page.getByPlaceholder(/enter your email/i).fill('test@example.com');

    // Switch to Password tab
    await page.getByRole('button', { name: /password/i }).click();

    // Email should be preserved
    await expect(page.getByPlaceholder(/enter your email/i)).toHaveValue('test@example.com');

    // Switch back to Magic Link tab
    await page.getByRole('button', { name: /magic link/i }).click();

    // Email should still be preserved
    await expect(page.getByPlaceholder(/enter your email/i)).toHaveValue('test@example.com');
  });

  test('should redirect to original page after login', async ({ page }) => {
    // Navigate to a protected page first
    await page.goto('/dashboard/writer');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);

    // Switch to password tab and login
    await page.getByRole('button', { name: /password/i }).click();
    await page.getByPlaceholder(/enter your email/i).fill('volunteer@test.1001stories.org');
    await page.getByPlaceholder(/enter your password/i).fill('test123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should be redirected back to the originally requested page
    await page.waitForURL('**/dashboard/writer', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/volunteer/);
  });
});

test.describe('Password Reset Flow', () => {
  test('should show forgot password link and navigate to reset page', async ({ page }) => {
    await page.goto('/login');

    // Switch to password tab
    await page.getByRole('button', { name: /password/i }).click();

    // Look for forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password/i });
    await expect(forgotPasswordLink).toBeVisible();

    // Click the link
    await forgotPasswordLink.click();

    // Should navigate to password reset page
    await expect(page).toHaveURL(/\/(forgot|reset).*password/);

    // Check reset form is displayed
    await expect(page.getByPlaceholder(/enter your email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send.*reset.*link/i })).toBeVisible();
  });
});