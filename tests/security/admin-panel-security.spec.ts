/**
 * Admin Panel Security Tests
 * Tests for admin interface vulnerabilities and security controls
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Admin Panel Security', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@1001stories.org');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);
  });
  
  test.describe('Input Validation and Sanitization', () => {
    
    test('should prevent XSS in user management forms', async ({ page }) => {
      await page.goto('/admin/users');
      await page.click('button:has-text("Add User")');
      
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')" />',
        '<svg onload="alert(\'XSS\')" />',
        '${alert("XSS")}',
        '{{constructor.constructor("alert(\'XSS\')")()}}'
      ];
      
      for (const payload of xssPayloads) {
        await page.fill('input[name="name"]', payload);
        await page.fill('input[name="email"]', 'test@example.com');
        await page.selectOption('select[name="role"]', 'LEARNER');
        await page.click('button[type="submit"]');
        
        // Wait for form processing
        await page.waitForTimeout(1000);
        
        // Check that script didn't execute
        const alertDialogs = page.locator('dialog[role="alert"]');
        await expect(alertDialogs).toHaveCount(0);
        
        // Check that the payload is properly escaped in the UI
        if (await page.locator('text="User created"').isVisible()) {
          await page.goto('/admin/users');
          const userRow = page.locator(`tr:has-text("test@example.com")`);
          const displayedName = await userRow.locator('td').first().textContent();
          
          // Should be escaped/sanitized, not raw HTML
          expect(displayedName).not.toContain('<script>');
          expect(displayedName).not.toContain('javascript:');
          expect(displayedName).not.toContain('<img');
        }
        
        // Clear form for next iteration
        await page.fill('input[name="name"]', '');
        await page.fill('input[name="email"]', '');
      }
    });
    
    test('should prevent SQL injection in search and filters', async ({ page }) => {
      await page.goto('/admin/users');
      
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users WHERE '1'='1",
        "1; DELETE FROM users; --",
        "admin' OR role='ADMIN' --",
        "test@example.com'; UPDATE users SET role='ADMIN' WHERE '1'='1; --"
      ];
      
      for (const payload of sqlPayloads) {
        // Test search field
        await page.fill('input[name="search"]', payload);
        await page.press('input[name="search"]', 'Enter');
        
        // Should not cause database error or expose sensitive data
        await expect(page.locator('text=/database error|sql error|syntax error/i')).not.toBeVisible();
        await expect(page.locator('text=/table.*does.*not.*exist/i')).not.toBeVisible();
        
        // Check that it didn't modify data
        const response = await page.request.get('/api/admin/users');
        expect(response.ok()).toBe(true);
        
        // Clear search
        await page.fill('input[name="search"]', '');
      }
    });
    
    test('should validate file upload security', async ({ page }) => {
      await page.goto('/admin/media/upload');
      
      // Test malicious file uploads
      const maliciousFiles = [
        {
          name: 'malicious.php',
          content: '<?php system($_GET["cmd"]); ?>',
          type: 'application/x-php'
        },
        {
          name: 'script.js.exe',
          content: 'malicious executable content',
          type: 'application/x-msdownload'
        },
        {
          name: '../../../etc/passwd',
          content: 'root:x:0:0:root:/root:/bin/bash',
          type: 'text/plain'
        },
        {
          name: 'image.svg',
          content: '<svg onload="alert(\'XSS\')" xmlns="http://www.w3.org/2000/svg"/>',
          type: 'image/svg+xml'
        }
      ];
      
      for (const maliciousFile of maliciousFiles) {
        // Create file blob
        const fileContent = new Blob([maliciousFile.content], { type: maliciousFile.type });
        
        // Attempt to upload
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: maliciousFile.name,
          mimeType: maliciousFile.type,
          buffer: Buffer.from(maliciousFile.content)
        });
        
        await page.click('button[type="submit"]');
        
        // Should be rejected
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('text=/file.*type.*not.*allowed|invalid.*file/i')).toBeVisible();
      }
    });
  });
  
  test.describe('Access Control and Authorization', () => {
    
    test('should prevent last admin from demoting themselves', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Search for current admin
      await page.fill('input[name="search"]', 'admin@1001stories.org');
      await page.press('input[name="search"]', 'Enter');
      
      // Try to edit own role
      await page.click('[data-testid="edit-user-btn"]');
      await page.selectOption('select[name="role"]', 'LEARNER');
      await page.click('button:has-text("Save")');
      
      // Should show error preventing last admin removal
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/cannot.*change.*last.*admin|must.*have.*admin/i);
      
      // Role should remain ADMIN
      const roleSelect = page.locator('select[name="role"]');
      await expect(roleSelect).toHaveValue('ADMIN');
    });
    
    test('should prevent deletion of last admin account', async ({ page }) => {
      await page.goto('/admin/users');
      await page.fill('input[name="search"]', 'admin@1001stories.org');
      await page.press('input[name="search"]', 'Enter');
      
      // Attempt to delete admin account
      await page.click('[data-testid="delete-user-btn"]');
      await page.click('button:has-text("Confirm Delete")');
      
      // Should show error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/cannot.*delete.*last.*admin/i);
      
      // User should still exist
      await page.reload();
      await page.fill('input[name="search"]', 'admin@1001stories.org');
      await expect(page.locator('text=admin@1001stories.org')).toBeVisible();
    });
    
    test('should require confirmation for destructive actions', async ({ page }) => {
      await page.goto('/admin/stories');
      
      // Test bulk delete requires confirmation
      await page.click('input[type="checkbox"]'); // Select all
      await page.click('button:has-text("Delete Selected")');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
      await expect(page.locator('text=/are.*you.*sure|permanently.*delete/i')).toBeVisible();
      
      // Cancel should not delete
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('[data-testid="confirmation-dialog"]')).not.toBeVisible();
      
      // Test publish all requires confirmation
      await page.click('button:has-text("Publish All")');
      await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
    });
    
    test('should implement audit logging for admin actions', async ({ page }) => {
      await page.goto('/admin/users');
      await page.click('button:has-text("Add User")');
      
      // Create user
      await page.fill('input[name="email"]', 'audittest@example.com');
      await page.fill('input[name="name"]', 'Audit Test User');
      await page.selectOption('select[name="role"]', 'LEARNER');
      await page.click('button[type="submit"]');
      
      // Wait for action to complete
      await page.waitForTimeout(1000);
      
      // Check audit log
      await page.goto('/admin/audit');
      
      // Should see the user creation action
      await expect(page.locator('text=CREATE_USER')).toBeVisible();
      await expect(page.locator('text=audittest@example.com')).toBeVisible();
      
      // Should include timestamp, admin user, and action details
      const auditRow = page.locator('tr:has-text("CREATE_USER"):has-text("audittest@example.com")');
      await expect(auditRow.locator('td').nth(1)).toContainText(/admin@1001stories\.org/i);
      await expect(auditRow.locator('td').nth(2)).toContainText(/\d{4}-\d{2}-\d{2}/);
    });
  });
  
  test.describe('Data Exposure and Information Disclosure', () => {
    
    test('should not expose sensitive data in error messages', async ({ page }) => {
      // Try to access non-existent user
      await page.goto('/admin/users/non-existent-user-id');
      
      // Error should be generic, not expose database structure
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/user.*not.*found|resource.*not.*found/i);
      await expect(page.locator('text=/database|sql|query|table/i')).not.toBeVisible();
    });
    
    test('should paginate large datasets to prevent data dumping', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Should show pagination controls
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
      
      // Should limit results per page
      const userRows = page.locator('[data-testid="user-row"]');
      const userCount = await userRows.count();
      expect(userCount).toBeLessThanOrEqual(50); // Should not show all users at once
      
      // Should show total count
      await expect(page.locator('[data-testid="total-count"]')).toBeVisible();
    });
    
    test('should redact sensitive information in user listings', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Password fields should not be visible
      await expect(page.locator('text=/password.*hash|bcrypt|\\$2[aby]/i')).not.toBeVisible();
      
      // Session tokens should not be displayed
      await expect(page.locator('text=/session.*token|jwt/i')).not.toBeVisible();
      
      // Email addresses might be partially redacted
      const userRows = page.locator('[data-testid="user-row"]');
      const firstRow = userRows.first();
      
      // Check that at least some user info is visible but sensitive data is protected
      await expect(firstRow.locator('td').first()).toBeVisible();
    });
    
    test('should not expose internal IDs in URLs when possible', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Click on first user to view details
      const firstUserRow = page.locator('[data-testid="user-row"]').first();
      await firstUserRow.click();
      
      // URL should not expose incremental or guessable IDs
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/\/users\/\d+$/); // Avoid sequential IDs
      expect(currentUrl).not.toMatch(/\/users\/user_?\d+$/); // Avoid predictable patterns
      
      // Should use UUIDs or other non-enumerable identifiers
      expect(currentUrl).toMatch(/\/users\/[a-f0-9-]{36}$|\/users\/c[a-z0-9]{25}$/);
    });
  });
  
  test.describe('Rate Limiting and DoS Protection', () => {
    
    test('should implement rate limiting on admin API endpoints', async ({ page }) => {
      const apiEndpoint = '/api/admin/users';
      const maxRequests = 60; // Expected rate limit per minute
      
      let successCount = 0;
      let rateLimitedCount = 0;
      
      // Make rapid requests
      for (let i = 0; i < maxRequests + 10; i++) {
        const response = await page.request.get(apiEndpoint);
        
        if (response.ok()) {
          successCount++;
        } else if (response.status() === 429) {
          rateLimitedCount++;
          break; // Stop after hitting rate limit
        }
      }
      
      // Should hit rate limit before allowing too many requests
      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThanOrEqual(maxRequests);
    });
    
    test('should prevent bulk operations abuse', async ({ page }) => {
      await page.goto('/admin/stories');
      
      // Test bulk publish with realistic limits
      const checkboxes = page.locator('[data-testid="story-checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        // Select all stories
        await page.click('[data-testid="select-all-checkbox"]');
        
        // Attempt bulk publish
        await page.click('button:has-text("Publish Selected")');
        
        if (checkboxCount > 100) {
          // Should warn about or limit bulk operations
          await expect(page.locator('text=/too.*many|limit.*exceeded|batch.*size/i')).toBeVisible();
        }
      }
    });
    
    test('should implement CAPTCHA for sensitive operations', async ({ page }) => {
      // Skip if CAPTCHA not implemented
      test.skip(process.env.CAPTCHA_ENABLED !== 'true', 'CAPTCHA not enabled in staging');
      
      await page.goto('/admin/users');
      
      // Try to delete multiple users rapidly
      const deleteButtons = page.locator('[data-testid="delete-user-btn"]');
      const buttonCount = await deleteButtons.count();
      
      if (buttonCount > 0) {
        // Delete multiple users quickly
        for (let i = 0; i < Math.min(5, buttonCount); i++) {
          await page.click('[data-testid="delete-user-btn"]');
          await page.click('button:has-text("Confirm")');
          await page.waitForTimeout(100); // Minimal delay
        }
        
        // Should eventually require CAPTCHA
        await expect(page.locator('[data-testid="captcha-challenge"]')).toBeVisible();
      }
    });
  });
  
  test.describe('Session and State Management', () => {
    
    test('should handle concurrent admin sessions securely', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Both contexts login as admin
      const loginAdmin = async (page: Page) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@1001stories.org');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
      };
      
      await Promise.all([loginAdmin(page1), loginAdmin(page2)]);
      
      // Both sessions should work independently
      await page1.goto('/admin/users');
      await page2.goto('/admin/stories');
      
      await expect(page1.locator('h1')).toContainText(/users/i);
      await expect(page2.locator('h1')).toContainText(/stories/i);
      
      // Actions in one session shouldn't affect the other inappropriately
      await page1.click('button:has-text("Add User")');
      await page2.reload();
      
      // Page2 should still work normally
      await expect(page2.locator('h1')).toContainText(/stories/i);
      
      await context1.close();
      await context2.close();
    });
    
    test('should timeout inactive admin sessions', async ({ page }) => {
      // This test would require waiting for session timeout
      // In a real scenario, you'd mock the session timeout or use shorter timeout for testing
      test.skip(true, 'Session timeout testing requires longer wait times');
      
      await page.goto('/admin');
      
      // Wait for session timeout (this would be configured to be shorter in test environment)
      await page.waitForTimeout(5 * 60 * 1000); // 5 minutes
      
      // Try to access admin panel
      await page.goto('/admin');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
    
    test('should clear sensitive data on logout', async ({ page }) => {
      await page.goto('/admin');
      
      // Store sensitive data in memory/storage
      await page.evaluate(() => {
        sessionStorage.setItem('test-sensitive-data', 'admin-secrets');
        localStorage.setItem('test-admin-data', 'confidential-info');
      });
      
      // Logout
      await page.click('[data-testid="logout-btn"]');
      await expect(page).toHaveURL(/\/$/);
      
      // Check that sensitive data is cleared
      const sessionData = await page.evaluate(() => sessionStorage.getItem('test-sensitive-data'));
      const localData = await page.evaluate(() => localStorage.getItem('test-admin-data'));
      
      expect(sessionData).toBeNull();
      expect(localData).toBeNull();
    });
  });
});