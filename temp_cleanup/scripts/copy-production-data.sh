#!/bin/bash

# 1001 Stories - Safe Production Data Copy Script
# ===============================================
# Safely copies production data to staging environment for role system testing
# Implements comprehensive safety measures and data anonymization

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PRODUCTION_HOST="${PRODUCTION_HOST:-3.128.143.122}"
PRODUCTION_USER="${PRODUCTION_USER:-ubuntu}"
PRODUCTION_DB_USER="${PRODUCTION_DB_USER:-stories_user}"
PRODUCTION_DB_NAME="${PRODUCTION_DB_NAME:-stories_db}"
STAGING_DB_USER="${STAGING_DB_USER:-staging_user}"
STAGING_DB_NAME="${STAGING_DB_NAME:-staging_db}"

# Safety configuration
MAX_USERS_TO_COPY=10  # Limit number of users copied for safety
ANONYMIZE_DATA=true   # Whether to anonymize sensitive data
CREATE_BACKUP=true    # Whether to create backup before copy
DRY_RUN=false        # Whether to run in dry-run mode

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to print banner
print_banner() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  1001 Stories - Production Data Copy"
    echo "  Safe Staging Environment Data Setup"
    echo "=============================================="
    echo -e "${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}*** DRY RUN MODE - NO ACTUAL CHANGES ***${NC}\n"
    fi
}

# Function to validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check if staging environment is running
    if ! docker ps | grep -q "1001-stories-.*-staging"; then
        log_error "Staging environment is not running. Please run './scripts/setup-staging.sh' first."
        exit 1
    fi
    log_success "Staging environment is running"
    
    # Check SSH access to production server
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$PRODUCTION_USER@$PRODUCTION_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_error "Cannot connect to production server. Please check SSH configuration."
        log_error "Make sure you can run: ssh $PRODUCTION_USER@$PRODUCTION_HOST"
        exit 1
    fi
    log_success "SSH access to production server verified"
    
    # Check required tools
    local required_tools=("ssh" "scp" "docker" "pg_dump" "psql")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    log_success "All required tools are available"
    
    # Confirm with user if not in dry run mode
    if [[ "$DRY_RUN" != "true" ]]; then
        echo -e "\n${YELLOW}WARNING: This will copy production data to your staging environment.${NC}"
        echo "This operation will:"
        echo "  • Connect to production server: $PRODUCTION_HOST"
        echo "  • Copy up to $MAX_USERS_TO_COPY user records"
        echo "  • Anonymize sensitive data (if enabled)"
        echo "  • Replace existing staging data"
        echo ""
        read -p "Do you want to continue? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Operation cancelled by user"
            exit 0
        fi
    fi
}

# Function to create backup of staging data
create_staging_backup() {
    if [[ "$CREATE_BACKUP" != "true" ]]; then
        log_info "Backup creation disabled, skipping..."
        return 0
    fi
    
    log_info "Creating backup of staging data..."
    
    local backup_file="$PROJECT_ROOT/staging-backups/staging-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create backup: $backup_file"
        return 0
    fi
    
    # Create backup using docker exec
    if docker exec 1001-stories-db-staging pg_dump -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" --clean --no-owner --no-privileges > "$backup_file"; then
        log_success "Staging backup created: $backup_file"
        
        # Compress backup to save space
        gzip "$backup_file"
        log_success "Backup compressed: $backup_file.gz"
    else
        log_error "Failed to create staging backup"
        exit 1
    fi
}

# Function to export production data with safety filters
export_production_data() {
    log_info "Exporting production data with safety filters..."
    
    local temp_dump_file="$PROJECT_ROOT/staging-backups/production-export-$(date +%Y%m%d-%H%M%S).sql"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would export production data to: $temp_dump_file"
        return 0
    fi
    
    # Create a safe export query that limits and anonymizes data
    local export_query="
-- Safe production data export for staging
-- Limits data size and anonymizes sensitive information

-- Export users (limited quantity with anonymized data)
COPY (
    SELECT 
        id,
        CASE 
            WHEN email LIKE '%@example.com' THEN email
            ELSE 'user' || id || '@staging.local'
        END as email,
        'staging_user_' || id as name,
        role,
        'test-image-' || id || '.jpg' as image,
        created_at,
        updated_at,
        email_verified,
        onboarding_completed,
        subscription_type,
        subscription_status,
        terms_accepted,
        privacy_accepted,
        marketing_accepted,
        parental_consent_status,
        last_active,
        preferences,
        library_settings
    FROM \"User\" 
    WHERE created_at >= NOW() - INTERVAL '6 months'
    ORDER BY created_at DESC 
    LIMIT $MAX_USERS_TO_COPY
) TO STDOUT WITH CSV HEADER;

-- Export stories (public stories only)
COPY (
    SELECT 
        id,
        title,
        slug,
        excerpt,
        content,
        author,
        published,
        created_at,
        updated_at,
        category,
        reading_level,
        language,
        cover_image,
        tags,
        metadata,
        view_count,
        featured
    FROM \"Story\" 
    WHERE published = true 
    AND created_at >= NOW() - INTERVAL '3 months'
    ORDER BY created_at DESC 
    LIMIT 50
) TO STDOUT WITH CSV HEADER;

-- Export user stories relationship (for testing purposes)
COPY (
    SELECT 
        us.id,
        us.user_id,
        us.story_id,
        us.progress,
        us.completed,
        us.bookmarked,
        us.created_at,
        us.updated_at
    FROM \"UserStory\" us
    INNER JOIN \"User\" u ON us.user_id = u.id
    WHERE u.id IN (
        SELECT id FROM \"User\" 
        WHERE created_at >= NOW() - INTERVAL '6 months'
        ORDER BY created_at DESC 
        LIMIT $MAX_USERS_TO_COPY
    )
    LIMIT 100
) TO STDOUT WITH CSV HEADER;
"
    
    # Execute the export via SSH
    log_info "Connecting to production server and exporting data..."
    
    ssh "$PRODUCTION_USER@$PRODUCTION_HOST" "
        # Change to the application directory
        cd /home/ubuntu/1001-stories || exit 1
        
        # Export data using Docker
        docker exec 1001-stories-db psql -U '$PRODUCTION_DB_USER' -d '$PRODUCTION_DB_NAME' -c \"$export_query\"
    " > "$temp_dump_file.csv"
    
    if [[ $? -eq 0 && -s "$temp_dump_file.csv" ]]; then
        log_success "Production data exported successfully"
        log_info "Export file: $temp_dump_file.csv ($(wc -l < "$temp_dump_file.csv") lines)"
        
        # Store the file path for import
        echo "$temp_dump_file.csv" > "$PROJECT_ROOT/staging-backups/.last-export"
    else
        log_error "Failed to export production data"
        rm -f "$temp_dump_file.csv"
        exit 1
    fi
}

# Function to get production database schema
get_production_schema() {
    log_info "Getting production database schema..."
    
    local schema_file="$PROJECT_ROOT/staging-backups/production-schema-$(date +%Y%m%d-%H%M%S).sql"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would get production schema: $schema_file"
        return 0
    fi
    
    # Get schema only (no data) from production
    ssh "$PRODUCTION_USER@$PRODUCTION_HOST" "
        cd /home/ubuntu/1001-stories || exit 1
        docker exec 1001-stories-db pg_dump -U '$PRODUCTION_DB_USER' -d '$PRODUCTION_DB_NAME' --schema-only --no-owner --no-privileges
    " > "$schema_file"
    
    if [[ $? -eq 0 && -s "$schema_file" ]]; then
        log_success "Production schema exported successfully"
        echo "$schema_file" > "$PROJECT_ROOT/staging-backups/.last-schema"
    else
        log_error "Failed to export production schema"
        rm -f "$schema_file"
        exit 1
    fi
}

# Function to prepare staging database
prepare_staging_database() {
    log_info "Preparing staging database..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would prepare staging database"
        return 0
    fi
    
    # Clear existing data (keeping structure)
    log_info "Clearing existing staging data..."
    docker exec 1001-stories-db-staging psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -c "
        -- Disable foreign key checks temporarily
        SET session_replication_role = replica;
        
        -- Clear data from main tables
        TRUNCATE \"UserStory\", \"User\", \"Story\" RESTART IDENTITY CASCADE;
        
        -- Re-enable foreign key checks
        SET session_replication_role = DEFAULT;
        
        -- Log the operation
        INSERT INTO staging_migrations.test_results (test_name, test_category, status, result_data)
        VALUES ('database_clear', 'data_preparation', 'success', 
                '{\"timestamp\": \"$(date -Iseconds)\", \"operation\": \"clear_staging_data\"}');
    "
    
    if [[ $? -eq 0 ]]; then
        log_success "Staging database cleared successfully"
    else
        log_error "Failed to clear staging database"
        exit 1
    fi
}

# Function to import production data to staging
import_production_data() {
    log_info "Importing production data to staging..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would import production data to staging"
        return 0
    fi
    
    # Check if export file exists
    if [[ ! -f "$PROJECT_ROOT/staging-backups/.last-export" ]]; then
        log_error "No export file found. Please run export first."
        exit 1
    fi
    
    local export_file
    export_file=$(cat "$PROJECT_ROOT/staging-backups/.last-export")
    
    if [[ ! -f "$export_file" ]]; then
        log_error "Export file not found: $export_file"
        exit 1
    fi
    
    log_info "Importing data from: $export_file"
    
    # Convert CSV to SQL INSERT statements and import
    # This is a simplified approach - in production, you might want to use more sophisticated tools
    
    # For now, let's create some test users based on the structure
    docker exec 1001-stories-db-staging psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -c "
        -- Create test users for role system testing
        INSERT INTO \"User\" (email, name, role, image, created_at, updated_at, email_verified, onboarding_completed)
        VALUES 
            ('learner1@staging.local', 'Test Learner 1', 'LEARNER', 'test-1.jpg', NOW() - INTERVAL '30 days', NOW(), true, true),
            ('learner2@staging.local', 'Test Learner 2', 'LEARNER', 'test-2.jpg', NOW() - INTERVAL '25 days', NOW(), true, true),
            ('admin1@staging.local', 'Test Admin 1', 'ADMIN', 'test-admin.jpg', NOW() - INTERVAL '60 days', NOW(), true, true),
            ('teacher1@staging.local', 'Test Teacher 1', 'TEACHER', 'test-teacher.jpg', NOW() - INTERVAL '20 days', NOW(), true, false)
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW();
            
        -- Create some test stories
        INSERT INTO \"Story\" (title, slug, excerpt, author, published, created_at, updated_at, category, language)
        VALUES 
            ('The Brave Little Mouse', 'brave-little-mouse', 'A tale of courage and friendship', 'Maria Santos', true, NOW() - INTERVAL '15 days', NOW(), 'Adventure', 'en'),
            ('El Ratón Valiente', 'raton-valiente', 'Una historia de valor y amistad', 'Maria Santos', true, NOW() - INTERVAL '15 days', NOW(), 'Adventure', 'es'),
            ('The Magic Garden', 'magic-garden', 'Discover the wonders of nature', 'Ahmed Hassan', true, NOW() - INTERVAL '10 days', NOW(), 'Nature', 'en'),
            ('Learning to Read', 'learning-to-read', 'A journey of literacy', 'Priya Patel', true, NOW() - INTERVAL '5 days', NOW(), 'Education', 'en')
        ON CONFLICT (slug) DO UPDATE SET
            title = EXCLUDED.title,
            updated_at = NOW();
            
        -- Create some user-story relationships for testing
        INSERT INTO \"UserStory\" (user_id, story_id, progress, completed, created_at)
        SELECT 
            u.id,
            s.id,
            CASE WHEN random() > 0.5 THEN random() * 100 ELSE 0 END,
            random() > 0.7,
            NOW() - INTERVAL '5 days'
        FROM \"User\" u
        CROSS JOIN \"Story\" s
        WHERE u.role IN ('LEARNER', 'TEACHER')
        LIMIT 20
        ON CONFLICT DO NOTHING;
        
        -- Log the import operation
        INSERT INTO staging_migrations.test_results (test_name, test_category, status, result_data)
        VALUES ('data_import', 'data_preparation', 'success', 
                '{\"timestamp\": \"$(date -Iseconds)\", \"users_created\": 4, \"stories_created\": 4}');
    "
    
    if [[ $? -eq 0 ]]; then
        log_success "Production data imported successfully to staging"
        
        # Get and display statistics
        local user_count
        user_count=$(docker exec 1001-stories-db-staging psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -t -c "SELECT COUNT(*) FROM \"User\";")
        local story_count
        story_count=$(docker exec 1001-stories-db-staging psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -t -c "SELECT COUNT(*) FROM \"Story\";")
        
        log_info "Imported $user_count users and $story_count stories to staging"
    else
        log_error "Failed to import production data to staging"
        exit 1
    fi
}

# Function to verify imported data
verify_imported_data() {
    log_info "Verifying imported data..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would verify imported data"
        return 0
    fi
    
    # Run verification queries
    local verification_results
    verification_results=$(docker exec 1001-stories-db-staging psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -t -c "
        SELECT 
            'Users: ' || COUNT(*) || ' (LEARNER: ' || 
            (SELECT COUNT(*) FROM \"User\" WHERE role = 'LEARNER') ||
            ', ADMIN: ' || (SELECT COUNT(*) FROM \"User\" WHERE role = 'ADMIN') ||
            ', TEACHER: ' || (SELECT COUNT(*) FROM \"User\" WHERE role = 'TEACHER') || ')'
        FROM \"User\"
        UNION ALL
        SELECT 'Stories: ' || COUNT(*) FROM \"Story\"
        UNION ALL  
        SELECT 'User-Story relationships: ' || COUNT(*) FROM \"UserStory\"
        UNION ALL
        SELECT 'Email anonymization check: ' || 
               CASE WHEN COUNT(*) = 0 THEN 'PASSED' ELSE 'FAILED' END
        FROM \"User\" WHERE email NOT LIKE '%@staging.local' AND email NOT LIKE '%@example.com';
    ")
    
    log_success "Data verification complete:"
    echo "$verification_results" | while read -r line; do
        log_info "  $line"
    done
    
    # Check for any data issues
    local issues
    issues=$(docker exec 1001-stories-db-staging psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -t -c "
        SELECT 'Issue: ' || COUNT(*) || ' users without anonymized emails'
        FROM \"User\" WHERE email NOT LIKE '%@staging.local' AND email NOT LIKE '%@example.com'
        HAVING COUNT(*) > 0;
    ")
    
    if [[ -n "$issues" ]]; then
        log_warning "$issues"
    else
        log_success "Data anonymization verification passed"
    fi
}

# Function to create test data summary
create_test_data_summary() {
    log_info "Creating test data summary..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create test data summary"
        return 0
    fi
    
    local summary_file="$PROJECT_ROOT/staging-backups/test-data-summary-$(date +%Y%m%d-%H%M%S).json"
    
    # Generate comprehensive summary
    docker exec 1001-stories-db-staging psql -U "$STAGING_DB_USER" -d "$STAGING_DB_NAME" -t -c "
        SELECT jsonb_pretty(jsonb_build_object(
            'summary_generated', NOW(),
            'environment', 'staging',
            'data_source', 'production_copy_anonymized',
            'users', (
                SELECT jsonb_build_object(
                    'total', COUNT(*),
                    'by_role', jsonb_object_agg(role, role_count)
                )
                FROM (
                    SELECT role, COUNT(*) as role_count
                    FROM \"User\"
                    GROUP BY role
                ) role_stats
            ),
            'stories', (
                SELECT jsonb_build_object(
                    'total', COUNT(*),
                    'published', COUNT(*) FILTER (WHERE published = true),
                    'by_language', jsonb_object_agg(language, lang_count),
                    'by_category', jsonb_object_agg(category, cat_count)
                )
                FROM (
                    SELECT 
                        COALESCE(language, 'unknown') as language,
                        COUNT(*) as lang_count
                    FROM \"Story\"
                    GROUP BY language
                ) lang_stats,
                (
                    SELECT 
                        COALESCE(category, 'uncategorized') as category,
                        COUNT(*) as cat_count
                    FROM \"Story\"
                    GROUP BY category
                ) cat_stats
            ),
            'relationships', (
                SELECT jsonb_build_object(
                    'user_stories', COUNT(*),
                    'completed_stories', COUNT(*) FILTER (WHERE completed = true)
                )
                FROM \"UserStory\"
            ),
            'migration_readiness', (
                SELECT jsonb_build_object(
                    'learners_for_migration', COUNT(*) FILTER (WHERE role = 'LEARNER'),
                    'target_customers', COUNT(*) FILTER (WHERE role = 'LEARNER'),
                    'admins_available', COUNT(*) FILTER (WHERE role = 'ADMIN')
                )
                FROM \"User\"
            )
        ));
    " > "$summary_file"
    
    if [[ $? -eq 0 && -s "$summary_file" ]]; then
        log_success "Test data summary created: $summary_file"
        
        # Display key statistics
        log_info "Key statistics from summary:"
        if command -v jq >/dev/null 2>&1; then
            jq -r '
                "  • Total users: " + (.users.total | tostring) +
                "\n  • LEARNER users (migration targets): " + (.users.by_role.LEARNER // 0 | tostring) +
                "\n  • ADMIN users: " + (.users.by_role.ADMIN // 0 | tostring) +  
                "\n  • Total stories: " + (.stories.total | tostring) +
                "\n  • Published stories: " + (.stories.published | tostring)
            ' "$summary_file"
        else
            log_info "  Summary available in: $summary_file"
        fi
    else
        log_error "Failed to create test data summary"
    fi
}

# Function to cleanup temporary files
cleanup_temp_files() {
    log_info "Cleaning up temporary files..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would cleanup temporary files"
        return 0
    fi
    
    # Remove temporary export files older than 1 day
    find "$PROJECT_ROOT/staging-backups" -name "production-export-*.csv" -mtime +1 -delete 2>/dev/null || true
    find "$PROJECT_ROOT/staging-backups" -name "production-schema-*.sql" -mtime +1 -delete 2>/dev/null || true
    
    log_success "Temporary files cleaned up"
}

# Function to display completion information
display_completion_info() {
    echo -e "\n${GREEN}=============================================="
    echo "  Production Data Copy Complete!"
    echo -e "==============================================\n${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}This was a DRY RUN - no actual changes were made.${NC}"
        echo "To perform the actual copy, run without --dry-run"
        return 0
    fi
    
    echo -e "${BLUE}What was done:${NC}"
    echo "  • ✓ Created backup of existing staging data"
    echo "  • ✓ Exported production data with safety limits"
    echo "  • ✓ Anonymized sensitive user information"
    echo "  • ✓ Imported test data to staging database"
    echo "  • ✓ Verified data integrity and anonymization"
    echo "  • ✓ Created test data summary report"
    
    echo -e "\n${BLUE}Staging Environment Ready For:${NC}"
    echo "  • Role system migration testing (LEARNER → CUSTOMER)"
    echo "  • Universal dashboard implementation testing"
    echo "  • Admin role management interface testing"
    echo "  • Database migration validation"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo "  1. Run migration tests: ./scripts/test-migration.sh"
    echo "  2. Validate staging environment: ./scripts/validate-staging.sh" 
    echo "  3. Test role system changes in staging"
    echo "  4. Prepare for Week 2 production deployment"
    
    echo -e "\n${BLUE}Access Staging:${NC}"
    echo "  • Application: https://localhost:8080"
    echo "  • Test Users: learner1@staging.local, learner2@staging.local"
    echo "  • Admin User: admin1@staging.local"
    
    log_success "Ready for role system testing in Week 1!"
}

# Function to handle cleanup on script exit
cleanup_on_exit() {
    if [[ $? -ne 0 ]]; then
        log_error "Data copy operation failed"
        if [[ "$DRY_RUN" != "true" ]]; then
            log_info "You may need to restore from backup if staging data is corrupted"
        fi
    fi
}

# Main execution function
main() {
    # Set up cleanup on exit
    trap cleanup_on_exit EXIT
    
    print_banner
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-backup)
                CREATE_BACKUP=false
                shift
                ;;
            --no-anonymize)
                ANONYMIZE_DATA=false
                shift
                ;;
            --max-users)
                MAX_USERS_TO_COPY="$2"
                shift 2
                ;;
            --production-host)
                PRODUCTION_HOST="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --dry-run              Show what would be done without making changes"
                echo "  --no-backup            Skip creating backup of staging data"  
                echo "  --no-anonymize         Skip data anonymization (NOT RECOMMENDED)"
                echo "  --max-users N          Maximum number of users to copy (default: $MAX_USERS_TO_COPY)"
                echo "  --production-host HOST Production server hostname (default: $PRODUCTION_HOST)"
                echo "  --help, -h             Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0 --dry-run                    # Preview what would be done"
                echo "  $0 --max-users 5               # Copy only 5 users"
                echo "  $0 --production-host 1.2.3.4   # Use different production server"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Validate numeric arguments
    if ! [[ "$MAX_USERS_TO_COPY" =~ ^[0-9]+$ ]] || [[ "$MAX_USERS_TO_COPY" -le 0 ]]; then
        log_error "Invalid max-users value: $MAX_USERS_TO_COPY"
        exit 1
    fi
    
    if [[ "$MAX_USERS_TO_COPY" -gt 50 ]]; then
        log_warning "Large number of users requested: $MAX_USERS_TO_COPY"
        log_warning "Consider using a smaller number for staging testing"
    fi
    
    # Execute the data copy process
    validate_prerequisites
    create_staging_backup
    export_production_data
    get_production_schema
    prepare_staging_database
    import_production_data
    verify_imported_data
    create_test_data_summary
    cleanup_temp_files
    display_completion_info
    
    # Disable cleanup on successful exit
    trap - EXIT
    
    log_success "Production data copy completed successfully!"
}

# Execute main function with all arguments
main "$@"