import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Authentication Flow Tests for Role System V2
 * 
 * Tests the complete authentication flow including:
 * - Role selection removal from signup
 * - Unified login process
 * - Automatic role assignment (CUSTOMER default)
 * - Legacy user migration (LEARNER → CUSTOMER)
 * - Admin role preservation
 */

test.describe('Authentication Flow - Role System V2', () => {
  
  test.describe('New User Registration', () => {
    test('should register new user without role selection', async ({ page }) => {
      const testEmail = faker.internet.email();
      
      // Navigate to signup
      await page.goto('/signup');
      
      // Verify role selection interface is NOT present
      await expect(page.locator('[data-testid="role-selector"]')).not.toBeVisible();
      await expect(page.locator('text=Choose your role')).not.toBeVisible();
      await expect(page.locator('text=Select role')).not.toBeVisible();
      
      // Fill signup form (should only require email)
      await page.fill('input[type="email"]', testEmail);
      await page.click('button[type="submit"]');
      
      // Verify email sent confirmation
      await expect(page.locator('text=Check your email')).toBeVisible();
      await expect(page.locator(`text=${testEmail}`)).toBeVisible();
      
      // Simulate magic link click (in test environment)
      await page.goto(`/api/auth/demo-login?email=${testEmail}&role=CUSTOMER`);
      
      // Should redirect to unified dashboard
      await page.waitForURL('/dashboard');
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Verify user has CUSTOMER role by default
      const response = await page.request.get('/api/user/profile');
      const profile = await response.json();
      expect(profile.role).toBe('CUSTOMER');
    });

    test('should handle signup form validation', async ({ page }) => {
      await page.goto('/signup');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Should show email validation error
      await expect(page.locator('text=Email is required')).toBeVisible();
      
      // Enter invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      
      // Should show email format error
      await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    });

    test('should prevent duplicate registration', async ({ page }) => {
      const existingEmail = 'customer@test.1001stories.org';
      
      await page.goto('/signup');
      await page.fill('input[type="email"]', existingEmail);
      await page.click('button[type="submit"]');
      
      // Should show user already exists message
      await expect(page.locator('text=Account already exists')).toBeVisible();
      await expect(page.locator('text=Please sign in instead')).toBeVisible();
    });
  });

  test.describe('Login Process', () => {
    test('should login existing CUSTOMER user', async ({ page }) => {
      await page.goto('/login');
      
      // Verify no role selection on login page
      await expect(page.locator('[data-testid="role-selector"]')).not.toBeVisible();
      
      await page.fill('input[type="email"]', 'customer@test.1001stories.org');
      await page.click('button[type="submit"]');
      
      // Simulate magic link authentication
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      
      // Should redirect to unified dashboard
      await page.waitForURL('/dashboard');
      await expect(page.locator('h1')).toContainText('Dashboard');
    });

    test('should login ADMIN user and maintain admin role', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'admin@test.1001stories.org');
      await page.click('button[type="submit"]');
      
      // Simulate admin login
      await page.goto('/api/auth/demo-login?email=admin@test.1001stories.org&role=ADMIN');
      
      // Admin should have access to admin dashboard
      await page.goto('/admin');
      await expect(page.locator('h1')).toContainText('Admin Dashboard');
      
      // Verify admin role is preserved
      const response = await page.request.get('/api/user/profile');
      const profile = await response.json();
      expect(profile.role).toBe('ADMIN');
    });

    test('should handle invalid email during login', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.click('button[type="submit"]');
      
      // Should show account not found message
      await expect(page.locator('text=Account not found')).toBeVisible();
      await expect(page.locator('text=Would you like to sign up?')).toBeVisible();
    });
  });

  test.describe('Legacy User Migration', () => {
    test('should migrate LEARNER user to CUSTOMER on login', async ({ page }) => {
      // Create a legacy LEARNER user in test database
      await page.request.post('/api/test/create-legacy-user', {
        data: {
          email: 'legacy@test.1001stories.org',
          role: 'LEARNER'
        }
      });
      
      // Login as legacy user
      await page.goto('/login');
      await page.fill('input[type="email"]', 'legacy@test.1001stories.org');
      await page.click('button[type="submit"]');
      
      // Simulate login
      await page.goto('/api/auth/demo-login?email=legacy@test.1001stories.org&role=LEARNER');
      
      // Should redirect to unified dashboard (not /dashboard/learner)
      await page.waitForURL('/dashboard');
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Verify role has been migrated to CUSTOMER
      const response = await page.request.get('/api/user/profile');
      const profile = await response.json();
      expect(profile.role).toBe('CUSTOMER');
      
      // Verify old learner dashboard is not accessible
      const learnerResponse = await page.request.get('/dashboard/learner');
      expect(learnerResponse.status()).toBe(404);
    });

    test('should preserve user data during role migration', async ({ page }) => {
      const testData = {
        email: 'learner-data@test.1001stories.org',
        name: 'Test Learner',
        preferences: { language: 'en', theme: 'light' }
      };
      
      // Create legacy user with data
      await page.request.post('/api/test/create-legacy-user', {
        data: { ...testData, role: 'LEARNER' }
      });
      
      // Login to trigger migration
      await page.goto('/api/auth/demo-login?email=${testData.email}&role=LEARNER');
      await page.waitForURL('/dashboard');
      
      // Verify data is preserved
      const response = await page.request.get('/api/user/profile');
      const profile = await response.json();
      
      expect(profile.role).toBe('CUSTOMER');
      expect(profile.name).toBe(testData.name);
      expect(profile.preferences).toMatchObject(testData.preferences);
    });
  });

  test.describe('Authentication States', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL('/login');
      await expect(page.locator('h1')).toContainText('Sign In');
    });

    test('should maintain authentication across page reloads', async ({ page }) => {
      // Login as customer
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.waitForURL('/dashboard');
      
      // Reload page
      await page.reload();
      
      // Should still be authenticated
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Navigate to different protected page
      await page.goto('/library');
      await expect(page.locator('h1')).toContainText('Library');
    });

    test('should handle session expiration', async ({ page }) => {
      // Login as customer
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.waitForURL('/dashboard');
      
      // Simulate session expiration by clearing cookies
      await page.context().clearCookies();
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL('/login');
    });

    test('should handle logout correctly', async ({ page }) => {
      // Login as customer
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.waitForURL('/dashboard');
      
      // Click logout button
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Sign Out');
      
      // Should redirect to home page
      await page.waitForURL('/');
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL('/login');
    });
  });

  test.describe('Demo Mode Access', () => {
    test('should allow demo access without authentication', async ({ page }) => {
      await page.goto('/demo');
      
      // Should be able to access demo without login
      await expect(page.locator('h1')).toContainText('Demo');
      await expect(page.locator('[data-testid="demo-banner"]')).toBeVisible();
      
      // Demo navigation should work
      await page.click('text=Try Library');
      await expect(page.url()).toContain('/demo/library');
    });

    test('should show demo indicators throughout demo experience', async ({ page }) => {
      await page.goto('/demo/library');
      
      // Should show demo banner
      await expect(page.locator('[data-testid="demo-banner"]')).toBeVisible();
      await expect(page.locator('text=This is a demo')).toBeVisible();
      
      // Should show signup CTAs
      await expect(page.locator('text=Sign up to save your progress')).toBeVisible();
    });

    test('should convert demo user to registered user', async ({ page }) => {
      await page.goto('/demo/library');
      
      // Click signup CTA from demo
      await page.click('text=Sign Up Now');
      
      // Should navigate to signup with demo context
      await page.waitForURL('/signup');
      await expect(page.locator('text=Continue your journey')).toBeVisible();
    });
  });
});