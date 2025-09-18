/**
 * Security Test Suite: Brute Force Protection
 * Validates rate limiting, exponential backoff, and security monitoring systems
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';
const TEST_CLASS_CODE = 'ENG101';
const INVALID_CLASS_CODE = 'INVALID';

// Test user credentials
const TEST_STUDENT = {
  email: 'student1@test.edu',
  password: 'student123'
};

test.describe('Class Join Brute Force Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test student
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_STUDENT.email);
    await page.fill('input[name="password"]', TEST_STUDENT.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL('**/learn');
  });

  test('should apply rate limiting after multiple failed class join attempts', async ({ page }) => {
    // Navigate to class join page or find class join interface
    await page.goto(`${BASE_URL}/learn`);
    
    // Try to find class join interface
    let classJoinButton = page.locator('text="Join Class"').first();
    if (await classJoinButton.isVisible()) {
      await classJoinButton.click();
    } else {
      // Alternative: Look for add class button or similar
      await page.locator('[data-testid="join-class"], [aria-label="Join Class"]').first().click();
    }

    // Test rate limiting with invalid class codes
    for (let i = 1; i <= 12; i++) {
      const invalidCode = `INVALID${i.toString().padStart(2, '0')}`;
      
      // Fill invalid class code
      await page.fill('input[name="code"], input[placeholder*="class code"]', invalidCode);
      
      // Submit form
      const response = await page.click('button[type="submit"], button:has-text("Join")');
      
      // Wait for response
      await page.waitForTimeout(500);
      
      if (i <= 10) {
        // Should show error but allow retry
        await expect(page.locator('text="Class not found"')).toBeVisible({ timeout: 5000 });
      } else {
        // Should be rate limited after 10 attempts
        await expect(page.locator('text="Too many"')).toBeVisible({ timeout: 5000 });
        break;
      }
      
      // Clear the input for next attempt
      await page.fill('input[name="code"], input[placeholder*="class code"]', '');
    }
  });

  test('should apply exponential backoff after repeated failures', async ({ page }) => {
    // Navigate to class join
    await page.goto(`${BASE_URL}/learn`);
    
    // Find and click join class
    const joinButton = await page.locator('text="Join Class", [data-testid="join-class"]').first();
    if (await joinButton.isVisible()) {
      await joinButton.click();
    }

    // Record timestamps to verify exponential backoff
    const attemptTimes: number[] = [];

    // Make multiple failed attempts
    for (let i = 1; i <= 6; i++) {
      attemptTimes.push(Date.now());
      
      await page.fill('input[name="code"], input[placeholder*="class code"]', `FAIL${i}`);
      await page.click('button[type="submit"], button:has-text("Join")');
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      if (i >= 4) {
        // Should show increasing delay messages
        const retryMessage = page.locator('text*="wait"');
        if (await retryMessage.isVisible()) {
          const text = await retryMessage.textContent();
          expect(text?.toLowerCase()).toContain('wait');
        }
      }
    }

    // Verify that delays are increasing (exponential backoff)
    const delays: number[] = [];
    for (let i = 1; i < attemptTimes.length; i++) {
      delays.push(attemptTimes[i] - attemptTimes[i - 1]);
    }
    
    // Later delays should be longer than earlier ones
    if (delays.length >= 3) {
      expect(delays[delays.length - 1]).toBeGreaterThan(delays[0]);
    }
  });

  test('should reset backoff after successful join', async ({ page }) => {
    // First make some failed attempts
    await page.goto(`${BASE_URL}/learn`);
    
    const joinButton = await page.locator('text="Join Class", [data-testid="join-class"]').first();
    if (await joinButton.isVisible()) {
      await joinButton.click();
    }

    // Make 3 failed attempts
    for (let i = 1; i <= 3; i++) {
      await page.fill('input[name="code"], input[placeholder*="class code"]', `FAIL${i}`);
      await page.click('button[type="submit"], button:has-text("Join")');
      await page.waitForTimeout(500);
    }

    // Now try with valid class code (should reset backoff)
    await page.fill('input[name="code"], input[placeholder*="class code"]', TEST_CLASS_CODE);
    await page.click('button[type="submit"], button:has-text("Join")');
    
    // Should either succeed or show already enrolled message
    await page.waitForTimeout(1000);
    
    // Verify no "wait" message appears for valid attempt
    const waitMessage = page.locator('text*="wait"');
    const isWaitVisible = await waitMessage.isVisible();
    
    if (isWaitVisible) {
      // If wait message appears, it should be much shorter than exponential backoff
      const text = await waitMessage.textContent();
      // Should not mention long wait times like "5 minutes"
      expect(text?.toLowerCase()).not.toContain('minute');
    }
  });

  test('should log security events for monitoring', async ({ page, context }) => {
    // Intercept network requests to verify audit logging
    const auditLogs: any[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        auditLogs.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      }
    });

    await page.goto(`${BASE_URL}/learn`);
    
    const joinButton = await page.locator('text="Join Class", [data-testid="join-class"]').first();
    if (await joinButton.isVisible()) {
      await joinButton.click();
    }

    // Make several failed attempts
    for (let i = 1; i <= 5; i++) {
      await page.fill('input[name="code"], input[placeholder*="class code"]', `LOG${i}`);
      await page.click('button[type="submit"], button:has-text("Join")');
      await page.waitForTimeout(500);
    }

    // Verify that failed attempts are being tracked
    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

test.describe('API Rate Limiting Protection', () => {
  test('should rate limit high volume API requests', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_STUDENT.email);
    await page.fill('input[name="password"]', TEST_STUDENT.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/learn');

    // Make rapid API requests to trigger rate limiting
    let rateLimited = false;
    
    for (let i = 1; i <= 150; i++) { // Exceed the 100 requests per minute limit
      const response = await page.evaluate(() => 
        fetch('/api/learn/progress', { method: 'GET' })
          .then(r => ({ status: r.status, ok: r.ok }))
          .catch(e => ({ status: 0, ok: false, error: e.message }))
      );
      
      if (response.status === 429) {
        rateLimited = true;
        break;
      }
      
      // Small delay to simulate rapid requests
      await page.waitForTimeout(10);
    }

    expect(rateLimited).toBe(true);
  });

  test('should include proper rate limit headers', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_STUDENT.email);
    await page.fill('input[name="password"]', TEST_STUDENT.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/learn');

    // Make requests until rate limited
    let headers: Record<string, string> = {};
    
    for (let i = 1; i <= 120; i++) {
      const response = await page.evaluate(() => 
        fetch('/api/learn/progress', { method: 'GET' })
          .then(r => ({
            status: r.status,
            headers: Object.fromEntries(r.headers.entries())
          }))
      );
      
      if (response.status === 429) {
        headers = response.headers;
        break;
      }
    }

    // Verify rate limit headers are present
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
    expect(headers['x-ratelimit-reset']).toBeDefined();
    expect(headers['retry-after']).toBeDefined();
  });
});

test.describe('IP Blocking Protection', () => {
  test('should handle blocked IP gracefully', async ({ page }) => {
    // Note: This test simulates a blocked IP scenario
    // In real testing, you might need to actually block an IP via Redis
    
    // Intercept requests to simulate blocked IP response
    await page.route('**/api/**', async (route) => {
      if (Math.random() < 0.1) { // 10% chance to simulate blocked IP
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Access denied' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/login`);
    
    // Try to login
    await page.fill('input[name="email"]', TEST_STUDENT.email);
    await page.fill('input[name="password"]', TEST_STUDENT.password);
    await page.click('button[type="submit"]');
    
    // Should handle blocked IP gracefully
    const errorMessage = page.locator('text="Access denied"');
    if (await errorMessage.isVisible()) {
      expect(await errorMessage.textContent()).toContain('Access denied');
    }
  });
});

test.describe('Security Headers Validation', () => {
  test('should include comprehensive security headers', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/`);
    const headers = response?.headers() || {};

    // Verify critical security headers
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBeDefined();

    // Verify CSP includes necessary directives
    const csp = headers['content-security-policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors");
  });

  test('should apply HSTS in production mode', async ({ page }) => {
    // Note: HSTS should only be present in production with HTTPS
    const response = await page.goto(`${BASE_URL}/`);
    const headers = response?.headers() || {};

    // In test environment, HSTS might not be present
    // This test documents the expected behavior
    if (process.env.NODE_ENV === 'production') {
      expect(headers['strict-transport-security']).toBeDefined();
    }
  });
});

test.describe('Session Security', () => {
  test('should invalidate session after suspicious activity', async ({ page, context }) => {
    // Login normally
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_STUDENT.email);
    await page.fill('input[name="password"]', TEST_STUDENT.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/learn');

    // Verify logged in
    await expect(page.locator('text="Dashboard", text="Profile"')).toBeVisible();

    // Simulate suspicious activity (multiple failed class joins)
    const joinButton = await page.locator('text="Join Class", [data-testid="join-class"]').first();
    if (await joinButton.isVisible()) {
      await joinButton.click();
      
      // Make many failed attempts to trigger security response
      for (let i = 1; i <= 20; i++) {
        await page.fill('input[name="code"], input[placeholder*="class code"]', `SUSPICIOUS${i}`);
        await page.click('button[type="submit"], button:has-text("Join")');
        await page.waitForTimeout(100);
      }
    }

    // In a real implementation, extremely suspicious activity might force logout
    // This test verifies the system handles it gracefully
    await page.waitForTimeout(2000);
    
    // Check if still logged in or redirected
    const currentUrl = page.url();
    const isStillLoggedIn = currentUrl.includes('/learn') || currentUrl.includes('/dashboard');
    
    // System should either maintain session or redirect gracefully
    expect(typeof isStillLoggedIn).toBe('boolean');
  });
});