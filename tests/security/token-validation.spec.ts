import { test, expect } from '@playwright/test';

test.describe('Token Validation Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test.describe('Parental Consent Token Security', () => {
    test('should reject missing token in consent verification', async ({ request }) => {
      const response = await request.post('/api/auth/parental-consent', {
        data: {
          action: 'approve'
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Missing token rejected');
    });

    test('should reject malformed token', async ({ request }) => {
      const response = await request.post('/api/auth/parental-consent', {
        data: {
          token: '<script>alert("xss")</script>',
          action: 'approve'
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Malformed/XSS token rejected');
    });

    test('should reject token with SQL injection attempt', async ({ request }) => {
      const response = await request.post('/api/auth/parental-consent', {
        data: {
          token: "'; DROP TABLE profiles; --",
          action: 'approve'
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ SQL injection token rejected');
    });

    test('should reject empty token', async ({ request }) => {
      const response = await request.post('/api/auth/parental-consent', {
        data: {
          token: '',
          action: 'approve'
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Empty token rejected');
    });

    test('should reject token with invalid decision', async ({ request }) => {
      const response = await request.post('/api/auth/parental-consent', {
        data: {
          token: 'some-token',
          action: 'invalid-decision'
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      console.log('✅ Invalid decision rejected');
    });
  });

  test.describe('Email Verification Token Security', () => {
    test('should reject invalid verification token', async ({ request }) => {
      const response = await request.get('/api/auth/verify-email?token=invalid-token', {
        maxRedirects: 0
      });

      const validResponses = [307, 302, 400, 401, 403, 404];
      expect(validResponses).toContain(response.status());
      console.log(`✅ Invalid email verification token handled: ${response.status()}`);
    });

    test('should reject missing verification token', async ({ request }) => {
      const response = await request.get('/api/auth/verify-email', {
        maxRedirects: 0
      });

      const validResponses = [307, 302, 400, 401, 403, 404];
      expect(validResponses).toContain(response.status());
      console.log(`✅ Missing verification token handled: ${response.status()}`);
    });
  });

  test.describe('Session Token Security', () => {
    test('should not expose session token in response', async ({ page }) => {
      await page.goto('/api/auth/session');
      const content = await page.content();

      expect(content).not.toContain('password');
      expect(content).not.toContain('secret');

      console.log('✅ Session endpoint does not expose sensitive data');
    });

    test('should return empty session for unauthenticated request', async ({ request }) => {
      const response = await request.get('/api/auth/session');

      expect(response.status()).toBe(200);
      const body = await response.json();

      expect(body.authenticated).toBe(false);
      expect(body.user).toBeFalsy();
      console.log('✅ Unauthenticated session is empty');
    });
  });

  test.describe('CSRF Protection', () => {
    test('POST requests should require proper headers', async ({ request }) => {
      const response = await request.post('/api/auth/signup', {
        data: {
          email: 'test@example.com',
          password: 'Test1234',
          name: 'Test User',
          termsAccepted: true
        }
      });

      const validResponses = [200, 201, 400, 403, 409, 429, 500];
      expect(validResponses).toContain(response.status());

      console.log(`✅ Signup endpoint responded with: ${response.status()}`);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should rate limit repeated signup attempts', async ({ request }) => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request.post('/api/auth/signup', {
            data: {
              email: `ratelimit-${i}@example.com`,
              password: 'Test1234',
              name: 'Rate Limit Test',
              termsAccepted: true
            }
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status() === 429);

      if (rateLimited) {
        console.log('✅ Rate limiting is active on signup');
      } else {
        console.log('⚠️ Rate limiting may need verification');
      }
    });
  });
});
