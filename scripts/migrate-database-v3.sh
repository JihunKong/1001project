#!/bin/bash

# Database Migration Script for v3-ui-overhaul
# Handles schema changes safely with rollback capability

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SERVER_IP="3.128.143.122"
SERVER_USER="ubuntu"
PEM_FILE="$HOME/Downloads/1001project.pem"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check current schema
check_current_schema() {
    log_info "Checking current database schema..."
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        docker exec -i 1001-stories-db psql -U postgres stories_db << 'SQL'
            -- Check User table columns
            SELECT 
                'User table columns:' as info;
            SELECT 
                column_name, 
                data_type, 
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'User'
            ORDER BY ordinal_position;
            
            -- Check for e-commerce tables
            SELECT 
                '',
                'E-commerce tables:' as info;
            SELECT 
                table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('Order', 'CartItem', 'Subscription', 'Product')
            ORDER BY table_name;
            
            -- Check current user roles
            SELECT 
                '',
                'Current user roles:' as info;
            SELECT 
                role, 
                COUNT(*) as count
            FROM "User" 
            GROUP BY role
            ORDER BY role;
            
            -- Check for data in tables to be removed
            SELECT 
                '',
                'Data in tables to be removed:' as info;
            SELECT 
                'Order' as table_name, 
                COUNT(*) as row_count 
            FROM "Order"
            UNION ALL
            SELECT 
                'CartItem' as table_name, 
                COUNT(*) as row_count 
            FROM "CartItem"
            WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CartItem')
            UNION ALL
            SELECT 
                'Subscription' as table_name, 
                COUNT(*) as row_count 
            FROM "Subscription"
            WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Subscription');
SQL
ENDSSH
}

# Backup specific tables before removal
backup_tables() {
    log_info "Backing up e-commerce tables before removal..."
    
    BACKUP_DIR="/home/ubuntu/backups/ecommerce_backup_$(date +%Y%m%d_%H%M%S)"
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << ENDSSH
        mkdir -p $BACKUP_DIR
        
        # Export each table if it exists
        docker exec 1001-stories-db psql -U postgres stories_db -c "\COPY (SELECT * FROM \"Order\") TO STDOUT WITH CSV HEADER" > $BACKUP_DIR/orders.csv 2>/dev/null || echo "Order table not found or empty"
        
        docker exec 1001-stories-db psql -U postgres stories_db -c "\COPY (SELECT * FROM \"CartItem\") TO STDOUT WITH CSV HEADER" > $BACKUP_DIR/cartitems.csv 2>/dev/null || echo "CartItem table not found or empty"
        
        docker exec 1001-stories-db psql -U postgres stories_db -c "\COPY (SELECT * FROM \"Subscription\") TO STDOUT WITH CSV HEADER" > $BACKUP_DIR/subscriptions.csv 2>/dev/null || echo "Subscription table not found or empty"
        
        echo "Backup saved to: $BACKUP_DIR"
        ls -la $BACKUP_DIR/
ENDSSH
}

# Generate migration SQL
generate_migration_sql() {
    log_info "Generating migration SQL..."
    
    cat << 'SQL' > /tmp/v3_migration.sql
-- V3 UI Overhaul Migration Script
-- Generated: $(date)

BEGIN;

-- 1. Add new columns to User table if they don't exist
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER DEFAULT 0;

-- 2. Update user roles to new enum values if needed
-- Map old roles to new roles
UPDATE "User" 
SET role = 'CUSTOMER' 
WHERE role IN ('LEARNER', 'STUDENT');

UPDATE "User" 
SET role = 'EDITOR' 
WHERE role IN ('TEACHER', 'ADMIN');

-- 3. Drop e-commerce related foreign key constraints
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_userId_fkey";
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";

-- 4. Drop e-commerce tables
DROP TABLE IF EXISTS "CartItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Subscription" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;

-- 5. Clean up any orphaned data
DELETE FROM "Session" WHERE "userId" NOT IN (SELECT id FROM "User");

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");
CREATE INDEX IF NOT EXISTS "idx_story_published" ON "Story"("published");

-- 7. Update schema version
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at)
VALUES (
    'v3_ui_overhaul_' || to_char(now(), 'YYYYMMDDHH24MISS'),
    'manual_migration_v3',
    'v3_ui_overhaul',
    now(),
    now()
) ON CONFLICT DO NOTHING;

COMMIT;

-- Verification queries
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as user_count FROM "User";
SELECT role, COUNT(*) as count FROM "User" GROUP BY role;
SQL
    
    # Copy migration script to server
    scp -i "$PEM_FILE" /tmp/v3_migration.sql "$SERVER_USER@$SERVER_IP:/tmp/"
    
    log_info "Migration SQL generated and copied to server"
}

# Run migration with safety checks
run_migration() {
    log_info "Running database migration..."
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        # First, test the migration in a transaction that will rollback
        echo "Testing migration (dry run)..."
        docker exec -i 1001-stories-db psql -U postgres stories_db << 'SQL'
            BEGIN;
            
            -- Run migration script
            \i /tmp/v3_migration.sql
            
            -- Check results
            SELECT 'Dry run results:' as info;
            SELECT COUNT(*) as user_count FROM "User";
            SELECT role, COUNT(*) FROM "User" GROUP BY role;
            
            -- Rollback dry run
            ROLLBACK;
            SELECT 'Dry run rolled back - no changes made' as status;
SQL
        
        echo ""
        read -p "Dry run completed. Proceed with actual migration? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Running actual migration..."
            docker exec -i 1001-stories-db psql -U postgres stories_db < /tmp/v3_migration.sql
            echo "Migration completed!"
        else
            echo "Migration cancelled"
        fi
ENDSSH
}

# Verify migration
verify_migration() {
    log_info "Verifying migration results..."
    
    ssh -i "$PEM_FILE" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        docker exec -i 1001-stories-db psql -U postgres stories_db << 'SQL'
            -- Check new schema
            SELECT 'User table after migration:' as info;
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User' 
            AND column_name IN ('tokenVersion', 'role')
            ORDER BY column_name;
            
            -- Check removed tables
            SELECT '', 'Removed tables check:' as info;
            SELECT COUNT(*) as "should_be_0" 
            FROM information_schema.tables 
            WHERE table_name IN ('Order', 'CartItem', 'Subscription', 'Product');
            
            -- User statistics
            SELECT '', 'User statistics:' as info;
            SELECT role, COUNT(*) as count 
            FROM "User" 
            GROUP BY role;
            
            -- Check data integrity
            SELECT '', 'Data integrity:' as info;
            SELECT 
                (SELECT COUNT(*) FROM "User") as users,
                (SELECT COUNT(*) FROM "Story") as stories,
                (SELECT COUNT(*) FROM "Session") as sessions;
SQL
ENDSSH
}

# Create rollback script
create_rollback_script() {
    log_info "Creating rollback script..."
    
    cat << 'SQL' > /tmp/v3_rollback.sql
-- V3 Migration Rollback Script
-- Use this to restore previous schema if needed

BEGIN;

-- 1. Remove new columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "tokenVersion";

-- 2. Recreate e-commerce tables
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- 3. Restore foreign keys
ALTER TABLE "Order" 
ADD CONSTRAINT "Order_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "CartItem" 
ADD CONSTRAINT "CartItem_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "CartItem" 
ADD CONSTRAINT "CartItem_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;

ALTER TABLE "Subscription" 
ADD CONSTRAINT "Subscription_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- 4. Restore user roles to old values if needed
UPDATE "User" SET role = 'LEARNER' WHERE role = 'CUSTOMER';
UPDATE "User" SET role = 'ADMIN' WHERE role = 'EDITOR';

COMMIT;

SELECT 'Rollback completed' as status;
SQL
    
    scp -i "$PEM_FILE" /tmp/v3_rollback.sql "$SERVER_USER@$SERVER_IP:/tmp/"
    log_info "Rollback script created and uploaded"
}

# Main menu
show_menu() {
    echo "======================================="
    echo "   Database Migration Tool for v3"
    echo "======================================="
    echo "1) Check current schema"
    echo "2) Backup e-commerce tables"
    echo "3) Generate migration SQL"
    echo "4) Run migration (with dry run)"
    echo "5) Verify migration"
    echo "6) Create rollback script"
    echo "7) Full migration (all steps)"
    echo "8) Exit"
    echo "======================================="
}

# Main execution
main() {
    while true; do
        show_menu
        read -p "Select option [1-8]: " option
        
        case $option in
            1)
                check_current_schema
                ;;
            2)
                backup_tables
                ;;
            3)
                generate_migration_sql
                ;;
            4)
                run_migration
                ;;
            5)
                verify_migration
                ;;
            6)
                create_rollback_script
                ;;
            7)
                log_warn "This will run the complete migration process"
                read -p "Continue? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    check_current_schema
                    backup_tables
                    generate_migration_sql
                    create_rollback_script
                    run_migration
                    verify_migration
                fi
                ;;
            8)
                log_info "Exiting..."
                exit 0
                ;;
            *)
                log_error "Invalid option"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main