import { test, expect, Page } from '@playwright/test';

/**
 * User Migration Tests
 * 
 * Validates the migration of existing users from old role system to new role system:
 * - LEARNER → CUSTOMER migration
 * - Data integrity during migration
 * - Batch migration processes
 * - Migration rollback capabilities
 * - Migration monitoring and reporting
 */

test.describe('User Migration - Role System V2', () => {

  test.describe('Individual User Migration', () => {
    test('should migrate single LEARNER user to CUSTOMER', async ({ page }) => {
      // Create test LEARNER user
      const testUser = await page.request.post('/api/test/create-user', {
        data: {
          email: 'learner1@test.1001stories.org',
          role: 'LEARNER',
          name: 'Test Learner',
          createdAt: new Date('2024-01-01').toISOString(),
          preferences: {
            language: 'en',
            notifications: true,
            theme: 'light'
          },
          libraryAccess: ['story1', 'story2'],
          subscriptionStatus: 'active'
        }
      });

      expect(testUser.ok()).toBeTruthy();

      // Trigger migration for specific user
      const migrationResult = await page.request.post('/api/admin/migrate-user', {
        data: { email: 'learner1@test.1001stories.org' }
      });

      expect(migrationResult.ok()).toBeTruthy();
      const migration = await migrationResult.json();
      expect(migration.success).toBe(true);
      expect(migration.oldRole).toBe('LEARNER');
      expect(migration.newRole).toBe('CUSTOMER');

      // Verify migration completed successfully
      const userResponse = await page.request.get('/api/admin/users?email=learner1@test.1001stories.org');
      const userData = await userResponse.json();
      
      expect(userData.role).toBe('CUSTOMER');
      expect(userData.name).toBe('Test Learner');
      expect(userData.preferences).toMatchObject({
        language: 'en',
        notifications: true,
        theme: 'light'
      });
      expect(userData.libraryAccess).toEqual(['story1', 'story2']);
      expect(userData.subscriptionStatus).toBe('active');
    });

    test('should handle migration of user with complex data relationships', async ({ page }) => {
      // Create user with related data
      const userData = {
        email: 'complex-learner@test.1001stories.org',
        role: 'LEARNER',
        name: 'Complex Learner',
        orders: [
          { productId: 'book1', status: 'completed', amount: 9.99 },
          { productId: 'book2', status: 'pending', amount: 14.99 }
        ],
        donations: [
          { amount: 25.00, program: 'seeds-of-empowerment' }
        ],
        bookmarks: ['story1', 'story3', 'story5'],
        readingProgress: {
          'story1': { completed: true, lastPage: 15 },
          'story3': { completed: false, lastPage: 8 }
        }
      };

      await page.request.post('/api/test/create-complex-user', { data: userData });

      // Perform migration
      await page.request.post('/api/admin/migrate-user', {
        data: { email: userData.email }
      });

      // Verify all related data is preserved
      const userCheck = await page.request.get(`/api/admin/users?email=${userData.email}`);
      const user = await userCheck.json();

      expect(user.role).toBe('CUSTOMER');
      
      // Check orders are preserved
      const ordersCheck = await page.request.get(`/api/admin/user-orders?userId=${user.id}`);
      const orders = await ordersCheck.json();
      expect(orders).toHaveLength(2);
      expect(orders[0].status).toBe('completed');
      
      // Check donations are preserved
      const donationsCheck = await page.request.get(`/api/admin/user-donations?userId=${user.id}`);
      const donations = await donationsCheck.json();
      expect(donations).toHaveLength(1);
      expect(donations[0].amount).toBe(25.00);
    });

    test('should skip migration for users who are already CUSTOMER or ADMIN', async ({ page }) => {
      // Create CUSTOMER user
      await page.request.post('/api/test/create-user', {
        data: {
          email: 'existing-customer@test.1001stories.org',
          role: 'CUSTOMER'
        }
      });

      // Create ADMIN user
      await page.request.post('/api/test/create-user', {
        data: {
          email: 'existing-admin@test.1001stories.org',
          role: 'ADMIN'
        }
      });

      // Attempt migration
      const customerMigration = await page.request.post('/api/admin/migrate-user', {
        data: { email: 'existing-customer@test.1001stories.org' }
      });

      const adminMigration = await page.request.post('/api/admin/migrate-user', {
        data: { email: 'existing-admin@test.1001stories.org' }
      });

      // Both should skip migration
      const customerResult = await customerMigration.json();
      const adminResult = await adminMigration.json();

      expect(customerResult.skipped).toBe(true);
      expect(customerResult.reason).toBe('User already has compatible role');
      
      expect(adminResult.skipped).toBe(true);
      expect(adminResult.reason).toBe('User already has compatible role');
    });
  });

  test.describe('Batch Migration Process', () => {
    test('should perform batch migration of all LEARNER users', async ({ page }) => {
      // Create multiple LEARNER users
      const learnerUsers = [
        'batch1@test.1001stories.org',
        'batch2@test.1001stories.org',
        'batch3@test.1001stories.org',
        'batch4@test.1001stories.org',
        'batch5@test.1001stories.org'
      ];

      for (const email of learnerUsers) {
        await page.request.post('/api/test/create-user', {
          data: { email, role: 'LEARNER', name: `Batch User ${email}` }
        });
      }

      // Start batch migration
      const batchMigration = await page.request.post('/api/admin/batch-migrate', {
        data: { fromRole: 'LEARNER', toRole: 'CUSTOMER' }
      });

      expect(batchMigration.ok()).toBeTruthy();
      const batchResult = await batchMigration.json();
      
      expect(batchResult.totalUsers).toBe(5);
      expect(batchResult.migrated).toBe(5);
      expect(batchResult.failed).toBe(0);
      expect(batchResult.skipped).toBe(0);

      // Verify all users are migrated
      for (const email of learnerUsers) {
        const userCheck = await page.request.get(`/api/admin/users?email=${email}`);
        const user = await userCheck.json();
        expect(user.role).toBe('CUSTOMER');
      }
    });

    test('should handle partial batch migration failures gracefully', async ({ page }) => {
      // Create mix of valid and problematic users
      const users = [
        { email: 'valid1@test.1001stories.org', role: 'LEARNER', valid: true },
        { email: 'valid2@test.1001stories.org', role: 'LEARNER', valid: true },
        { email: 'invalid@test.1001stories.org', role: 'LEARNER', corrupted: true },
        { email: 'already-customer@test.1001stories.org', role: 'CUSTOMER', valid: true }
      ];

      for (const user of users) {
        await page.request.post('/api/test/create-user', { data: user });
      }

      // Start batch migration
      const batchMigration = await page.request.post('/api/admin/batch-migrate', {
        data: { fromRole: 'LEARNER', toRole: 'CUSTOMER', continueOnError: true }
      });

      const batchResult = await batchMigration.json();
      
      expect(batchResult.totalUsers).toBe(3); // Only LEARNER users
      expect(batchResult.migrated).toBe(2); // Two valid users
      expect(batchResult.failed).toBe(1); // One corrupted user
      expect(batchResult.skipped).toBe(0);
      
      // Should have detailed error logs
      expect(batchResult.errors).toHaveLength(1);
      expect(batchResult.errors[0].email).toBe('invalid@test.1001stories.org');
    });

    test('should generate comprehensive migration report', async ({ page }) => {
      // Create test users for migration
      await page.request.post('/api/test/create-user', {
        data: { email: 'report1@test.1001stories.org', role: 'LEARNER' }
      });
      await page.request.post('/api/test/create-user', {
        data: { email: 'report2@test.1001stories.org', role: 'LEARNER' }
      });

      // Perform migration with reporting enabled
      const migration = await page.request.post('/api/admin/batch-migrate', {
        data: { 
          fromRole: 'LEARNER', 
          toRole: 'CUSTOMER',
          generateReport: true 
        }
      });

      const result = await migration.json();
      expect(result.reportId).toBeDefined();

      // Get migration report
      const reportResponse = await page.request.get(`/api/admin/migration-report/${result.reportId}`);
      const report = await reportResponse.json();

      expect(report.summary.totalUsers).toBe(2);
      expect(report.summary.migrated).toBe(2);
      expect(report.summary.failed).toBe(0);
      expect(report.startTime).toBeDefined();
      expect(report.endTime).toBeDefined();
      expect(report.duration).toBeGreaterThan(0);
      
      // Should have detailed user records
      expect(report.userDetails).toHaveLength(2);
      expect(report.userDetails[0].status).toBe('migrated');
      expect(report.userDetails[1].status).toBe('migrated');
    });
  });

  test.describe('Migration Rollback', () => {
    test('should rollback single user migration', async ({ page }) => {
      // Create and migrate user
      await page.request.post('/api/test/create-user', {
        data: {
          email: 'rollback@test.1001stories.org',
          role: 'LEARNER',
          originalData: true
        }
      });

      const migrationResult = await page.request.post('/api/admin/migrate-user', {
        data: { email: 'rollback@test.1001stories.org' }
      });
      
      const migration = await migrationResult.json();
      expect(migration.newRole).toBe('CUSTOMER');

      // Perform rollback
      const rollback = await page.request.post('/api/admin/rollback-migration', {
        data: { migrationId: migration.id }
      });

      expect(rollback.ok()).toBeTruthy();
      const rollbackResult = await rollback.json();
      expect(rollbackResult.success).toBe(true);

      // Verify user is back to LEARNER
      const userCheck = await page.request.get('/api/admin/users?email=rollback@test.1001stories.org');
      const user = await userCheck.json();
      expect(user.role).toBe('LEARNER');
    });

    test('should rollback batch migration', async ({ page }) => {
      // Create batch of users
      const emails = [
        'rollback-batch1@test.1001stories.org',
        'rollback-batch2@test.1001stories.org',
        'rollback-batch3@test.1001stories.org'
      ];

      for (const email of emails) {
        await page.request.post('/api/test/create-user', {
          data: { email, role: 'LEARNER' }
        });
      }

      // Perform batch migration
      const batchMigration = await page.request.post('/api/admin/batch-migrate', {
        data: { fromRole: 'LEARNER', toRole: 'CUSTOMER' }
      });
      
      const batchResult = await batchMigration.json();
      expect(batchResult.migrated).toBe(3);

      // Rollback entire batch
      const rollback = await page.request.post('/api/admin/rollback-batch-migration', {
        data: { batchId: batchResult.batchId }
      });

      const rollbackResult = await rollback.json();
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rolledBackUsers).toBe(3);

      // Verify all users are back to LEARNER
      for (const email of emails) {
        const userCheck = await page.request.get(`/api/admin/users?email=${email}`);
        const user = await userCheck.json();
        expect(user.role).toBe('LEARNER');
      }
    });
  });

  test.describe('Migration Monitoring', () => {
    test('should track migration progress in real-time', async ({ page }) => {
      // Create large batch for progress tracking
      const userCount = 10;
      for (let i = 1; i <= userCount; i++) {
        await page.request.post('/api/test/create-user', {
          data: { 
            email: `progress${i}@test.1001stories.org`, 
            role: 'LEARNER' 
          }
        });
      }

      // Start async migration
      const migration = await page.request.post('/api/admin/batch-migrate-async', {
        data: { fromRole: 'LEARNER', toRole: 'CUSTOMER' }
      });

      const migrationId = (await migration.json()).migrationId;

      // Poll migration status
      let progress;
      let attempts = 0;
      do {
        await page.waitForTimeout(1000); // Wait 1 second
        const statusResponse = await page.request.get(`/api/admin/migration-status/${migrationId}`);
        progress = await statusResponse.json();
        attempts++;
      } while (progress.status === 'running' && attempts < 30);

      expect(progress.status).toBe('completed');
      expect(progress.totalUsers).toBe(userCount);
      expect(progress.processedUsers).toBe(userCount);
      expect(progress.successfulMigrations).toBe(userCount);
      expect(progress.failedMigrations).toBe(0);
    });

    test('should send migration completion notifications', async ({ page }) => {
      // Mock notification endpoint
      let notificationReceived = false;
      
      await page.route('/api/admin/send-notification', route => {
        notificationReceived = true;
        route.fulfill({ status: 200, body: JSON.stringify({ sent: true }) });
      });

      // Create user and migrate
      await page.request.post('/api/test/create-user', {
        data: { email: 'notify@test.1001stories.org', role: 'LEARNER' }
      });

      // Perform migration with notifications enabled
      await page.request.post('/api/admin/batch-migrate', {
        data: { 
          fromRole: 'LEARNER', 
          toRole: 'CUSTOMER',
          sendNotifications: true 
        }
      });

      // Verify notification was sent
      expect(notificationReceived).toBe(true);
    });
  });

  test.describe('Migration Data Validation', () => {
    test('should validate data integrity after migration', async ({ page }) => {
      const testUser = {
        email: 'integrity@test.1001stories.org',
        role: 'LEARNER',
        name: 'Integrity Test User',
        createdAt: new Date('2024-01-01').toISOString(),
        lastLoginAt: new Date('2024-02-15').toISOString(),
        totalOrders: 5,
        totalDonations: 3,
        librarySize: 12
      };

      // Create user with complex data
      await page.request.post('/api/test/create-complex-user', { data: testUser });

      // Capture pre-migration checksum
      const preMigrationCheck = await page.request.get(`/api/admin/user-checksum?email=${testUser.email}`);
      const preChecksum = await preMigrationCheck.json();

      // Perform migration
      await page.request.post('/api/admin/migrate-user', {
        data: { email: testUser.email }
      });

      // Capture post-migration checksum
      const postMigrationCheck = await page.request.get(`/api/admin/user-checksum?email=${testUser.email}`);
      const postChecksum = await postMigrationCheck.json();

      // Data integrity should be maintained (only role should change)
      expect(postChecksum.role).toBe('CUSTOMER');
      expect(postChecksum.name).toBe(preChecksum.name);
      expect(postChecksum.createdAt).toBe(preChecksum.createdAt);
      expect(postChecksum.lastLoginAt).toBe(preChecksum.lastLoginAt);
      expect(postChecksum.totalOrders).toBe(preChecksum.totalOrders);
      expect(postChecksum.totalDonations).toBe(preChecksum.totalDonations);
      expect(postChecksum.librarySize).toBe(preChecksum.librarySize);
    });

    test('should detect and report data corruption during migration', async ({ page }) => {
      // Create user with corrupted data scenario
      await page.request.post('/api/test/create-corrupted-user', {
        data: { email: 'corrupted@test.1001stories.org', role: 'LEARNER' }
      });

      // Attempt migration
      const migrationResult = await page.request.post('/api/admin/migrate-user', {
        data: { 
          email: 'corrupted@test.1001stories.org',
          validateIntegrity: true 
        }
      });

      const result = await migrationResult.json();
      
      // Should detect corruption and fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toContain('Data integrity check failed');
      expect(result.corruptionDetails).toBeDefined();
    });
  });
});