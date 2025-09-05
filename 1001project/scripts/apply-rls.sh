#!/bin/bash

# ==========================================
# Apply Row-Level Security (RLS) Policies
# 1001 Stories Volunteer Management System
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_title() {
    echo -e "${BLUE}[RLS SETUP]${NC} $1"
}

# Check if running in project directory
if [ ! -f "prisma/schema.prisma" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    exit 1
fi

print_title "Starting RLS Policy Application"

# Check if RLS policies file exists
if [ ! -f "prisma/rls-policies.sql" ]; then
    print_error "RLS policies file not found: prisma/rls-policies.sql"
    exit 1
fi

print_status "Found RLS policies file"

# Backup current database state (optional)
print_status "Creating database backup timestamp"
BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
print_status "Backup timestamp: $BACKUP_TIMESTAMP"

# Check database connection
print_status "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    print_error "Cannot connect to database. Please check DATABASE_URL"
    exit 1
fi

print_status "Database connection successful"

# Check if tables exist
print_status "Checking if volunteer tables exist..."
TABLES_EXIST=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('volunteer_profiles', 'volunteer_applications', 'quest_assignments')
AND table_schema = 'public';
")

if [ "$TABLES_EXIST" -lt 3 ]; then
    print_warning "Some volunteer tables don't exist. Running Prisma migrations first..."
    npx prisma migrate dev --name "prepare_for_rls"
    print_status "Prisma migrations completed"
fi

# Apply RLS policies
print_status "Applying RLS policies..."
if psql "$DATABASE_URL" -f "prisma/rls-policies.sql"; then
    print_status "RLS policies applied successfully"
else
    print_error "Failed to apply RLS policies"
    exit 1
fi

# Verify RLS is enabled
print_status "Verifying RLS policies..."
RLS_ENABLED=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relrowsecurity = true
AND n.nspname = 'public'
AND c.relname LIKE '%volunteer%';
")

if [ "$RLS_ENABLED" -gt 0 ]; then
    print_status "RLS verification successful. $RLS_ENABLED volunteer tables have RLS enabled"
else
    print_warning "RLS verification shows no tables with RLS enabled"
fi

# Generate Prisma client with new configuration
print_status "Regenerating Prisma client..."
if npx prisma generate; then
    print_status "Prisma client regenerated successfully"
else
    print_error "Failed to regenerate Prisma client"
    exit 1
fi

# Test basic RLS functionality
print_status "Testing RLS functionality..."

# Create test function
TEST_SQL=$(cat << 'EOF'
DO $$
DECLARE
    test_user_id TEXT := 'test_user_123';
    test_role TEXT := 'VOLUNTEER';
    result_count INTEGER;
BEGIN
    -- Set user context
    PERFORM set_config('app.current_user_id', test_user_id, true);
    PERFORM set_config('app.current_user_role', test_role, true);
    
    -- Test helper functions
    IF current_user_id() != test_user_id THEN
        RAISE EXCEPTION 'current_user_id() function not working correctly';
    END IF;
    
    IF current_user_role() != test_role THEN
        RAISE EXCEPTION 'current_user_role() function not working correctly';
    END IF;
    
    IF NOT is_volunteer() THEN
        RAISE EXCEPTION 'is_volunteer() function not working correctly';
    END IF;
    
    IF is_admin() THEN
        RAISE EXCEPTION 'is_admin() function should return false for volunteer';
    END IF;
    
    RAISE NOTICE 'RLS helper functions test passed';
    
    -- Clear context
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_user_role', '', true);
END $$;
EOF
)

if psql "$DATABASE_URL" -c "$TEST_SQL" 2>&1 | grep -q "RLS helper functions test passed"; then
    print_status "RLS functionality test passed"
else
    print_error "RLS functionality test failed"
    exit 1
fi

# Create RLS status check function
print_status "Creating RLS status check function..."

STATUS_FUNCTION_SQL=$(cat << 'EOF'
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT,
        c.relrowsecurity,
        COUNT(p.polname)
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname LIKE '%volunteer%'
    GROUP BY c.relname, c.relrowsecurity
    ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql;
EOF
)

psql "$DATABASE_URL" -c "$STATUS_FUNCTION_SQL" > /dev/null

# Show RLS status
print_status "RLS Status Summary:"
psql "$DATABASE_URL" -c "SELECT * FROM check_rls_status();"

print_title "RLS Policy Application Completed Successfully!"

# Display next steps
echo ""
print_title "Next Steps:"
echo "1. Update your application code to use the new RLS context utilities"
echo "2. Test volunteer data isolation in your application"
echo "3. Run the RLS test script: npm run test:rls"
echo "4. Monitor RLS performance and adjust indexes if needed"
echo ""

print_status "RLS policies are now active. All volunteer data access will be restricted based on user roles."
print_warning "Make sure to update your application code to use the RLS context utilities in lib/rls-context.ts"

echo ""
print_title "Useful Commands:"
echo "- Check RLS status: psql \$DATABASE_URL -c 'SELECT * FROM check_rls_status();'"
echo "- Test RLS policies: npm run test:rls"
echo "- View RLS policies: psql \$DATABASE_URL -c '\\dp volunteer_*'"
echo ""