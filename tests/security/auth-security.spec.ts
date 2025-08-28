/**
 * Authentication Security Test Suite
 * Tests for authentication vulnerabilities in the new role system
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { generateCSRFToken } from '@/lib/security/headers';

test.describe('Authentication Security', () => {
  
  test.describe('Session Management Vulnerabilities', () => {
    
    test('should invalidate session on role change', async ({ browser }) => {
      // Create two contexts to simulate session hijacking attempt
      const adminContext = await browser.newContext();
      const attackerContext = await browser.newContext();
      
      const adminPage = await adminContext.newPage();
      const attackerPage = await attackerContext.newPage();
      
      // Admin logs in and gets session token
      await adminPage.goto('/login');
      await adminPage.fill('input[type="email"]', 'admin@1001stories.org');
      await adminPage.fill('input[type="password"]', 'admin123');
      await adminPage.click('button[type="submit"]');
      
      // Verify admin access
      await adminPage.goto('/admin');
      await expect(adminPage.locator('h1')).toContainText(/Admin/);
      
      // Extract session cookie
      const cookies = await adminContext.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('next-auth'));
      
      if (!sessionCookie) {
        throw new Error('No session cookie found');
      }
      
      // Admin changes their own role to LEARNER
      await adminPage.goto('/admin/users');
      await adminPage.fill('input[name="search"]', 'admin@1001stories.org');
      await adminPage.click('[data-testid="edit-user-btn"]');
      await adminPage.selectOption('select[name="role"]', 'LEARNER');
      await adminPage.click('button:has-text("Save")');
      
      // Wait for role change to complete
      await adminPage.waitForTimeout(2000);
      
      // Try to use old session in attacker context
      await attackerContext.addCookies([sessionCookie]);
      await attackerPage.goto('/admin');
      
      // CRITICAL: Session should be invalidated after role change
      await expect(attackerPage).toHaveURL(/\/(login|403|dashboard\/learner)/);
      await expect(attackerPage.locator('text=/admin panel/i')).not.toBeVisible();
      
      await adminContext.close();
      await attackerContext.close();
    });
    
    test('should prevent concurrent admin sessions from different IPs', async ({ browser }) => {
      const userAgent1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const userAgent2 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
      
      const context1 = await browser.newContext({ 
        userAgent: userAgent1,
        extraHTTPHeaders: { 'X-Forwarded-For': '192.168.1.100' }
      });
      const context2 = await browser.newContext({ 
        userAgent: userAgent2,
        extraHTTPHeaders: { 'X-Forwarded-For': '10.0.0.50' }
      });
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // First admin login
      await page1.goto('/login');
      await page1.fill('input[type="email"]', 'admin@1001stories.org');
      await page1.fill('input[type="password"]', 'admin123');
      await page1.click('button[type="submit"]');
      await expect(page1).toHaveURL(/\/admin/);
      
      // Second admin login from different IP should trigger security alert
      await page2.goto('/login');
      await page2.fill('input[type="email"]', 'admin@1001stories.org');
      await page2.fill('input[type="password"]', 'admin123');
      await page2.click('button[type="submit"]');
      
      // Should show security warning or force first session logout
      await expect(page2.locator('[data-testid="security-warning"]')).toBeVisible();
      
      await context1.close();
      await context2.close();
    });
    
    test('should enforce shorter session timeout for admin accounts', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@1001stories.org');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Get session expiration from cookie
      const context = page.context();
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('next-auth.session-token'));
      
      if (sessionCookie && sessionCookie.expires) {
        const sessionExpiry = new Date(sessionCookie.expires * 1000);
        const now = new Date();
        const sessionDurationHours = (sessionExpiry.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Admin sessions should expire in 8 hours or less, not 30 days
        expect(sessionDurationHours).toBeLessThanOrEqual(8);
      }
    });
  });
  
  test.describe('JWT Token Security', () => {
    
    test('should prevent JWT token manipulation', async ({ page, context }) => {
      // Login as regular user
      await page.goto('/login');
      await page.fill('input[type="email"]', 'learner@1001stories.org');
      await page.click('button[type="submit"]');
      
      // Get JWT token from storage or cookie
      const cookies = await context.cookies();
      const jwtCookie = cookies.find(c => c.name.includes('next-auth'));
      
      if (jwtCookie) {
        // Attempt to modify JWT payload (simulate token manipulation)
        const modifiedValue = jwtCookie.value + 'MODIFIED';
        
        await context.addCookies([{
          ...jwtCookie,
          value: modifiedValue
        }]);
        
        // Try to access admin panel with modified token
        await page.goto('/admin');
        
        // Should be redirected or show error, not grant admin access
        await expect(page).not.toHaveURL('/admin');
        await expect(page.locator('text=/admin panel/i')).not.toBeVisible();
      }
    });
    
    test('should handle JWT signature verification failure gracefully', async ({ page }) => {
      // Inject invalid JWT token
      await page.addInitScript(() => {
        localStorage.setItem('next-auth.csrf-token', 'invalid-token');
      });
      
      await page.goto('/dashboard');
      
      // Should redirect to login, not crash or grant access
      await expect(page).toHaveURL(/\/login/);
    });
    
    test('should prevent role claim escalation in JWT', async ({ context, page }) => {
      // This test simulates an attacker trying to modify JWT role claim
      await page.goto('/login');
      await page.fill('input[type="email"]', 'learner@1001stories.org');
      await page.click('button[type="submit"]');
      
      // Intercept and attempt to modify API responses containing user role
      await page.route('/api/auth/session', (route) => {
        // Simulate attempting to escalate role in response
        const response = {
          user: {
            id: 'test-user-id',
            email: 'learner@1001stories.org',
            role: 'ADMIN', // Escalated role
            emailVerified: new Date()
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      });
      
      await page.goto('/admin');
      
      // Should still be denied access despite modified response
      await expect(page).not.toHaveURL('/admin');
    });
  });
  
  test.describe('Password Security', () => {
    
    test('should enforce secure password requirements', async ({ page }) => {
      await page.goto('/admin/users');
      await page.click('button:has-text("Add User")');
      
      // Test weak passwords
      const weakPasswords = [
        '123456',
        'password',
        'admin',
        'qwerty',
        '12345678',
        'abc123'
      ];
      
      for (const weakPassword of weakPasswords) {
        await page.fill('input[name="email"]', 'newuser@test.com');
        await page.fill('input[name="password"]', weakPassword);
        await page.click('button[type="submit"]');
        
        // Should show password strength error
        await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
        await expect(page.locator('text=/password.*weak|password.*requirements/i')).toBeVisible();
        
        // Clear form for next iteration
        await page.fill('input[name="password"]', '');
      }
    });
    
    test('should prevent timing attacks on login', async ({ page }) => {
      const startTime = Date.now();
      
      // Attempt login with non-existent email
      await page.goto('/login');
      await page.fill('input[type="email"]', 'nonexistent@test.com');
      await page.fill('input[type="password"]', 'anypassword');
      await page.click('button[type="submit"]');
      
      const timeWithInvalidEmail = Date.now() - startTime;
      
      const startTime2 = Date.now();
      
      // Attempt login with valid email but wrong password
      await page.fill('input[type="email"]', 'learner@1001stories.org');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      const timeWithValidEmail = Date.now() - startTime2;
      
      // Response times should be similar to prevent email enumeration
      const timeDifference = Math.abs(timeWithInvalidEmail - timeWithValidEmail);
      expect(timeDifference).toBeLessThan(200); // Less than 200ms difference
    });
    
    test('should implement account lockout after failed attempts', async ({ page }) => {
      await page.goto('/login');
      
      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        await page.fill('input[type="email"]', 'admin@1001stories.org');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        
        if (i < 4) {
          await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid.*credentials/i);
        }
      }
      
      // After 5 failed attempts, account should be locked
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/account.*locked|too.*many.*attempts/i);
      
      // Even with correct password, login should be blocked
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/account.*locked|too.*many.*attempts/i);
    });
  });
  
  test.describe('Multi-Factor Authentication', () => {
    
    test('should require MFA for admin accounts', async ({ page }) => {
      // Skip if MFA not implemented yet
      test.skip(process.env.MFA_ENABLED !== 'true', 'MFA not enabled in staging');
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@1001stories.org');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Should prompt for MFA code
      await expect(page.locator('[data-testid="mfa-prompt"]')).toBeVisible();
      await expect(page.locator('input[name="mfaCode"]')).toBeVisible();
      
      // Should not allow access without MFA
      await page.goto('/admin');
      await expect(page).not.toHaveURL('/admin');
    });
    
    test('should handle MFA bypass attempts', async ({ page }) => {
      test.skip(process.env.MFA_ENABLED !== 'true', 'MFA not enabled in staging');
      
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@1001stories.org');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Try to bypass MFA by directly accessing admin
      await page.goto('/admin');
      
      // Should still be blocked
      await expect(page).not.toHaveURL('/admin');
      await expect(page.locator('[data-testid="mfa-required"]')).toBeVisible();
    });
  });
  
  test.describe('CSRF Protection', () => {
    
    test('should validate CSRF tokens on state-changing operations', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@1001stories.org');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Attempt role change without CSRF token
      const response = await page.request.post('/api/admin/users/test-user-id', {
        data: {
          role: 'ADMIN'
        },
        headers: {
          'Content-Type': 'application/json'
          // Deliberately omitting CSRF token
        }
      });
      
      // Should be rejected
      expect(response.status()).toBe(403);
    });
    
    test('should reject requests with invalid CSRF tokens', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@1001stories.org');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Attempt with invalid CSRF token
      const response = await page.request.post('/api/admin/users/test-user-id', {
        data: {
          role: 'ADMIN'
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'invalid-token-123'
        }
      });
      
      expect(response.status()).toBe(403);
    });
  });
});