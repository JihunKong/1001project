import { test, expect } from '@playwright/test';

test.describe('Password Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    // Wait for the login form to be visible instead of network idle
    await page.getByPlaceholder(/enter your email/i).waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should display password login form', async ({ page }) => {
    // Verify password form is displayed (no tabs, direct password login)
    await expect(page.getByPlaceholder(/enter your email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();

    // Verify Google social login is visible
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();

    // Verify Forgot Password link is visible
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.getByPlaceholder(/enter your email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/enter your password/i).fill('wrongpassword');

    // Click log in
    await page.getByRole('button', { name: /log in/i }).click();

    // Wait for error message
    await expect(page.getByText(/invalid.*email.*password/i)).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Enter valid test credentials
    await page.getByPlaceholder(/enter your email/i).fill('writer@test.1001stories.org');
    await page.getByPlaceholder(/enter your password/i).fill('Test1234');

    // Click log in
    await page.getByRole('button', { name: /log in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });

    // Verify dashboard is loaded
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should handle empty email field', async ({ page }) => {
    // Leave email empty and enter password
    await page.getByPlaceholder(/enter your password/i).fill('test123');

    // Click log in
    await page.getByRole('button', { name: /log in/i }).click();

    // Check for validation error
    await expect(page.getByText(/email.*required/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty password field', async ({ page }) => {
    // Enter email but leave password empty
    await page.getByPlaceholder(/enter your email/i).fill('writer@test.1001stories.org');

    // Click log in
    await page.getByRole('button', { name: /log in/i }).click();

    // Check for validation error
    await expect(page.getByText(/password.*required/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show password visibility toggle', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/enter your password/i);
    const toggleButton = page.getByLabel(/show password|hide password/i);

    // Check initial state (password should be hidden)
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again to hide password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should redirect to original page after login', async ({ page }) => {
    // Navigate to a protected page first
    await page.goto('/dashboard/writer');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.getByPlaceholder(/enter your email/i).fill('writer@test.1001stories.org');
    await page.getByPlaceholder(/enter your password/i).fill('Test1234');
    await page.getByRole('button', { name: /log in/i }).click();

    // Should be redirected back to the originally requested page
    await page.waitForURL('**/dashboard/writer', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/writer/);
  });
});

test.describe('Password Reset Flow', () => {
  test('should show forgot password link and navigate to reset page', async ({ page }) => {
    await page.goto('/login');

    // Look for forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password/i });
    await expect(forgotPasswordLink).toBeVisible();

    // Click the link
    await forgotPasswordLink.click();

    // Should navigate to password reset page
    await expect(page).toHaveURL(/\/(auth\/forgot-password|forgot.*password|reset.*password)/);

    // Check reset form is displayed or magic link request
    await expect(page.getByPlaceholder(/enter your email/i)).toBeVisible();
  });
});