import { test, expect } from '@playwright/test';

/**
 * Admin Panel Tests for Role System V2
 * 
 * Tests the new admin interfaces for managing user roles:
 * - Role assignment and management
 * - User role updates via admin interface
 * - Role migration controls
 * - Admin-only access controls
 * - Bulk role operations
 */

test.describe('Admin Panel - Role Management', () => {
  // Use admin authentication state for all tests
  test.use({ storageState: 'test-results/auth/admin-auth.json' });

  test.describe('Admin Dashboard Access', () => {
    test('should allow admin access to admin dashboard', async ({ page }) => {
      await page.goto('/admin');
      
      // Should successfully load admin dashboard
      await expect(page.locator('h1')).toContainText('Admin Dashboard');
      await expect(page.locator('[data-testid="admin-navigation"]')).toBeVisible();
      
      // Should have access to user management
      await expect(page.locator('text=User Management')).toBeVisible();
      await expect(page.locator('text=Role Management')).toBeVisible();
    });

    test('should show role migration controls in admin dashboard', async ({ page }) => {
      await page.goto('/admin');
      
      // Should have migration section
      await expect(page.locator('[data-testid="migration-controls"]')).toBeVisible();
      await expect(page.locator('text=Role Migration')).toBeVisible();
      await expect(page.locator('button:has-text("Start Migration")')).toBeVisible();
      await expect(page.locator('button:has-text("View Migration History")')).toBeVisible();
    });

    test('should display role system metrics', async ({ page }) => {
      await page.goto('/admin');
      
      // Should show role distribution metrics
      await expect(page.locator('[data-testid="role-metrics"]')).toBeVisible();
      await expect(page.locator('text=Total Users')).toBeVisible();
      await expect(page.locator('text=Customer')).toBeVisible();
      await expect(page.locator('text=Admin')).toBeVisible();
      
      // Should show migration status
      await expect(page.locator('[data-testid="migration-status"]')).toBeVisible();
    });
  });

  test.describe('User Management Interface', () => {
    test('should display users with current roles', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Should load users table
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('th:has-text("Email")')).toBeVisible();
      await expect(page.locator('th:has-text("Role")')).toBeVisible();
      await expect(page.locator('th:has-text("Created")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
      
      // Should display users with their current roles
      const userRows = page.locator('tbody tr');
      await expect(userRows.first()).toBeVisible();
      
      // Check for role badges
      await expect(page.locator('[data-testid="role-badge-CUSTOMER"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-badge-ADMIN"]')).toBeVisible();
    });

    test('should allow filtering users by role', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Should have role filter dropdown
      await expect(page.locator('[data-testid="role-filter"]')).toBeVisible();
      
      // Filter by CUSTOMER role
      await page.selectOption('[data-testid="role-filter"]', 'CUSTOMER');
      await page.waitForTimeout(1000); // Wait for filter to apply
      
      // Should only show CUSTOMER users
      const visibleRoleBadges = page.locator('[data-testid="role-badge-CUSTOMER"]');
      await expect(visibleRoleBadges).toBeVisible();
      
      // Should not show other role badges
      await expect(page.locator('[data-testid="role-badge-ADMIN"]')).not.toBeVisible();
    });

    test('should search users by email', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Use search functionality
      await page.fill('[data-testid="user-search"]', 'customer@test.1001stories.org');
      await page.press('[data-testid="user-search"]', 'Enter');
      
      // Should show filtered results
      await expect(page.locator('tbody tr')).toHaveCount(1);
      await expect(page.locator('text=customer@test.1001stories.org')).toBeVisible();
    });
  });

  test.describe('Individual Role Management', () => {
    test('should allow changing user role', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Find a specific user row and click edit
      const testUserRow = page.locator('tr:has-text("customer@test.1001stories.org")');
      await testUserRow.locator('[data-testid="edit-user-button"]').click();
      
      // Should open role edit modal
      await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();
      await expect(page.locator('text=Edit User Role')).toBeVisible();
      
      // Should show current role
      await expect(page.locator('text=Current Role: CUSTOMER')).toBeVisible();
      
      // Change role to ADMIN
      await page.selectOption('[data-testid="role-select"]', 'ADMIN');
      await page.fill('[data-testid="role-change-reason"]', 'Promoting to admin for testing purposes');
      await page.click('button:has-text("Update Role")');
      
      // Should show success message
      await expect(page.locator('text=Role updated successfully')).toBeVisible();
      
      // Should close modal and update table
      await expect(page.locator('[data-testid="edit-user-modal"]')).not.toBeVisible();
      await expect(testUserRow.locator('[data-testid="role-badge-ADMIN"]')).toBeVisible();
    });

    test('should require confirmation for sensitive role changes', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Find admin user and attempt to change to customer
      const adminUserRow = page.locator('tr:has-text("admin@test.1001stories.org")');
      await adminUserRow.locator('[data-testid="edit-user-button"]').click();
      
      // Change admin to customer (sensitive change)
      await page.selectOption('[data-testid="role-select"]', 'CUSTOMER');
      await page.fill('[data-testid="role-change-reason"]', 'Demoting for testing');
      await page.click('button:has-text("Update Role")');
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
      await expect(page.locator('text=This will remove admin privileges')).toBeVisible();
      await expect(page.locator('button:has-text("Confirm Change")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      
      // Cancel the change
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('[data-testid="confirmation-dialog"]')).not.toBeVisible();
    });

    test('should validate role change permissions', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Try to edit your own admin role
      const currentAdminRow = page.locator('tr:has-text("admin@test.1001stories.org")');
      await currentAdminRow.locator('[data-testid="edit-user-button"]').click();
      
      // Should show warning about editing own role
      await expect(page.locator('text=You are editing your own role')).toBeVisible();
      await expect(page.locator('text=This may affect your access')).toBeVisible();
      
      // Attempt to demote self
      await page.selectOption('[data-testid="role-select"]', 'CUSTOMER');
      await page.click('button:has-text("Update Role")');
      
      // Should show additional confirmation
      await expect(page.locator('text=You will lose admin access')).toBeVisible();
    });

    test('should log role changes for audit trail', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Change a user's role
      const userRow = page.locator('tr:has-text("customer@test.1001stories.org")');
      await userRow.locator('[data-testid="edit-user-button"]').click();
      
      await page.selectOption('[data-testid="role-select"]', 'ADMIN');
      await page.fill('[data-testid="role-change-reason"]', 'Test promotion for audit trail');
      await page.click('button:has-text("Update Role")');
      
      // Navigate to audit logs
      await page.goto('/admin/audit');
      
      // Should show the role change in audit log
      await expect(page.locator('text=Role Change')).toBeVisible();
      await expect(page.locator('text=customer@test.1001stories.org')).toBeVisible();
      await expect(page.locator('text=CUSTOMER → ADMIN')).toBeVisible();
      await expect(page.locator('text=Test promotion for audit trail')).toBeVisible();
    });
  });

  test.describe('Bulk Role Operations', () => {
    test('should allow bulk role changes', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Select multiple users
      await page.check('[data-testid="select-user-1"]');
      await page.check('[data-testid="select-user-2"]');
      await page.check('[data-testid="select-user-3"]');
      
      // Should show bulk actions bar
      await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeVisible();
      await expect(page.locator('text=3 users selected')).toBeVisible();
      
      // Click bulk role change
      await page.click('button:has-text("Change Role")');
      
      // Should open bulk role change modal
      await expect(page.locator('[data-testid="bulk-role-modal"]')).toBeVisible();
      await expect(page.locator('text=Change Role for 3 Users')).toBeVisible();
      
      // Select new role
      await page.selectOption('[data-testid="bulk-role-select"]', 'CUSTOMER');
      await page.fill('[data-testid="bulk-change-reason"]', 'Bulk migration to customer role');
      await page.click('button:has-text("Apply Changes")');
      
      // Should show progress indicator
      await expect(page.locator('[data-testid="bulk-progress"]')).toBeVisible();
      
      // Should show completion message
      await expect(page.locator('text=3 users updated successfully')).toBeVisible();
    });

    test('should handle partial bulk operation failures', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Select users including one that might fail (e.g., system user)
      await page.check('[data-testid="select-user-system"]');
      await page.check('[data-testid="select-user-normal"]');
      
      await page.click('button:has-text("Change Role")');
      
      await page.selectOption('[data-testid="bulk-role-select"]', 'CUSTOMER');
      await page.fill('[data-testid="bulk-change-reason"]', 'Bulk test with expected failure');
      await page.click('button:has-text("Apply Changes")');
      
      // Should show partial success message
      await expect(page.locator('text=1 of 2 users updated successfully')).toBeVisible();
      await expect(page.locator('text=1 user failed to update')).toBeVisible();
      
      // Should show failure details
      await expect(page.locator('[data-testid="bulk-errors"]')).toBeVisible();
    });

    test('should export bulk operation results', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Perform bulk operation
      await page.check('[data-testid="select-user-1"]');
      await page.check('[data-testid="select-user-2"]');
      await page.click('button:has-text("Change Role")');
      
      await page.selectOption('[data-testid="bulk-role-select"]', 'CUSTOMER');
      await page.fill('[data-testid="bulk-change-reason"]', 'Export test operation');
      await page.click('button:has-text("Apply Changes")');
      
      // Should show export option
      await expect(page.locator('button:has-text("Export Results")')).toBeVisible();
      
      // Setup download handler
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export Results")');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('bulk-role-changes');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Migration Management Interface', () => {
    test('should display migration dashboard', async ({ page }) => {
      await page.goto('/admin/migration');
      
      // Should show migration overview
      await expect(page.locator('h1:has-text("Role Migration")')).toBeVisible();
      
      // Should show migration statistics
      await expect(page.locator('[data-testid="migration-stats"]')).toBeVisible();
      await expect(page.locator('text=Total Migrations')).toBeVisible();
      await expect(page.locator('text=Pending Migrations')).toBeVisible();
      await expect(page.locator('text=Failed Migrations')).toBeVisible();
      
      // Should show migration controls
      await expect(page.locator('button:has-text("Start New Migration")')).toBeVisible();
      await expect(page.locator('button:has-text("View History")')).toBeVisible();
    });

    test('should allow starting new migration batch', async ({ page }) => {
      await page.goto('/admin/migration');
      
      await page.click('button:has-text("Start New Migration")');
      
      // Should open migration configuration modal
      await expect(page.locator('[data-testid="migration-config-modal"]')).toBeVisible();
      await expect(page.locator('text=Configure Migration')).toBeVisible();
      
      // Configure migration
      await page.selectOption('[data-testid="from-role-select"]', 'LEARNER');
      await page.selectOption('[data-testid="to-role-select"]', 'CUSTOMER');
      await page.check('[data-testid="dry-run-checkbox"]'); // Start with dry run
      await page.fill('[data-testid="migration-description"]', 'Test migration from admin panel');
      
      await page.click('button:has-text("Start Migration")');
      
      // Should show migration progress page
      await expect(page.locator('text=Migration In Progress')).toBeVisible();
      await expect(page.locator('[data-testid="migration-progress-bar"]')).toBeVisible();
    });

    test('should display migration history with details', async ({ page }) => {
      await page.goto('/admin/migration');
      
      await page.click('button:has-text("View History")');
      
      // Should show migration history table
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('th:has-text("Migration ID")')).toBeVisible();
      await expect(page.locator('th:has-text("From Role")')).toBeVisible();
      await expect(page.locator('th:has-text("To Role")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      await expect(page.locator('th:has-text("Users")')).toBeVisible();
      await expect(page.locator('th:has-text("Date")')).toBeVisible();
      
      // Should show migration details when clicked
      const firstMigration = page.locator('tbody tr').first();
      await firstMigration.click();
      
      // Should show detailed migration info
      await expect(page.locator('[data-testid="migration-details"]')).toBeVisible();
      await expect(page.locator('text=Migration Details')).toBeVisible();
    });

    test('should allow rollback of completed migrations', async ({ page }) => {
      await page.goto('/admin/migration');
      await page.click('button:has-text("View History")');
      
      // Find a completed migration
      const completedMigration = page.locator('tr:has-text("completed")').first();
      await completedMigration.locator('[data-testid="rollback-button"]').click();
      
      // Should show rollback confirmation
      await expect(page.locator('[data-testid="rollback-confirmation"]')).toBeVisible();
      await expect(page.locator('text=This will reverse all changes')).toBeVisible();
      
      // Confirm rollback
      await page.fill('[data-testid="rollback-reason"]', 'Testing rollback functionality');
      await page.click('button:has-text("Confirm Rollback")');
      
      // Should show rollback progress
      await expect(page.locator('text=Rollback In Progress')).toBeVisible();
      await expect(page.locator('[data-testid="rollback-progress-bar"]')).toBeVisible();
    });
  });

  test.describe('Admin Access Control', () => {
    test('should restrict admin features to admin users only', async ({ page }) => {
      // Test with customer user session
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      
      // Try to access admin panel
      await page.goto('/admin');
      
      // Should be redirected or see access denied
      await expect(page.locator('text=Access Denied')).toBeVisible();
      // OR redirected to login/dashboard
      // await page.waitForURL('/login');
    });

    test('should show appropriate navigation for admin users', async ({ page }) => {
      await page.goto('/admin');
      
      // Should show admin-specific navigation items
      await expect(page.locator('nav [href="/admin"]')).toBeVisible();
      await expect(page.locator('nav [href="/admin/users"]')).toBeVisible();
      await expect(page.locator('nav [href="/admin/migration"]')).toBeVisible();
      await expect(page.locator('nav [href="/admin/audit"]')).toBeVisible();
    });

    test('should handle admin role changes gracefully', async ({ page }) => {
      // Login as admin
      await page.goto('/admin');
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      
      // Simulate admin role being revoked (external action)
      await page.request.post('/api/test/revoke-admin', {
        data: { email: 'admin@test.1001stories.org' }
      });
      
      // Navigate to another admin page
      await page.goto('/admin/users');
      
      // Should detect role change and restrict access
      await expect(page.locator('text=Your permissions have changed')).toBeVisible();
      // Or redirect to appropriate page
    });
  });

  test.describe('Performance and Usability', () => {
    test('should load user management page within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/admin/users');
      await page.waitForSelector('table tbody tr:nth-child(1)');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
    });

    test('should handle large user lists efficiently', async ({ page }) => {
      // Create test scenario with many users
      await page.request.post('/api/test/create-many-users', {
        data: { count: 100 }
      });
      
      await page.goto('/admin/users');
      
      // Should use pagination or virtual scrolling
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
      // OR expect(page.locator('[data-testid="virtual-scroll"]')).toBeVisible();
      
      // Should show reasonable number of users per page
      const visibleRows = await page.locator('tbody tr').count();
      expect(visibleRows).toBeLessThanOrEqual(50);
      expect(visibleRows).toBeGreaterThan(0);
    });

    test('should provide responsive design for mobile admin access', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin/users');
      
      // Should adapt table for mobile
      await expect(page.locator('[data-testid="mobile-user-cards"]')).toBeVisible();
      // OR horizontal scroll
      await expect(page.locator('table')).toHaveCSS('overflow-x', 'auto');
      
      // Actions should be accessible
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    });
  });
});