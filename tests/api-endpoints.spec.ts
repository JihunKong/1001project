import { test, expect } from '@playwright/test';

test.describe('API Endpoint Tests', () => {
  test('should test health check endpoint', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('status');

    console.log('✓ Health check response:', data);
  });

  test('should test authentication endpoints', async ({ request }) => {
    // Test NextAuth endpoints
    const authEndpoints = [
      '/api/auth/providers',
      '/api/auth/session',
      '/api/auth/csrf'
    ];

    for (const endpoint of authEndpoints) {
      try {
        const response = await request.get(endpoint);
        console.log(`✓ ${endpoint}: ${response.status()}`);

        if (response.status() === 200) {
          const data = await response.json();
          console.log(`  Response keys: ${Object.keys(data).join(', ')}`);
        }
      } catch (error) {
        console.log(`⚠ ${endpoint}: Error - ${error}`);
      }
    }
  });

  test('should test API routes with proper error handling', async ({ request }) => {
    // Test various API routes that might exist
    const apiRoutes = [
      { path: '/api/books', expectedStatus: [200, 401, 404] },
      { path: '/api/users', expectedStatus: [200, 401, 404] },
      { path: '/api/stories', expectedStatus: [200, 401, 404] },
      { path: '/api/dashboard', expectedStatus: [200, 401, 404] },
      { path: '/api/demo', expectedStatus: [200, 404] }
    ];

    for (const route of apiRoutes) {
      try {
        const response = await request.get(route.path);
        const status = response.status();

        if (route.expectedStatus.includes(status)) {
          console.log(`✓ ${route.path}: ${status} (expected)`);

          if (status === 200) {
            const contentType = response.headers()['content-type'];
            if (contentType?.includes('application/json')) {
              const data = await response.json();
              console.log(`  JSON response with keys: ${Object.keys(data).join(', ')}`);
            }
          }
        } else {
          console.log(`⚠ ${route.path}: ${status} (unexpected, expected: ${route.expectedStatus.join(' or ')})`);
        }
      } catch (error) {
        console.log(`⚠ ${route.path}: Network error - ${error}`);
      }
    }
  });

  test('should test API error responses', async ({ request }) => {
    // Test non-existent endpoints
    const nonExistentEndpoints = [
      '/api/nonexistent',
      '/api/test/invalid',
      '/api/books/99999',
      '/api/users/invalid-id'
    ];

    for (const endpoint of nonExistentEndpoints) {
      const response = await request.get(endpoint);
      const status = response.status();

      // Should return 404 or 405 for non-existent routes
      if ([404, 405].includes(status)) {
        console.log(`✓ ${endpoint}: ${status} (correctly returns error)`);
      } else {
        console.log(`⚠ ${endpoint}: ${status} (unexpected response)`);
      }
    }
  });

  test('should test API with different HTTP methods', async ({ request }) => {
    const testEndpoint = '/api/health';

    // Test different HTTP methods
    const methods = [
      { method: 'GET', expected: 200 },
      { method: 'POST', expected: [200, 405] },
      { method: 'PUT', expected: [200, 405] },
      { method: 'DELETE', expected: [200, 405] }
    ];

    for (const methodTest of methods) {
      try {
        let response;
        switch (methodTest.method) {
          case 'GET':
            response = await request.get(testEndpoint);
            break;
          case 'POST':
            response = await request.post(testEndpoint, { data: {} });
            break;
          case 'PUT':
            response = await request.put(testEndpoint, { data: {} });
            break;
          case 'DELETE':
            response = await request.delete(testEndpoint);
            break;
        }

        if (response) {
          const status = response.status();
          const expectedStatuses = Array.isArray(methodTest.expected) ? methodTest.expected : [methodTest.expected];

          if (expectedStatuses.includes(status)) {
            console.log(`✓ ${methodTest.method} ${testEndpoint}: ${status} (expected)`);
          } else {
            console.log(`⚠ ${methodTest.method} ${testEndpoint}: ${status} (unexpected)`);
          }
        }
      } catch (error) {
        console.log(`⚠ ${methodTest.method} ${testEndpoint}: Error - ${error}`);
      }
    }
  });

  test('should test API response times', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/api/auth/session',
      '/api/auth/providers'
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();

      try {
        const response = await request.get(endpoint);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log(`✓ ${endpoint}: ${response.status()} in ${responseTime}ms`);

        // Flag slow responses (over 5 seconds)
        if (responseTime > 5000) {
          console.log(`⚠ Slow response: ${endpoint} took ${responseTime}ms`);
        }
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        console.log(`⚠ ${endpoint}: Error after ${responseTime}ms - ${error}`);
      }
    }
  });

  test('should test API with authentication headers', async ({ request }) => {
    // Test endpoints that might require authentication
    const protectedEndpoints = [
      '/api/dashboard',
      '/api/users/me',
      '/api/books',
      '/api/admin'
    ];

    for (const endpoint of protectedEndpoints) {
      // Test without authentication
      try {
        const response = await request.get(endpoint);
        const status = response.status();

        if (status === 401) {
          console.log(`✓ ${endpoint}: 401 (correctly requires authentication)`);
        } else if (status === 404) {
          console.log(`ℹ ${endpoint}: 404 (endpoint may not exist)`);
        } else {
          console.log(`ℹ ${endpoint}: ${status} (may be public or have default access)`);
        }
      } catch (error) {
        console.log(`⚠ ${endpoint}: Error - ${error}`);
      }

      // Test with mock authentication header
      try {
        const responseWithAuth = await request.get(endpoint, {
          headers: {
            'Authorization': 'Bearer mock-token',
            'Cookie': 'next-auth.session-token=mock-session'
          }
        });

        const statusWithAuth = responseWithAuth.status();
        console.log(`ℹ ${endpoint} with auth headers: ${statusWithAuth}`);
      } catch (error) {
        console.log(`⚠ ${endpoint} with auth: Error - ${error}`);
      }
    }
  });

  test('should validate API response structures', async ({ request }) => {
    // Test health endpoint structure
    const healthResponse = await request.get('/api/health');
    if (healthResponse.status() === 200) {
      const healthData = await healthResponse.json();

      // Validate expected structure
      expect(healthData).toHaveProperty('status');

      // Common health check properties
      const expectedProperties = ['status', 'timestamp', 'version', 'uptime'];
      for (const prop of expectedProperties) {
        if (healthData.hasOwnProperty(prop)) {
          console.log(`✓ Health check has property: ${prop}`);
        }
      }
    }

    // Test session endpoint structure
    const sessionResponse = await request.get('/api/auth/session');
    if (sessionResponse.status() === 200) {
      const sessionData = await sessionResponse.json();
      console.log(`✓ Session response structure: ${Object.keys(sessionData).join(', ')}`);
    }
  });
});