-- Manual RLS Test Script
-- This script tests RLS policies manually in PostgreSQL

-- Set up test context for user_1 (volunteer)
SELECT set_config('app.current_user_id', 'user_1', false);
SELECT set_config('app.current_user_role', 'VOLUNTEER', false);

-- Test what user_1 can see
SELECT 'User 1 (VOLUNTEER) can see:' as info;
SELECT "userId", id FROM volunteer_profiles;

-- Change context to user_2 (volunteer)
SELECT set_config('app.current_user_id', 'user_2', false);
SELECT set_config('app.current_user_role', 'VOLUNTEER', false);

-- Test what user_2 can see
SELECT 'User 2 (VOLUNTEER) can see:' as info;
SELECT "userId", id FROM volunteer_profiles;

-- Change context to admin
SELECT set_config('app.current_user_id', 'admin_1', false);
SELECT set_config('app.current_user_role', 'ADMIN', false);

-- Test what admin can see
SELECT 'Admin can see:' as info;
SELECT "userId", id FROM volunteer_profiles;

-- Test the policy conditions manually
SELECT 
  "userId",
  current_setting('app.current_user_id') as current_id,
  current_setting('app.current_user_role') as current_role,
  ("userId" = current_setting('app.current_user_id')) as user_match,
  (current_setting('app.current_user_role') = 'ADMIN') as is_admin,
  (current_setting('app.current_user_role') = 'ADMIN' OR "userId" = current_setting('app.current_user_id')) as policy_match
FROM volunteer_profiles;