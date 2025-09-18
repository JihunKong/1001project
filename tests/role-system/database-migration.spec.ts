import { test, expect } from '@playwright/test';

/**
 * Database Migration Tests for Role System V2
 * 
 * Comprehensive tests for database schema changes and data migration:
 * - Schema migration validation
 * - Data integrity during migration
 * - Performance impact assessment
 * - Rollback capability testing
 * - Production data safety
 */

test.describe('Database Migration - Role System V2', () => {

  test.describe('Schema Migration Validation', () => {
    test('should successfully apply role system schema changes', async ({ page }) => {
      // Verify current schema state
      const schemaCheck = await page.request.get('/api/admin/database/schema-status');
      const schema = await schemaCheck.json();
      
      expect(schema.tables).toContainEqual(
        expect.objectContaining({ name: 'User' })
      );
      
      // Check for required columns in User table
      const userTable = schema.tables.find((t: any) => t.name === 'User');
      expect(userTable.columns).toContainEqual(
        expect.objectContaining({ 
          name: 'role',
          type: 'UserRole',
          nullable: false 
        })
      );
      
      // Verify enum values are updated
      const roleEnum = schema.enums.find((e: any) => e.name === 'UserRole');
      expect(roleEnum.values).toContain('CUSTOMER');
      expect(roleEnum.values).toContain('ADMIN');
      // LEARNER should still exist for migration purposes
      expect(roleEnum.values).toContain('LEARNER');
    });

    test('should maintain foreign key relationships after migration', async ({ page }) => {
      const relationshipCheck = await page.request.get('/api/admin/database/relationships');
      const relationships = await relationshipCheck.json();
      
      // Verify User-Order relationship
      const userOrderRelation = relationships.find(
        (r: any) => r.from === 'User' && r.to === 'Order'
      );
      expect(userOrderRelation).toBeDefined();
      expect(userOrderRelation.constraint).toBe('FOREIGN KEY');
      
      // Verify User-Donation relationship
      const userDonationRelation = relationships.find(
        (r: any) => r.from === 'User' && r.to === 'Donation'
      );
      expect(userDonationRelation).toBeDefined();
      
      // Verify User-Session relationship (for NextAuth)
      const userSessionRelation = relationships.find(
        (r: any) => r.from === 'Session' && r.to === 'User'
      );
      expect(userSessionRelation).toBeDefined();
    });

    test('should create necessary indexes for performance', async ({ page }) => {
      const indexCheck = await page.request.get('/api/admin/database/indexes');
      const indexes = await indexCheck.json();
      
      // Should have index on User.role for efficient filtering
      const roleIndex = indexes.find(
        (i: any) => i.table === 'User' && i.columns.includes('role')
      );
      expect(roleIndex).toBeDefined();
      
      // Should have index on User.email (primary lookup)
      const emailIndex = indexes.find(
        (i: any) => i.table === 'User' && i.columns.includes('email')
      );
      expect(emailIndex).toBeDefined();
      expect(emailIndex.unique).toBe(true);
      
      // Should have composite index for common queries
      const compositeIndex = indexes.find(
        (i: any) => i.table === 'User' && 
                   i.columns.includes('role') && 
                   i.columns.includes('createdAt')
      );
      expect(compositeIndex).toBeDefined();
    });

    test('should maintain data constraints after migration', async ({ page }) => {
      const constraintsCheck = await page.request.get('/api/admin/database/constraints');
      const constraints = await constraintsCheck.json();
      
      // Email should remain unique
      const emailConstraint = constraints.find(
        (c: any) => c.table === 'User' && 
                   c.column === 'email' && 
                   c.type === 'UNIQUE'
      );
      expect(emailConstraint).toBeDefined();
      
      // Role should not be nullable
      const roleConstraint = constraints.find(
        (c: any) => c.table === 'User' && 
                   c.column === 'role' && 
                   c.type === 'NOT NULL'
      );
      expect(roleConstraint).toBeDefined();
    });
  });

  test.describe('Data Migration Integrity', () => {
    test('should preserve all user data during LEARNER to CUSTOMER migration', async ({ page }) => {
      // Create comprehensive test user data
      const testUser = {
        email: 'data-integrity@test.1001stories.org',
        role: 'LEARNER',
        name: 'Data Integrity Test',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        lastLoginAt: new Date('2024-02-15T14:30:00Z'),
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
            newsletter: true
          }
        },
        profile: {
          dateOfBirth: '1995-06-15',
          country: 'US',
          timezone: 'America/New_York'
        }
      };

      // Create user with related data
      const createResponse = await page.request.post('/api/test/create-complete-user', {
        data: testUser
      });
      expect(createResponse.ok()).toBeTruthy();
      const createdUser = await createResponse.json();

      // Create related data
      await page.request.post('/api/test/create-user-orders', {
        data: {
          userId: createdUser.id,
          orders: [
            { productId: 'book1', amount: 9.99, status: 'completed' },
            { productId: 'book2', amount: 14.99, status: 'pending' }
          ]
        }
      });

      await page.request.post('/api/test/create-user-donations', {
        data: {
          userId: createdUser.id,
          donations: [
            { amount: 25.00, program: 'seeds-of-empowerment' }
          ]
        }
      });

      // Capture pre-migration data checksum
      const preChecksum = await page.request.get(`/api/admin/user-data-checksum/${createdUser.id}`);
      const preData = await preChecksum.json();

      // Perform migration
      const migration = await page.request.post('/api/admin/migrate-user-with-validation', {
        data: { 
          userId: createdUser.id,
          validateIntegrity: true,
          preserveTimestamps: true 
        }
      });

      expect(migration.ok()).toBeTruthy();
      const migrationResult = await migration.json();
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.dataIntegrityCheck.passed).toBe(true);

      // Capture post-migration data checksum
      const postChecksum = await page.request.get(`/api/admin/user-data-checksum/${createdUser.id}`);
      const postData = await postChecksum.json();

      // Verify data integrity
      expect(postData.role).toBe('CUSTOMER');
      expect(postData.email).toBe(preData.email);
      expect(postData.name).toBe(preData.name);
      expect(postData.createdAt).toBe(preData.createdAt);
      expect(postData.lastLoginAt).toBe(preData.lastLoginAt);
      expect(postData.preferences).toEqual(preData.preferences);
      expect(postData.profile).toEqual(preData.profile);
      expect(postData.ordersCount).toBe(preData.ordersCount);
      expect(postData.donationsCount).toBe(preData.donationsCount);
      expect(postData.totalOrderValue).toBe(preData.totalOrderValue);
    });

    test('should handle users with missing or corrupted data gracefully', async ({ page }) => {
      // Create user with intentionally missing/corrupted data
      const corruptedUser = await page.request.post('/api/test/create-user', {
        data: {
          email: 'corrupted@test.1001stories.org',
          role: 'LEARNER',
          name: null, // Corrupted name
          preferences: '{}', // Invalid JSON in preferences field
        }
      });

      const userData = await corruptedUser.json();

      // Attempt migration with validation
      const migration = await page.request.post('/api/admin/migrate-user-with-validation', {
        data: { 
          userId: userData.id,
          validateIntegrity: true,
          handleCorruption: 'fix'
        }
      });

      const migrationResult = await migration.json();
      
      // Should succeed but report data fixes
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.dataFixes).toHaveLength(2);
      expect(migrationResult.dataFixes).toContainEqual(
        expect.objectContaining({ field: 'name', issue: 'null_value', fix: 'set_default' })
      );
      expect(migrationResult.dataFixes).toContainEqual(
        expect.objectContaining({ field: 'preferences', issue: 'invalid_json', fix: 'reset_to_default' })
      );
    });

    test('should maintain referential integrity during batch migrations', async ({ page }) => {
      // Create multiple users with complex relationships
      const users = await Promise.all([
        page.request.post('/api/test/create-user-with-relations', {
          data: { email: 'batch1@test.1001stories.org', role: 'LEARNER' }
        }),
        page.request.post('/api/test/create-user-with-relations', {
          data: { email: 'batch2@test.1001stories.org', role: 'LEARNER' }
        }),
        page.request.post('/api/test/create-user-with-relations', {
          data: { email: 'batch3@test.1001stories.org', role: 'LEARNER' }
        })
      ]);

      // Verify pre-migration referential integrity
      const preIntegrityCheck = await page.request.get('/api/admin/database/referential-integrity');
      const preIntegrity = await preIntegrityCheck.json();
      expect(preIntegrity.violations).toHaveLength(0);

      // Perform batch migration
      const batchMigration = await page.request.post('/api/admin/batch-migrate-with-validation', {
        data: {
          fromRole: 'LEARNER',
          toRole: 'CUSTOMER',
          validateReferentialIntegrity: true,
          atomicTransaction: true
        }
      });

      expect(batchMigration.ok()).toBeTruthy();
      const batchResult = await batchMigration.json();
      expect(batchResult.success).toBe(true);
      expect(batchResult.migrated).toBe(3);

      // Verify post-migration referential integrity
      const postIntegrityCheck = await page.request.get('/api/admin/database/referential-integrity');
      const postIntegrity = await postIntegrityCheck.json();
      expect(postIntegrity.violations).toHaveLength(0);
    });

    test('should handle concurrent migration attempts safely', async ({ page }) => {
      // Create test user
      const userResponse = await page.request.post('/api/test/create-user', {
        data: { email: 'concurrent@test.1001stories.org', role: 'LEARNER' }
      });
      const user = await userResponse.json();

      // Start two concurrent migrations
      const migration1Promise = page.request.post('/api/admin/migrate-user', {
        data: { userId: user.id }
      });
      const migration2Promise = page.request.post('/api/admin/migrate-user', {
        data: { userId: user.id }
      });

      const [result1, result2] = await Promise.all([migration1Promise, migration2Promise]);

      // One should succeed, one should fail gracefully
      const results = [await result1.json(), await result2.json()];
      const successes = results.filter(r => r.success);
      const conflicts = results.filter(r => r.error && r.error.includes('concurrent'));

      expect(successes).toHaveLength(1);
      expect(conflicts).toHaveLength(1);

      // User should end up in correct final state
      const finalUserCheck = await page.request.get(`/api/admin/users/${user.id}`);
      const finalUser = await finalUserCheck.json();
      expect(finalUser.role).toBe('CUSTOMER');
    });
  });

  test.describe('Migration Performance Impact', () => {
    test('should complete individual user migration within time budget', async ({ page }) => {
      // Create user with moderate amount of data
      const userResponse = await page.request.post('/api/test/create-user-with-data', {
        data: {
          email: 'performance@test.1001stories.org',
          role: 'LEARNER',
          ordersCount: 10,
          donationsCount: 5,
          librarySize: 25
        }
      });
      const user = await userResponse.json();

      // Measure migration time
      const startTime = Date.now();
      
      const migration = await page.request.post('/api/admin/migrate-user', {
        data: { userId: user.id }
      });
      
      const endTime = Date.now();
      const migrationTime = endTime - startTime;

      expect(migration.ok()).toBeTruthy();
      
      // Should complete within 5 seconds for individual user
      expect(migrationTime).toBeLessThan(5000);
      
      const result = await migration.json();
      expect(result.success).toBe(true);
      expect(result.migrationTime).toBeLessThan(5000);
    });

    test('should handle large batch migrations efficiently', async ({ page }) => {
      // Create batch of users
      const batchSize = 50;
      const userEmails = Array.from({ length: batchSize }, (_, i) => 
        `batch-perf-${i}@test.1001stories.org`
      );

      // Create users in parallel
      await Promise.all(userEmails.map(email => 
        page.request.post('/api/test/create-user', {
          data: { email, role: 'LEARNER' }
        })
      ));

      // Measure batch migration performance
      const startTime = Date.now();
      
      const batchMigration = await page.request.post('/api/admin/batch-migrate', {
        data: {
          fromRole: 'LEARNER',
          toRole: 'CUSTOMER',
          batchSize: 10, // Process in smaller batches
          parallel: true
        }
      });

      expect(batchMigration.ok()).toBeTruthy();
      const result = await batchMigration.json();
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(result.migrated).toBe(batchSize);
      // Should average less than 100ms per user
      expect(totalTime / batchSize).toBeLessThan(100);
    });

    test('should not impact database performance during migration', async ({ page }) => {
      // Measure baseline database performance
      const baselineStart = Date.now();
      const baselineQuery = await page.request.get('/api/admin/database/performance-test');
      const baselineTime = Date.now() - baselineStart;
      
      expect(baselineQuery.ok()).toBeTruthy();

      // Start background migration
      const migrationPromise = page.request.post('/api/admin/batch-migrate-async', {
        data: {
          fromRole: 'LEARNER',
          toRole: 'CUSTOMER',
          throttle: true // Use throttling to minimize impact
        }
      });

      // Wait a bit for migration to start
      await page.waitForTimeout(2000);

      // Measure database performance during migration
      const migrationStart = Date.now();
      const migrationQuery = await page.request.get('/api/admin/database/performance-test');
      const migrationTime = Date.now() - migrationStart;

      expect(migrationQuery.ok()).toBeTruthy();

      // Performance should not degrade by more than 50%
      expect(migrationTime).toBeLessThan(baselineTime * 1.5);

      // Wait for migration to complete
      await migrationPromise;
    });

    test('should provide accurate progress reporting for long migrations', async ({ page }) => {
      // Create larger batch for progress tracking
      const batchSize = 25;
      for (let i = 0; i < batchSize; i++) {
        await page.request.post('/api/test/create-user', {
          data: { 
            email: `progress-${i}@test.1001stories.org`, 
            role: 'LEARNER' 
          }
        });
      }

      // Start async migration
      const migration = await page.request.post('/api/admin/batch-migrate-async', {
        data: {
          fromRole: 'LEARNER',
          toRole: 'CUSTOMER',
          reportProgress: true,
          progressInterval: 1000 // Report every second
        }
      });

      const { migrationId } = await migration.json();

      // Monitor progress
      let progress;
      let progressReports = [];
      
      do {
        await page.waitForTimeout(1500);
        const statusResponse = await page.request.get(`/api/admin/migration-status/${migrationId}`);
        progress = await statusResponse.json();
        progressReports.push(progress);
      } while (progress.status === 'running');

      expect(progress.status).toBe('completed');
      expect(progressReports.length).toBeGreaterThan(1);
      
      // Progress should be monotonically increasing
      for (let i = 1; i < progressReports.length; i++) {
        expect(progressReports[i].processed).toBeGreaterThanOrEqual(
          progressReports[i - 1].processed
        );
      }

      // Final progress should match batch size
      expect(progress.processed).toBe(batchSize);
      expect(progress.successful).toBe(batchSize);
    });
  });

  test.describe('Migration Rollback Testing', () => {
    test('should successfully rollback single user migration', async ({ page }) => {
      // Create and migrate user
      const userResponse = await page.request.post('/api/test/create-user', {
        data: {
          email: 'rollback-single@test.1001stories.org',
          role: 'LEARNER',
          name: 'Rollback Test User'
        }
      });
      const originalUser = await userResponse.json();

      // Capture original state
      const originalState = await page.request.get(`/api/admin/user-snapshot/${originalUser.id}`);
      const originalData = await originalState.json();

      // Perform migration
      const migration = await page.request.post('/api/admin/migrate-user', {
        data: { userId: originalUser.id, createSnapshot: true }
      });
      const migrationResult = await migration.json();
      expect(migrationResult.success).toBe(true);

      // Verify migration
      const migratedUser = await page.request.get(`/api/admin/users/${originalUser.id}`);
      const migratedData = await migratedUser.json();
      expect(migratedData.role).toBe('CUSTOMER');

      // Perform rollback
      const rollback = await page.request.post('/api/admin/rollback-migration', {
        data: { 
          migrationId: migrationResult.migrationId,
          validateRollback: true 
        }
      });

      expect(rollback.ok()).toBeTruthy();
      const rollbackResult = await rollback.json();
      expect(rollbackResult.success).toBe(true);

      // Verify rollback
      const rolledBackUser = await page.request.get(`/api/admin/users/${originalUser.id}`);
      const rolledBackData = await rolledBackUser.json();
      
      expect(rolledBackData.role).toBe('LEARNER');
      expect(rolledBackData.email).toBe(originalData.email);
      expect(rolledBackData.name).toBe(originalData.name);
    });

    test('should rollback batch migration atomically', async ({ page }) => {
      // Create batch of users
      const userEmails = [
        'rollback-batch-1@test.1001stories.org',
        'rollback-batch-2@test.1001stories.org',
        'rollback-batch-3@test.1001stories.org'
      ];

      for (const email of userEmails) {
        await page.request.post('/api/test/create-user', {
          data: { email, role: 'LEARNER' }
        });
      }

      // Perform batch migration
      const batchMigration = await page.request.post('/api/admin/batch-migrate', {
        data: {
          fromRole: 'LEARNER',
          toRole: 'CUSTOMER',
          createBatchSnapshot: true
        }
      });

      const batchResult = await batchMigration.json();
      expect(batchResult.migrated).toBe(3);

      // Verify all users are migrated
      for (const email of userEmails) {
        const user = await page.request.get(`/api/admin/users?email=${email}`);
        const userData = await user.json();
        expect(userData.role).toBe('CUSTOMER');
      }

      // Perform batch rollback
      const rollback = await page.request.post('/api/admin/rollback-batch-migration', {
        data: { 
          batchId: batchResult.batchId,
          atomicRollback: true 
        }
      });

      const rollbackResult = await rollback.json();
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rolledBackUsers).toBe(3);

      // Verify all users are rolled back
      for (const email of userEmails) {
        const user = await page.request.get(`/api/admin/users?email=${email}`);
        const userData = await user.json();
        expect(userData.role).toBe('LEARNER');
      }
    });

    test('should handle partial rollback failures gracefully', async ({ page }) => {
      // Create scenario where one user cannot be rolled back
      const users = [
        'rollback-ok-1@test.1001stories.org',
        'rollback-ok-2@test.1001stories.org',
        'rollback-fail@test.1001stories.org'
      ];

      for (const email of users) {
        await page.request.post('/api/test/create-user', {
          data: { email, role: 'LEARNER' }
        });
      }

      // Migrate all users
      const migration = await page.request.post('/api/admin/batch-migrate', {
        data: { fromRole: 'LEARNER', toRole: 'CUSTOMER' }
      });
      const migrationResult = await migration.json();

      // Simulate condition preventing rollback for one user
      await page.request.post('/api/test/lock-user-for-rollback', {
        data: { email: 'rollback-fail@test.1001stories.org' }
      });

      // Attempt rollback
      const rollback = await page.request.post('/api/admin/rollback-batch-migration', {
        data: { 
          batchId: migrationResult.batchId,
          continueOnError: true
        }
      });

      const rollbackResult = await rollback.json();
      expect(rollbackResult.partialSuccess).toBe(true);
      expect(rollbackResult.rolledBackUsers).toBe(2);
      expect(rollbackResult.failedRollbacks).toBe(1);
      expect(rollbackResult.errors).toHaveLength(1);
    });
  });

  test.describe('Production Data Safety', () => {
    test('should validate production data integrity before migration', async ({ page }) => {
      // Simulate production data validation
      const validation = await page.request.post('/api/admin/validate-production-data', {
        data: { 
          checkReferentialIntegrity: true,
          checkDataConsistency: true,
          checkConstraints: true
        }
      });

      expect(validation.ok()).toBeTruthy();
      const validationResult = await validation.json();
      
      expect(validationResult.referentialIntegrityCheck.passed).toBe(true);
      expect(validationResult.dataConsistencyCheck.passed).toBe(true);
      expect(validationResult.constraintsCheck.passed).toBe(true);
      
      if (!validationResult.overallStatus) {
        expect(validationResult.issues).toBeDefined();
        expect(validationResult.recommendations).toBeDefined();
      }
    });

    test('should create comprehensive backup before production migration', async ({ page }) => {
      // Initiate production backup
      const backup = await page.request.post('/api/admin/create-pre-migration-backup', {
        data: {
          includeSchema: true,
          includeData: true,
          includeIndexes: true,
          compressionLevel: 9,
          encryptBackup: true
        }
      });

      expect(backup.ok()).toBeTruthy();
      const backupResult = await backup.json();
      
      expect(backupResult.success).toBe(true);
      expect(backupResult.backupId).toBeDefined();
      expect(backupResult.backupSize).toBeGreaterThan(0);
      expect(backupResult.checksum).toBeDefined();
      
      // Verify backup integrity
      const verification = await page.request.post('/api/admin/verify-backup', {
        data: { backupId: backupResult.backupId }
      });
      
      const verificationResult = await verification.json();
      expect(verificationResult.integrityCheck.passed).toBe(true);
    });

    test('should support dry-run migration mode', async ({ page }) => {
      // Create test data
      await page.request.post('/api/test/create-user', {
        data: { email: 'dryrun@test.1001stories.org', role: 'LEARNER' }
      });

      // Perform dry-run migration
      const dryRun = await page.request.post('/api/admin/batch-migrate', {
        data: {
          fromRole: 'LEARNER',
          toRole: 'CUSTOMER',
          dryRun: true,
          validateChanges: true
        }
      });

      expect(dryRun.ok()).toBeTruthy();
      const dryRunResult = await dryRun.json();
      
      expect(dryRunResult.dryRun).toBe(true);
      expect(dryRunResult.wouldMigrate).toBeGreaterThan(0);
      expect(dryRunResult.estimatedDuration).toBeDefined();
      expect(dryRunResult.potentialIssues).toBeDefined();
      
      // Verify no actual changes were made
      const user = await page.request.get('/api/admin/users?email=dryrun@test.1001stories.org');
      const userData = await user.json();
      expect(userData.role).toBe('LEARNER'); // Should remain unchanged
    });

    test('should monitor system resources during migration', async ({ page }) => {
      // Start resource monitoring
      const monitoring = await page.request.post('/api/admin/start-resource-monitoring', {
        data: {
          monitorCPU: true,
          monitorMemory: true,
          monitorDiskIO: true,
          monitorDatabaseConnections: true
        }
      });
      const monitoringResult = await monitoring.json();
      const monitoringId = monitoringResult.monitoringId;

      // Start migration
      const migration = await page.request.post('/api/admin/batch-migrate-async', {
        data: { fromRole: 'LEARNER', toRole: 'CUSTOMER' }
      });
      const migrationId = (await migration.json()).migrationId;

      // Wait for migration to complete
      let migrationStatus;
      do {
        await page.waitForTimeout(2000);
        const statusResponse = await page.request.get(`/api/admin/migration-status/${migrationId}`);
        migrationStatus = await statusResponse.json();
      } while (migrationStatus.status === 'running');

      // Get resource usage report
      const resourceReport = await page.request.get(`/api/admin/resource-report/${monitoringId}`);
      const resources = await resourceReport.json();

      // Verify resource usage stayed within acceptable limits
      expect(resources.peakCPUUsage).toBeLessThan(80); // 80% max
      expect(resources.peakMemoryUsage).toBeLessThan(85); // 85% max
      expect(resources.peakDatabaseConnections).toBeLessThan(50); // Connection limit
      
      // Check for resource spikes
      expect(resources.cpuSpikes).toHaveLength(0);
      expect(resources.memoryLeaks.detected).toBe(false);
    });
  });
});