-- Initialize PostgreSQL extensions for 1001 Stories
-- Educational platform optimizations

-- Create pg_stat_statements extension for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create pgcrypto for enhanced security functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create indexes for educational content optimization
-- These will be created after Prisma migrations

-- Set timezone for consistent educational scheduling
SET timezone = 'UTC';

-- Configure search path for educational schemas
-- ALTER DATABASE stories_db SET search_path TO public, extensions;

-- Grant necessary permissions for application
GRANT USAGE ON SCHEMA public TO stories_user;
GRANT CREATE ON SCHEMA public TO stories_user;