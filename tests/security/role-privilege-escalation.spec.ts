/**
 * Role Privilege Escalation Security Tests
 * Tests for unauthorized role changes and privilege escalation vulnerabilities
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Role Privilege Escalation Security', () => {
  
  test.describe('Horizontal Privilege Escalation', () => {
    
    test('should prevent LEARNER from accessing TEACHER resources', async ({ page }) => {
      // Login as learner
      await page.goto('/login');
      await page.fill('input[type="email"]', 'learner@1001stories.org');
      await page.click('button[type="submit"]');
      
      // Direct URL access attempts
      const teacherResources = [
        '/dashboard/teacher',
        '/dashboard/teacher/classes',
        '/dashboard/teacher/students',
        '/api/teacher/classes',
        '/api/teacher/assignments'
      ];
      
      for (const resource of teacherResources) {
        await page.goto(resource);
        
        // Should be denied access
        if (resource.startsWith('/api/')) {
          // API endpoints should return 403
          const response = await page.request.get(resource);
          expect(response.status()).toBe(403);
        } else {
          // UI routes should redirect
          await expect(page).not.toHaveURL(resource);
          await expect(page).toHaveURL(/\/(dashboard\/learner|403|login)/);
        }
      }
    });
    
    test('should prevent TEACHER from accessing INSTITUTION resources', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'teacher@1001stories.org');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button[type="submit"]');
      
      const institutionResources = [
        '/dashboard/institution',
        '/dashboard/institution/projects',
        '/dashboard/institution/volunteers',
        '/api/institution/projects',
        '/api/institution/reports'
      ];
      
      for (const resource of institutionResources) {
        await page.goto(resource);
        
        if (resource.startsWith('/api/')) {
          const response = await page.request.get(resource);
          expect(response.status()).toBe(403);
        } else {
          await expect(page).not.toHaveURL(resource);
          await expect(page).toHaveURL(/\/(dashboard\/teacher|403)/);
        }
      }
    });
  });
  
  test.describe('Vertical Privilege Escalation', () => {
    
    test('should prevent non-admin from accessing admin functions', async ({ page }) => {
      const nonAdminRoles = [
        { email: 'learner@1001stories.org', password: null },
        { email: 'teacher@1001stories.org', password: 'teacher123' },
        { email: 'volunteer@1001stories.org', password: 'volunteer123' },
        { email: 'institution@1001stories.org', password: 'institution123' }
      ];
      
      for (const user of nonAdminRoles) {
        await page.goto('/login');
        await page.fill('input[type="email"]', user.email);
        
        if (user.password) {
          await page.fill('input[type="password"]', user.password);
        }
        
        await page.click('button[type="submit"]');
        
        // Test admin panel access
        await page.goto('/admin');
        await expect(page).not.toHaveURL('/admin');
        
        // Test admin API endpoints
        const adminApis = [
          '/api/admin/users',
          '/api/admin/stories/publish-all',
          '/api/admin/bulk-import',
          '/api/admin/settings'
        ];
        
        for (const api of adminApis) {
          const response = await page.request.get(api);
          expect(response.status()).toBe(403);
        }
        
        // Logout for next iteration
        await page.goto('/api/auth/signout');
      }
    });
    
    test('should prevent role self-elevation via API manipulation', async ({ page, context }) => {
      // Login as learner
      await page.goto('/login');
      await page.fill('input[type="email"]', 'learner@1001stories.org');
      await page.click('button[type="submit"]');
      
      // Get current user ID
      const sessionResponse = await page.request.get('/api/auth/session');
      const session = await sessionResponse.json();
      const currentUserId = session?.user?.id;
      
      if (currentUserId) {
        // Attempt to elevate own role
        const roleUpdateResponse = await page.request.put(`/api/admin/users/${currentUserId}`, {
          data: { role: 'ADMIN' }
        });
        
        // Should be rejected with 403
        expect(roleUpdateResponse.status()).toBe(403);
        
        // Verify role hasn't changed
        const updatedSession = await page.request.get('/api/auth/session');
        const updatedSessionData = await updatedSession.json();
        expect(updatedSessionData?.user?.role).not.toBe('ADMIN');
        expect(updatedSessionData?.user?.role).toBe('LEARNER');
      }
    });
    
    test('should prevent admin role assignment by non-admins', async ({ page }) => {
      // Login as teacher (has some elevated privileges but not admin)
      await page.goto('/login');
      await page.fill('input[type="email"]', 'teacher@1001stories.org');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button[type="submit"]');
      
      // Attempt to create admin user
      const createAdminResponse = await page.request.post('/api/admin/users', {
        data: {
          email: 'newadmin@test.com',
          name: 'New Admin',
          role: 'ADMIN'
        }
      });
      
      expect(createAdminResponse.status()).toBe(403);
      
      // Attempt to modify existing user to admin
      const modifyUserResponse = await page.request.put('/api/admin/users/test-user-id', {
        data: { role: 'ADMIN' }
      });
      
      expect(modifyUserResponse.status()).toBe(403);
    });
  });
  
  test.describe('API Authorization Bypass Attempts', () => {
    
    test('should validate user context in API endpoints', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'learner@1001stories.org');
      await page.click('button[type="submit"]');
      
      // Attempt to access another user's data
      const otherUserApis = [
        '/api/user/profile/other-user-id',
        '/api/library/my-library?userId=other-user-id',
        '/api/user/orders?userId=admin-user-id'
      ];
      
      for (const api of otherUserApis) {
        const response = await page.request.get(api);
        expect([403, 404]).toContain(response.status());
      }
    });
    
    test('should prevent parameter pollution in role checks', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'learner@1001stories.org');
      await page.click('button[type="submit"]');
      
      // Test parameter pollution attempts
      const pollutionAttempts = [
        '/api/admin/users?role=LEARNER&role=ADMIN',
        '/api/admin/stories?isAdmin=false&isAdmin=true',
        '/api/library/stories?userId=learner-id&userId=admin-id'
      ];
      
      for (const attempt of pollutionAttempts) {
        const response = await page.request.get(attempt);
        // Should not grant elevated access
        expect([403, 400]).toContain(response.status());
      }
    });
    
    test('should handle malformed authorization headers', async ({ page, context }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'learner@1001stories.org');
      await page.click('button[type="submit"]');
      
      // Get valid session cookie
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session'));
      
      // Test malformed headers
      const malformedRequests = [
        {
          url: '/api/admin/users',
          headers: { 'Authorization': 'Bearer ADMIN_TOKEN' }
        },
        {
          url: '/api/admin/users',
          headers: { 'X-User-Role': 'ADMIN' }
        },
        {
          url: '/api/admin/users',
          headers: { 'Cookie': sessionCookie?.value + '; role=ADMIN' }
        }
      ];
      
      for (const req of malformedRequests) {
        const response = await page.request.get(req.url, {
          headers: req.headers
        });
        
        expect(response.status()).toBe(403);
      }
    });
  });
  
  test.describe('Session and Token Manipulation', () => {
    
    test('should prevent session fixation attacks', async ({ browser }) => {
      const attackerContext = await browser.newContext();
      const victimContext = await browser.newContext();
      
      const attackerPage = await attackerContext.newPage();
      const victimPage = await victimContext.newPage();
      
      // Attacker gets initial session
      await attackerPage.goto('/login');
      const attackerCookies = await attackerContext.cookies();
      const initialSession = attackerCookies.find(c => c.name.includes('session'));
      
      // Victim logs in with attacker's session cookie
      if (initialSession) {
        await victimContext.addCookies([initialSession]);
      }
      
      await victimPage.goto('/login');
      await victimPage.fill('input[type="email"]', 'admin@1001stories.org');
      await victimPage.fill('input[type="password"]', 'admin123');
      await victimPage.click('button[type="submit"]');
      
      // Check if session changed (should generate new session ID)
      const victimCookies = await victimContext.cookies();
      const newSession = victimCookies.find(c => c.name.includes('session'));
      
      if (initialSession && newSession) {
        expect(newSession.value).not.toBe(initialSession.value);
      }
      
      // Attacker shouldn't be able to access admin panel
      await attackerPage.goto('/admin');
      await expect(attackerPage).not.toHaveURL('/admin');
      
      await attackerContext.close();
      await victimContext.close();
    });
    
    test('should prevent token replay attacks', async ({ page, context }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@1001stories.org');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Perform admin action and capture request
      const requestPromise = page.waitForRequest('/api/admin/users');
      await page.goto('/admin/users');
      await page.click('button:has-text("Add User")');
      await page.fill('input[name="email"]', 'newuser@test.com');
      await page.fill('input[name="name"]', 'New User');
      await page.selectOption('select[name="role"]', 'LEARNER');
      await page.click('button[type="submit"]');
      
      const originalRequest = await requestPromise;
      
      // Try to replay the exact same request
      const replayResponse = await page.request.fetch(originalRequest.url(), {
        method: originalRequest.method(),
        headers: await originalRequest.allHeaders(),
        data: originalRequest.postData()
      });
      
      // Second identical request should be rejected or handled safely
      expect([400, 409, 403]).toContain(replayResponse.status());
    });
    
    test('should detect and prevent concurrent role changes', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Both contexts login as admin
      const adminLogin = async (page: Page) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@1001stories.org');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
      };
      
      await Promise.all([adminLogin(page1), adminLogin(page2)]);
      
      // Both try to modify the same user simultaneously
      const userId = 'test-user-id';
      const [response1, response2] = await Promise.all([
        page1.request.put(`/api/admin/users/${userId}`, {
          data: { role: 'TEACHER' }
        }),
        page2.request.put(`/api/admin/users/${userId}`, {
          data: { role: 'VOLUNTEER' }
        })
      ]);
      
      // One should succeed, one should detect conflict
      const statuses = [response1.status(), response2.status()];
      expect(statuses).toContain(200); // One succeeds
      expect(statuses).toContain(409); // One detects conflict
      
      await context1.close();
      await context2.close();
    });
  });
  
  test.describe('Mass Assignment Vulnerabilities', () => {
    
    test('should prevent mass assignment of protected fields', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@1001stories.org');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Attempt to create user with mass assignment
      const massAssignmentData = {
        email: 'newuser@test.com',
        name: 'New User',
        role: 'LEARNER',
        // Protected fields that should be filtered out
        id: 'custom-admin-id',
        createdAt: '2020-01-01T00:00:00Z',
        isAdmin: true,
        superUser: true,
        permissions: ['ADMIN', 'SUPER_ADMIN'],
        emailVerified: new Date(),
        // SQL injection attempts
        'role; DROP TABLE users; --': 'ADMIN'
      };
      
      const response = await page.request.post('/api/admin/users', {
        data: massAssignmentData
      });
      
      if (response.ok()) {
        const createdUser = await response.json();
        
        // Verify protected fields were not set
        expect(createdUser.user?.id).not.toBe('custom-admin-id');
        expect(createdUser.user?.isAdmin).not.toBe(true);
        expect(createdUser.user?.role).toBe('LEARNER'); // Should only have allowed role
        
        // Verify no SQL injection occurred
        expect(createdUser.user?.role).not.toContain('DROP TABLE');
      }
    });
    
    test('should validate role field constraints', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@1001stories.org');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      const invalidRoles = [
        'SUPER_ADMIN',
        'ROOT',
        'SYSTEM_ADMIN',
        '',
        null,
        undefined,
        123,
        ['ADMIN', 'USER'],
        { role: 'ADMIN' }
      ];
      
      for (const invalidRole of invalidRoles) {
        const response = await page.request.post('/api/admin/users', {
          data: {
            email: 'test@example.com',
            name: 'Test User',
            role: invalidRole
          }
        });
        
        // Should reject invalid roles
        expect([400, 422]).toContain(response.status());
      }
    });
  });
});