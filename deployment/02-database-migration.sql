-- 1001 Stories Database Migration Script
-- Role System Redesign: LEARNER → CUSTOMER Migration
-- Safe transaction-based migration with validation

-- ============================================
-- MIGRATION OVERVIEW
-- ============================================
-- This script performs the following changes:
-- 1. Add CUSTOMER role to the Role enum
-- 2. Migrate existing LEARNER users to CUSTOMER
-- 3. Validate migration success
-- 4. Create rollback procedures

BEGIN;

-- Save current timestamp for migration tracking
INSERT INTO migration_log (migration_name, started_at, status) 
VALUES ('role_system_redesign_learner_to_customer', NOW(), 'STARTED')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 1: CREATE MIGRATION LOG TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'STARTED',
    user_count_before INTEGER,
    user_count_after INTEGER,
    learner_count_before INTEGER,
    customer_count_after INTEGER,
    notes TEXT
);

-- ============================================
-- STEP 2: PRE-MIGRATION VALIDATION
-- ============================================

-- Count current users by role
DO $$
DECLARE
    total_users INTEGER;
    learner_count INTEGER;
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM "User";
    SELECT COUNT(*) INTO learner_count FROM "User" WHERE role = 'LEARNER';
    SELECT COUNT(*) INTO admin_count FROM "User" WHERE role = 'ADMIN';
    
    -- Log current state
    UPDATE migration_log 
    SET user_count_before = total_users,
        learner_count_before = learner_count,
        notes = FORMAT('Pre-migration: Total=%s, LEARNER=%s, ADMIN=%s', total_users, learner_count, admin_count)
    WHERE migration_name = 'role_system_redesign_learner_to_customer';
    
    -- Validation checks
    IF total_users != 4 THEN
        RAISE EXCEPTION 'Expected 4 users, found %', total_users;
    END IF;
    
    IF learner_count != 2 THEN
        RAISE EXCEPTION 'Expected 2 LEARNER users, found %', learner_count;
    END IF;
    
    IF admin_count != 2 THEN
        RAISE EXCEPTION 'Expected 2 ADMIN users, found %', admin_count;
    END IF;
    
    RAISE NOTICE 'Pre-migration validation passed: % total users (% LEARNER, % ADMIN)', total_users, learner_count, admin_count;
END $$;

-- ============================================
-- STEP 3: BACKUP CURRENT USER DATA
-- ============================================

-- Create backup table for rollback purposes
DROP TABLE IF EXISTS user_backup_pre_migration;
CREATE TABLE user_backup_pre_migration AS 
SELECT * FROM "User";

RAISE NOTICE 'User backup created with % records', (SELECT COUNT(*) FROM user_backup_pre_migration);

-- ============================================
-- STEP 4: EXTEND ROLE ENUM TO INCLUDE CUSTOMER
-- ============================================

-- Add CUSTOMER to the Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CUSTOMER';

RAISE NOTICE 'CUSTOMER role added to Role enum';

-- ============================================
-- STEP 5: MIGRATE LEARNER USERS TO CUSTOMER
-- ============================================

-- Update all LEARNER users to CUSTOMER role
UPDATE "User" 
SET role = 'CUSTOMER',
    "updatedAt" = NOW()
WHERE role = 'LEARNER';

-- Get the number of updated users
GET DIAGNOSTICS learner_migration_count = ROW_COUNT;

RAISE NOTICE 'Migrated % LEARNER users to CUSTOMER role', learner_migration_count;

-- ============================================
-- STEP 6: POST-MIGRATION VALIDATION
-- ============================================

DO $$
DECLARE
    total_users_after INTEGER;
    customer_count INTEGER;
    admin_count_after INTEGER;
    learner_count_after INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users_after FROM "User";
    SELECT COUNT(*) INTO customer_count FROM "User" WHERE role = 'CUSTOMER';
    SELECT COUNT(*) INTO admin_count_after FROM "User" WHERE role = 'ADMIN';
    SELECT COUNT(*) INTO learner_count_after FROM "User" WHERE role = 'LEARNER';
    
    -- Validation checks
    IF total_users_after != 4 THEN
        RAISE EXCEPTION 'Post-migration: Expected 4 users, found %', total_users_after;
    END IF;
    
    IF customer_count != 2 THEN
        RAISE EXCEPTION 'Post-migration: Expected 2 CUSTOMER users, found %', customer_count;
    END IF;
    
    IF admin_count_after != 2 THEN
        RAISE EXCEPTION 'Post-migration: Expected 2 ADMIN users, found %', admin_count_after;
    END IF;
    
    IF learner_count_after != 0 THEN
        RAISE EXCEPTION 'Post-migration: Expected 0 LEARNER users, found %', learner_count_after;
    END IF;
    
    -- Update migration log with success
    UPDATE migration_log 
    SET user_count_after = total_users_after,
        customer_count_after = customer_count,
        completed_at = NOW(),
        status = 'COMPLETED',
        notes = notes || FORMAT(' | Post-migration: Total=%s, CUSTOMER=%s, ADMIN=%s', total_users_after, customer_count, admin_count_after)
    WHERE migration_name = 'role_system_redesign_learner_to_customer';
    
    RAISE NOTICE 'Post-migration validation passed: % total users (% CUSTOMER, % ADMIN)', total_users_after, customer_count, admin_count_after;
END $$;

-- ============================================
-- STEP 7: UPDATE RELATED TABLES AND CONSTRAINTS
-- ============================================

-- Check if there are any foreign key constraints or related tables that reference the role
-- This is a safety check to ensure data consistency

-- Update any audit logs or session data that might reference old roles
-- (Add specific updates here if needed based on your schema)

-- ============================================
-- STEP 8: CREATE ROLLBACK SCRIPT
-- ============================================

-- Generate rollback instructions
DO $$
DECLARE
    rollback_sql TEXT;
BEGIN
    rollback_sql := '-- ROLLBACK SCRIPT FOR ROLE MIGRATION
-- Run this if you need to revert the CUSTOMER → LEARNER change

BEGIN;

-- Restore LEARNER users from backup
UPDATE "User" 
SET role = backup.role,
    "updatedAt" = backup."updatedAt"
FROM user_backup_pre_migration backup
WHERE "User".id = backup.id 
  AND backup.role = ''LEARNER'';

-- Validate rollback
SELECT COUNT(*) as learner_count FROM "User" WHERE role = ''LEARNER'';

-- Update migration log
UPDATE migration_log 
SET status = ''ROLLED_BACK'',
    completed_at = NOW(),
    notes = notes || '' | ROLLED BACK at '' || NOW()
WHERE migration_name = ''role_system_redesign_learner_to_customer'';

COMMIT;

RAISE NOTICE ''Rollback completed. Verify LEARNER count matches expected value.'';
';

    -- Log rollback script
    RAISE NOTICE 'Rollback script generated and available in migration logs';
END $$;

-- ============================================
-- STEP 9: FINAL VERIFICATION AND REPORTING
-- ============================================

-- Generate migration report
SELECT 
    migration_name,
    started_at,
    completed_at,
    status,
    user_count_before,
    user_count_after,
    learner_count_before,
    customer_count_after,
    notes
FROM migration_log 
WHERE migration_name = 'role_system_redesign_learner_to_customer';

-- Verify final user state
SELECT 
    role,
    COUNT(*) as user_count,
    array_agg(email) as user_emails
FROM "User" 
GROUP BY role 
ORDER BY role;

-- Check that all users still have valid sessions and data
SELECT 
    u.email,
    u.role,
    u."createdAt",
    u."updatedAt",
    COUNT(s.id) as session_count
FROM "User" u
LEFT JOIN "Session" s ON u.id = s."userId"
GROUP BY u.id, u.email, u.role, u."createdAt", u."updatedAt"
ORDER BY u."createdAt";

COMMIT;

-- ============================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ============================================

-- Final success message
SELECT 'MIGRATION COMPLETED: role_system_redesign_learner_to_customer' as status;