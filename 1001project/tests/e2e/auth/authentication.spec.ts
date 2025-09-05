import { test, expect, Page } from '@playwright/test';
import { UserFactory } from '../../fixtures/factories/user.factory';

test.describe('Authentication Flow', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
  });
  
  test.describe('Login', () => {
    test('should successfully login with valid credentials', async () => {
      // Navigate to login
      await page.click('text=Sign In');
      
      // Fill login form
      await page.fill('input[name="email"]', 'test.learner@1001stories.test');
      await page.fill('input[name="password"]', 'TestPass123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard/**');
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('text=Test Learner')).toBeVisible();
    });
    
    test('should show error for invalid credentials', async () => {
      await page.click('text=Sign In');
      
      await page.fill('input[name="email"]', 'invalid@test.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('[role="alert"]')).toContainText(/Invalid credentials/i);
      
      // Should not redirect
      await expect(page).toHaveURL(/.*\/auth\/signin/);
    });
    
    test('should handle unverified email', async () => {
      await page.click('text=Sign In');
      
      await page.fill('input[name="email"]', 'unverified@test.com');
      await page.fill('input[name="password"]', 'TestPass123!');
      
      await page.click('button[type="submit"]');
      
      // Check for verification message
      await expect(page.locator('[role="alert"]')).toContainText(/verify your email/i);
    });
    
    test('should handle inactive account', async () => {
      await page.click('text=Sign In');
      
      await page.fill('input[name="email"]', 'inactive@test.com');
      await page.fill('input[name="password"]', 'TestPass123!');
      
      await page.click('button[type="submit"]');
      
      // Check for account status message
      await expect(page.locator('[role="alert"]')).toContainText(/account.*deactivated/i);
    });
  });
  
  test.describe('Magic Link Login', () => {
    test('should send magic link successfully', async () => {
      await page.click('text=Sign In');
      await page.click('text=Sign in with email');
      
      // Enter email
      await page.fill('input[name="email"]', 'test.learner@1001stories.test');
      await page.click('button:has-text("Send Magic Link")');
      
      // Check for success message
      await expect(page.locator('[role="status"]')).toContainText(/Check your email/i);
      
      // In test environment, we would check MailHog for the email
      // This would be done in a separate integration test
    });
    
    test('should validate email format', async () => {
      await page.click('text=Sign In');
      await page.click('text=Sign in with email');
      
      // Invalid email
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button:has-text("Send Magic Link")');
      
      // Check for validation error
      await expect(page.locator('[role="alert"]')).toContainText(/valid email/i);
    });
  });
  
  test.describe('Logout', () => {
    test('should successfully logout', async () => {
      // First login
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'test.learner@1001stories.test');
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/**');
      
      // Open user menu and logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Sign Out');
      
      // Should redirect to home
      await expect(page).toHaveURL('/');
      
      // User menu should not be visible
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    });
    
    test('should clear session on logout', async () => {
      // Login
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'test.learner@1001stories.test');
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/**');
      
      // Get cookies before logout
      const cookiesBefore = await page.context().cookies();
      const sessionCookieBefore = cookiesBefore.find(c => c.name.includes('session'));
      expect(sessionCookieBefore).toBeDefined();
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Sign Out');
      
      // Check cookies after logout
      const cookiesAfter = await page.context().cookies();
      const sessionCookieAfter = cookiesAfter.find(c => c.name.includes('session'));
      expect(sessionCookieAfter).toBeUndefined();
    });
  });
  
  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async () => {
      // Login
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'test.learner@1001stories.test');
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/**');
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page).toHaveURL('**/dashboard/**');
    });
    
    test('should redirect to login when session expires', async () => {
      // This test would require manipulating session expiry
      // In a real scenario, we'd set a short session timeout for testing
      test.skip();
    });
  });
  
  test.describe('Password Reset', () => {
    test('should navigate to password reset flow', async () => {
      await page.click('text=Sign In');
      await page.click('text=Forgot password?');
      
      // Should be on reset page
      await expect(page).toHaveURL(/.*\/auth\/reset-password/);
      
      // Enter email
      await page.fill('input[name="email"]', 'test.learner@1001stories.test');
      await page.click('button:has-text("Reset Password")');
      
      // Check for success message
      await expect(page.locator('[role="status"]')).toContainText(/reset link.*sent/i);
    });
  });
  
  test.describe('Multi-language Support', () => {
    test('should switch language on login page', async () => {
      await page.click('text=Sign In');
      
      // Switch to Korean
      await page.click('[data-testid="language-selector"]');
      await page.click('text=한국어');
      
      // Check if UI is in Korean
      await expect(page.locator('h1')).toContainText('로그인');
      await expect(page.locator('button[type="submit"]')).toContainText('로그인');
      
      // Switch back to English
      await page.click('[data-testid="language-selector"]');
      await page.click('text=English');
      
      // Check if UI is back in English
      await expect(page.locator('h1')).toContainText('Sign In');
    });
  });
});