-- Test Database Initialization Script
-- This script creates test users with password authentication

-- Create the users table if not exists (handled by Prisma migrations)
-- This script assumes Prisma migrations have been run

-- Insert test users with hashed passwords
-- Password for teacher@test.edu: Test123!
-- Password for student1@test.edu: Student123!
-- Password for student2@test.edu: Student123!
-- Password for admin@test.edu: Admin123!

DO $$
BEGIN
    -- Check if User table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        -- Delete existing test users if they exist
        DELETE FROM "User" WHERE email IN ('teacher@test.edu', 'student1@test.edu', 'student2@test.edu', 'admin@test.edu');
        
        -- Insert Teacher
        INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'teacher@test.edu',
            'Test Teacher',
            '$2b$10$47qz//ue.bzCx7s2lxOhsur8kDdWtBbNoW4wF0zh0y4KfbkyKrkAe', -- Test123!
            'TEACHER',
            NOW(),
            NOW(),
            NOW()
        );
        
        -- Insert Student 1
        INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'student1@test.edu',
            'Test Student 1',
            '$2b$10$vf2eX6Fzpy3mlqRS7bi9U.qp5T257k8hLPxhzqb385QEOahSd3d1.', -- Student123!
            'LEARNER',
            NOW(),
            NOW(),
            NOW()
        );
        
        -- Insert Student 2
        INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'student2@test.edu',
            'Test Student 2',
            '$2b$10$vf2eX6Fzpy3mlqRS7bi9U.qp5T257k8hLPxhzqb385QEOahSd3d1.', -- Student123!
            'LEARNER',
            NOW(),
            NOW(),
            NOW()
        );
        
        -- Insert Admin
        INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'admin@test.edu',
            'Test Admin',
            '$2b$10$HdKJCbZrPqNgW5xGTqrDce5p1wzNQp9eZhBxP1.eWxHxBz4XdJqYm', -- Admin123!
            'ADMIN',
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Test users created successfully';
        RAISE NOTICE 'Teacher: teacher@test.edu / Test123!';
        RAISE NOTICE 'Student1: student1@test.edu / Student123!';
        RAISE NOTICE 'Student2: student2@test.edu / Student123!';
        RAISE NOTICE 'Admin: admin@test.edu / Admin123!';
    ELSE
        RAISE NOTICE 'User table does not exist yet. Run Prisma migrations first.';
    END IF;
END $$;