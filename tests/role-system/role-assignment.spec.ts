import { test, expect } from '@playwright/test';

/**
 * Role Assignment Tests for Role System V2
 * 
 * Tests the new role assignment system:
 * - Default CUSTOMER role for new users
 * - Admin role assignment capabilities
 * - Role validation and constraints
 * - Role change notifications
 * - Audit trail for role changes
 */

test.describe('Role Assignment System', () => {

  test.describe('Default Role Assignment', () => {
    test('should assign CUSTOMER role to new signups', async ({ page }) => {
      const newUserEmail = `newuser-${Date.now()}@test.1001stories.org`;
      
      // Complete signup flow
      await page.goto('/signup');
      await page.fill('input[type="email"]', newUserEmail);
      await page.click('button[type="submit"]');
      
      // Simulate email verification and login
      await page.goto(`/api/auth/demo-login?email=${newUserEmail}&role=CUSTOMER&newUser=true`);
      
      // Check user profile via API
      const profileResponse = await page.request.get('/api/user/profile');
      const profile = await profileResponse.json();
      
      expect(profile.role).toBe('CUSTOMER');
      expect(profile.email).toBe(newUserEmail);
      
      // Verify in dashboard
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="user-role-indicator"]')).toContainText('Customer');
    });

    test('should not show role selection during signup', async ({ page }) => {
      await page.goto('/signup');
      
      // Verify no role selection elements exist
      await expect(page.locator('[data-testid="role-selector"]')).not.toBeVisible();
      await expect(page.locator('select[name="role"]')).not.toBeVisible();
      await expect(page.locator('input[name="role"]')).not.toBeVisible();
      await expect(page.locator('text=Choose your role')).not.toBeVisible();
      await expect(page.locator('text=I am a')).not.toBeVisible();
      
      // Should only have email field and submit button
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should handle role assignment for users created via API', async ({ page }) => {
      // Create user via API without explicit role
      const apiResponse = await page.request.post('/api/admin/create-user', {
        data: {
          email: 'api-user@test.1001stories.org',
          name: 'API Created User'
          // No role specified
        }
      });
      
      expect(apiResponse.ok()).toBeTruthy();
      const userData = await apiResponse.json();
      
      // Should default to CUSTOMER
      expect(userData.role).toBe('CUSTOMER');
      
      // Verify login works correctly
      await page.goto(`/api/auth/demo-login?email=api-user@test.1001stories.org&role=CUSTOMER`);
      await page.goto('/dashboard');
      
      await expect(page.locator('h1')).toContainText('Dashboard');
    });

    test('should preserve explicit role assignments', async ({ page }) => {
      // Create user with explicit ADMIN role
      const adminResponse = await page.request.post('/api/admin/create-user', {
        data: {
          email: 'explicit-admin@test.1001stories.org',
          name: 'Explicit Admin',
          role: 'ADMIN'
        }
      });
      
      expect(adminResponse.ok()).toBeTruthy();
      const adminData = await adminResponse.json();
      expect(adminData.role).toBe('ADMIN');
      
      // Verify admin can access admin dashboard
      await page.goto(`/api/auth/demo-login?email=explicit-admin@test.1001stories.org&role=ADMIN`);
      await page.goto('/admin');
      
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    });
  });

  test.describe('Admin Role Management', () => {
    test.use({ storageState: 'test-results/auth/admin-auth.json' });

    test('should allow admin to assign roles to users', async ({ page }) => {
      // Create test user
      await page.request.post('/api/test/create-user', {
        data: {
          email: 'role-assignment-test@test.1001stories.org',
          role: 'CUSTOMER'
        }
      });

      await page.goto('/admin/users');
      
      // Find the user and click edit
      const userRow = page.locator(`tr:has-text("role-assignment-test@test.1001stories.org")`);
      await userRow.locator('[data-testid="edit-role-button"]').click();
      
      // Should open role assignment modal
      await expect(page.locator('[data-testid="role-assignment-modal"]')).toBeVisible();
      await expect(page.locator('h2:has-text("Assign Role")')).toBeVisible();
      
      // Should show available roles
      await expect(page.locator('option[value="CUSTOMER"]')).toBeVisible();
      await expect(page.locator('option[value="ADMIN"]')).toBeVisible();
      
      // Select ADMIN role
      await page.selectOption('[data-testid="role-select"]', 'ADMIN');
      await page.fill('[data-testid="assignment-reason"]', 'Promoting user to admin for testing');
      await page.click('button:has-text("Assign Role")');
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=Role assigned successfully')).toBeVisible();
      
      // Verify role change in user list
      await expect(userRow.locator('[data-testid="role-badge-ADMIN"]')).toBeVisible();
    });

    test('should validate role assignment permissions', async ({ page }) => {
      // Try to assign role as non-admin (should be prevented at API level)
      const response = await page.request.post('/api/admin/assign-role', {
        data: {
          userEmail: 'test@example.com',
          newRole: 'ADMIN',
          reason: 'Unauthorized attempt'
        },
        headers: {
          // Use customer auth token instead of admin
          'Authorization': 'Bearer customer-token'
        }
      });
      
      expect(response.status()).toBe(403);
      const error = await response.json();
      expect(error.message).toContain('Insufficient permissions');
    });

    test('should require reason for sensitive role changes', async ({ page }) => {
      await page.goto('/admin/users');
      
      const userRow = page.locator(`tr:has-text("customer@test.1001stories.org")`);
      await userRow.locator('[data-testid="edit-role-button"]').click();
      
      // Try to assign admin role without reason
      await page.selectOption('[data-testid="role-select"]', 'ADMIN');
      await page.click('button:has-text("Assign Role")');
      
      // Should show validation error
      await expect(page.locator('[data-testid="reason-error"]')).toBeVisible();
      await expect(page.locator('text=Reason is required for role changes')).toBeVisible();
      
      // Button should remain disabled
      await expect(page.locator('button:has-text("Assign Role")')).toBeDisabled();
    });

    test('should show role assignment confirmation for critical changes', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Find an admin user and try to change to customer
      const adminRow = page.locator(`tr:has-text("admin@test.1001stories.org")`);
      await adminRow.locator('[data-testid="edit-role-button"]').click();
      
      await page.selectOption('[data-testid="role-select"]', 'CUSTOMER');
      await page.fill('[data-testid="assignment-reason"]', 'Testing role demotion');
      await page.click('button:has-text("Assign Role")');
      
      // Should show critical change confirmation
      await expect(page.locator('[data-testid="critical-change-modal"]')).toBeVisible();
      await expect(page.locator('text=Critical Role Change')).toBeVisible();
      await expect(page.locator('text=This will remove admin privileges')).toBeVisible();
      await expect(page.locator('text=This action cannot be undone easily')).toBeVisible();
      
      // Should require additional confirmation
      await expect(page.locator('input[type="checkbox"][data-testid="confirm-critical"]')).toBeVisible();
      await expect(page.locator('button:has-text("Confirm Change")')).toBeDisabled();
      
      // Enable confirmation
      await page.check('input[type="checkbox"][data-testid="confirm-critical"]');
      await expect(page.locator('button:has-text("Confirm Change")')).toBeEnabled();
    });

    test('should prevent self-role modification without safeguards', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Try to edit current admin user's role
      const currentAdminRow = page.locator(`tr:has-text("admin@test.1001stories.org")`);
      await currentAdminRow.locator('[data-testid="edit-role-button"]').click();
      
      // Should show self-modification warning
      await expect(page.locator('[data-testid="self-modification-warning"]')).toBeVisible();
      await expect(page.locator('text=You are modifying your own role')).toBeVisible();
      await expect(page.locator('text=This may affect your access to the admin panel')).toBeVisible();
      
      // Should require additional confirmation steps
      await page.selectOption('[data-testid="role-select"]', 'CUSTOMER');
      await page.fill('[data-testid="assignment-reason"]', 'Self-demotion test');
      
      // Should show multi-step confirmation
      await expect(page.locator('[data-testid="self-demotion-steps"]')).toBeVisible();
      await expect(page.locator('text=Step 1: Confirm you understand the consequences')).toBeVisible();
      await expect(page.locator('text=Step 2: Provide alternative admin contact')).toBeVisible();
      await expect(page.locator('text=Step 3: Final confirmation')).toBeVisible();
    });
  });

  test.describe('Role Validation and Constraints', () => {
    test('should enforce valid role values', async ({ page }) => {
      // Try to create user with invalid role
      const response = await page.request.post('/api/admin/create-user', {
        data: {
          email: 'invalid-role@test.1001stories.org',
          role: 'INVALID_ROLE'
        }
      });
      
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.message).toContain('Invalid role');
      expect(error.validRoles).toContain('CUSTOMER');
      expect(error.validRoles).toContain('ADMIN');
    });

    test('should prevent null or empty role assignments', async ({ page }) => {
      const nullRoleResponse = await page.request.post('/api/admin/assign-role', {
        data: {
          userEmail: 'test@example.com',
          newRole: null
        }
      });
      
      expect(nullRoleResponse.status()).toBe(400);
      
      const emptyRoleResponse = await page.request.post('/api/admin/assign-role', {
        data: {
          userEmail: 'test@example.com',
          newRole: ''
        }
      });
      
      expect(emptyRoleResponse.status()).toBe(400);
    });

    test('should maintain at least one admin user', async ({ page }) => {
      // Get current admin count
      const adminCountResponse = await page.request.get('/api/admin/admin-count');
      const { count: initialAdminCount } = await adminCountResponse.json();
      
      if (initialAdminCount <= 1) {
        // Create additional admin first
        await page.request.post('/api/admin/create-user', {
          data: {
            email: 'backup-admin@test.1001stories.org',
            role: 'ADMIN'
          }
        });
      }
      
      // Now try to demote the last admin (should be prevented)
      const adminUsers = await page.request.get('/api/admin/users?role=ADMIN');
      const admins = await adminUsers.json();
      
      if (admins.length === 1) {
        const demoteResponse = await page.request.post('/api/admin/assign-role', {
          data: {
            userEmail: admins[0].email,
            newRole: 'CUSTOMER',
            reason: 'Testing last admin prevention'
          }
        });
        
        expect(demoteResponse.status()).toBe(409); // Conflict
        const error = await demoteResponse.json();
        expect(error.message).toContain('Cannot remove the last admin user');
      }
    });

    test('should handle role constraint violations gracefully', async ({ page }) => {
      // Test database constraint scenarios
      
      // Try to directly manipulate database with invalid role
      const dbResponse = await page.request.post('/api/test/direct-db-update', {
        data: {
          table: 'User',
          where: { email: 'test@example.com' },
          update: { role: 'NONEXISTENT' }
        }
      });
      
      // Should be rejected by database constraints
      expect(dbResponse.status()).toBe(500);
      const error = await dbResponse.json();
      expect(error.message).toContain('constraint');
    });
  });

  test.describe('Role Change Notifications', () => {
    test('should notify user of role changes', async ({ page }) => {
      // Create test user
      const userEmail = 'notification-test@test.1001stories.org';
      await page.request.post('/api/test/create-user', {
        data: { email: userEmail, role: 'CUSTOMER' }
      });
      
      // Admin changes user role
      await page.request.post('/api/admin/assign-role', {
        data: {
          userEmail: userEmail,
          newRole: 'ADMIN',
          reason: 'Testing notification system',
          notifyUser: true
        }
      });
      
      // Check notification was sent
      const notifications = await page.request.get(`/api/admin/notifications?userEmail=${userEmail}`);
      const notificationData = await notifications.json();
      
      expect(notificationData.length).toBeGreaterThan(0);
      const roleChangeNotification = notificationData.find((n: any) => n.type === 'role_change');
      
      expect(roleChangeNotification).toBeDefined();
      expect(roleChangeNotification.data.newRole).toBe('ADMIN');
      expect(roleChangeNotification.data.reason).toBe('Testing notification system');
    });

    test('should show role change notification in user dashboard', async ({ page }) => {
      // Simulate role change for current user
      await page.request.post('/api/test/simulate-role-change-notification', {
        data: {
          userEmail: 'customer@test.1001stories.org',
          oldRole: 'CUSTOMER',
          newRole: 'ADMIN',
          changedBy: 'admin@test.1001stories.org',
          reason: 'Promoted for testing purposes'
        }
      });
      
      // Login as the user and check dashboard
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=ADMIN');
      await page.goto('/dashboard');
      
      // Should show role change notification banner
      await expect(page.locator('[data-testid="role-change-notification"]')).toBeVisible();
      await expect(page.locator('text=Your role has been updated to Admin')).toBeVisible();
      await expect(page.locator('text=Promoted for testing purposes')).toBeVisible();
      
      // Should have dismiss option
      await expect(page.locator('[data-testid="dismiss-notification"]')).toBeVisible();
      
      // Dismiss notification
      await page.click('[data-testid="dismiss-notification"]');
      await expect(page.locator('[data-testid="role-change-notification"]')).not.toBeVisible();
    });

    test('should send email notification for role changes', async ({ page }) => {
      // Enable email notifications for test
      await page.request.post('/api/admin/settings', {
        data: { emailNotifications: true }
      });
      
      const userEmail = 'email-notification@test.1001stories.org';
      await page.request.post('/api/test/create-user', {
        data: { email: userEmail, role: 'CUSTOMER' }
      });
      
      // Change role with email notification
      await page.request.post('/api/admin/assign-role', {
        data: {
          userEmail: userEmail,
          newRole: 'ADMIN',
          reason: 'Testing email notifications',
          sendEmail: true
        }
      });
      
      // Check that email was queued (using test email service)
      const emailQueue = await page.request.get('/api/test/email-queue');
      const emails = await emailQueue.json();
      
      const roleChangeEmail = emails.find((email: any) => 
        email.to === userEmail && 
        email.subject.includes('Role Updated')
      );
      
      expect(roleChangeEmail).toBeDefined();
      expect(roleChangeEmail.html).toContain('Admin');
      expect(roleChangeEmail.html).toContain('Testing email notifications');
    });
  });

  test.describe('Role Assignment Audit Trail', () => {
    test('should log all role assignments', async ({ page }) => {
      const userEmail = 'audit-test@test.1001stories.org';
      
      // Create user
      await page.request.post('/api/test/create-user', {
        data: { email: userEmail, role: 'CUSTOMER' }
      });
      
      // Change role
      await page.request.post('/api/admin/assign-role', {
        data: {
          userEmail: userEmail,
          newRole: 'ADMIN',
          reason: 'Testing audit trail'
        }
      });
      
      // Check audit log
      const auditResponse = await page.request.get('/api/admin/audit-log?type=role_assignment');
      const auditEntries = await auditResponse.json();
      
      const relevantEntry = auditEntries.find((entry: any) => 
        entry.targetUser === userEmail && 
        entry.action === 'role_change'
      );
      
      expect(relevantEntry).toBeDefined();
      expect(relevantEntry.oldValue).toBe('CUSTOMER');
      expect(relevantEntry.newValue).toBe('ADMIN');
      expect(relevantEntry.reason).toBe('Testing audit trail');
      expect(relevantEntry.performedBy).toBeDefined();
      expect(relevantEntry.timestamp).toBeDefined();
      expect(relevantEntry.ipAddress).toBeDefined();
    });

    test('should track role assignment history for users', async ({ page }) => {
      const userEmail = 'history-test@test.1001stories.org';
      
      // Create user
      await page.request.post('/api/test/create-user', {
        data: { email: userEmail, role: 'CUSTOMER' }
      });
      
      // Make several role changes
      await page.request.post('/api/admin/assign-role', {
        data: { userEmail, newRole: 'ADMIN', reason: 'First promotion' }
      });
      
      await page.request.post('/api/admin/assign-role', {
        data: { userEmail, newRole: 'CUSTOMER', reason: 'Temporary demotion' }
      });
      
      await page.request.post('/api/admin/assign-role', {
        data: { userEmail, newRole: 'ADMIN', reason: 'Final promotion' }
      });
      
      // Get role history
      const historyResponse = await page.request.get(`/api/admin/users/${userEmail}/role-history`);
      const history = await historyResponse.json();
      
      expect(history.length).toBe(4); // Initial + 3 changes
      
      // Should be in chronological order
      expect(history[0].role).toBe('CUSTOMER'); // Initial
      expect(history[1].role).toBe('ADMIN');    // First promotion
      expect(history[2].role).toBe('CUSTOMER'); // Demotion
      expect(history[3].role).toBe('ADMIN');    // Final promotion
      
      // Each entry should have complete metadata
      history.forEach((entry: any) => {
        expect(entry.timestamp).toBeDefined();
        expect(entry.performedBy).toBeDefined();
        if (entry.reason) {
          expect(typeof entry.reason).toBe('string');
        }
      });
    });

    test('should show role history in admin user interface', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Find user and view history
      const userRow = page.locator(`tr:has-text("customer@test.1001stories.org")`);
      await userRow.locator('[data-testid="view-history-button"]').click();
      
      // Should open history modal
      await expect(page.locator('[data-testid="role-history-modal"]')).toBeVisible();
      await expect(page.locator('h2:has-text("Role History")')).toBeVisible();
      
      // Should show history timeline
      await expect(page.locator('[data-testid="history-timeline"]')).toBeVisible();
      
      // Each history entry should show key information
      const historyEntries = page.locator('[data-testid="history-entry"]');
      await expect(historyEntries.first()).toBeVisible();
      
      // Should show role, date, and person who made change
      await expect(historyEntries.first()).toContainText('Role:');
      await expect(historyEntries.first()).toContainText('Date:');
      await expect(historyEntries.first()).toContainText('Changed by:');
    });

    test('should export audit trail data', async ({ page }) => {
      await page.goto('/admin/audit');
      
      // Filter to role assignment events
      await page.selectOption('[data-testid="event-type-filter"]', 'role_assignment');
      await page.click('[data-testid="apply-filter"]');
      
      // Should show role assignment events
      await expect(page.locator('[data-testid="audit-table"]')).toBeVisible();
      
      // Export audit data
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-audit-data"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('role-assignment-audit');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Bulk Role Operations', () => {
    test('should support bulk role assignments', async ({ page }) => {
      // Create multiple test users
      const userEmails = [
        'bulk1@test.1001stories.org',
        'bulk2@test.1001stories.org',
        'bulk3@test.1001stories.org'
      ];
      
      for (const email of userEmails) {
        await page.request.post('/api/test/create-user', {
          data: { email, role: 'CUSTOMER' }
        });
      }
      
      // Bulk assign admin role
      const bulkResponse = await page.request.post('/api/admin/bulk-assign-role', {
        data: {
          userEmails: userEmails,
          newRole: 'ADMIN',
          reason: 'Bulk promotion for testing'
        }
      });
      
      expect(bulkResponse.ok()).toBeTruthy();
      const result = await bulkResponse.json();
      
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      
      // Verify all users have new role
      for (const email of userEmails) {
        const userCheck = await page.request.get(`/api/admin/users?email=${email}`);
        const userData = await userCheck.json();
        expect(userData.role).toBe('ADMIN');
      }
    });

    test('should handle partial bulk operation failures', async ({ page }) => {
      // Mix of valid and invalid users
      const operations = [
        'valid1@test.1001stories.org',
        'valid2@test.1001stories.org',
        'nonexistent@test.1001stories.org' // This one should fail
      ];
      
      // Create valid users
      await page.request.post('/api/test/create-user', {
        data: { email: 'valid1@test.1001stories.org', role: 'CUSTOMER' }
      });
      await page.request.post('/api/test/create-user', {
        data: { email: 'valid2@test.1001stories.org', role: 'CUSTOMER' }
      });
      
      // Attempt bulk operation
      const bulkResponse = await page.request.post('/api/admin/bulk-assign-role', {
        data: {
          userEmails: operations,
          newRole: 'ADMIN',
          reason: 'Testing partial failure',
          continueOnError: true
        }
      });
      
      const result = await bulkResponse.json();
      
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].email).toBe('nonexistent@test.1001stories.org');
      expect(result.errors[0].reason).toContain('User not found');
    });

    test('should create bulk audit entries', async ({ page }) => {
      const userEmails = [
        'bulk-audit1@test.1001stories.org',
        'bulk-audit2@test.1001stories.org'
      ];
      
      for (const email of userEmails) {
        await page.request.post('/api/test/create-user', {
          data: { email, role: 'CUSTOMER' }
        });
      }
      
      // Bulk role assignment
      await page.request.post('/api/admin/bulk-assign-role', {
        data: {
          userEmails: userEmails,
          newRole: 'ADMIN',
          reason: 'Bulk audit test'
        }
      });
      
      // Check audit trail has entries for both users
      const auditResponse = await page.request.get('/api/admin/audit-log?type=role_assignment');
      const auditEntries = await auditResponse.json();
      
      const bulkEntries = auditEntries.filter((entry: any) => 
        userEmails.includes(entry.targetUser) && 
        entry.reason === 'Bulk audit test'
      );
      
      expect(bulkEntries).toHaveLength(2);
      
      // Each entry should have bulk operation ID
      expect(bulkEntries[0].bulkOperationId).toBeDefined();
      expect(bulkEntries[1].bulkOperationId).toBe(bulkEntries[0].bulkOperationId);
    });
  });
});