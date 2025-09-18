# Production Deployment Plan: v3-ui-overhaul
**Date:** 2025-09-05  
**Target Server:** AWS Lightsail 3.128.143.122  
**Current Branch:** feature/role-system-v2 → **Target Branch:** v3-ui-overhaul

## 🚨 CRITICAL CHANGES
- **Database Schema:** Major changes requiring migration
- **Feature Removal:** E-commerce features completely removed
- **New Features:** ESL learning system, Seeds of Empowerment theme
- **User Roles:** New enum values (CUSTOMER, EDITOR, PUBLISHER)
- **User Model:** Added tokenVersion field

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Backup Current State (CRITICAL)
```bash
# SSH into server
ssh -i ~/Downloads/1001project.pem ubuntu@3.128.143.122

# Create timestamped backup directory
sudo mkdir -p /home/ubuntu/backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups/$(date +%Y%m%d_%H%M%S)"

# Backup database
docker exec 1001-stories-db pg_dump -U postgres stories_db > $BACKUP_DIR/database_backup.sql

# Backup uploaded files
sudo cp -r /home/ubuntu/1001project/public/books $BACKUP_DIR/
sudo cp -r /home/ubuntu/1001project/public/books-upload $BACKUP_DIR/

# Backup current code
cd /home/ubuntu/1001project
git rev-parse HEAD > $BACKUP_DIR/current_commit.txt
sudo tar -czf $BACKUP_DIR/code_backup.tar.gz . --exclude=node_modules --exclude=.next

# Backup environment file
sudo cp /home/ubuntu/1001project/.env $BACKUP_DIR/.env.backup

# Backup Docker volumes
docker run --rm -v 1001-stories_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar -czf /backup/postgres_volume.tar.gz -C /data .
```

### 2. Verify Backups
```bash
ls -la $BACKUP_DIR/
# Should see:
# - database_backup.sql
# - books/
# - books-upload/
# - code_backup.tar.gz
# - .env.backup
# - current_commit.txt
# - postgres_volume.tar.gz
```

### 3. Test Database Migration Locally
```bash
# On local machine
git checkout v3-ui-overhaul
npm install

# Test migration with production-like data
DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/test_db" npx prisma migrate dev --name v3_migration
```

### 4. Prepare Migration Scripts
Create these scripts locally before deployment:

**migration-check.sql:**
```sql
-- Check current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User';

-- Check for data that might conflict
SELECT COUNT(*) FROM "Order";
SELECT COUNT(*) FROM "CartItem";
SELECT COUNT(*) FROM "Subscription";
```

### 5. Environment Variables Preparation
Ensure these are ready:
```env
# Required for v3
DATABASE_URL="postgresql://postgres:your_password@db:5432/stories_db"
NEXTAUTH_URL="https://1001stories.seedsofempowerment.org"
NEXTAUTH_SECRET="your-production-secret"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@1001stories.org"

# New variables for v3
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://1001stories.seedsofempowerment.org"
```

---

## 🚀 DEPLOYMENT PROCESS

### Phase 1: Preparation (5 minutes)
```bash
# 1. SSH into server
ssh -i ~/Downloads/1001project.pem ubuntu@3.128.143.122

# 2. Set maintenance mode (create maintenance page)
cd /home/ubuntu/1001project
echo '<html><body><h1>System Maintenance</h1><p>We'll be back shortly.</p></body></html>' | sudo tee maintenance.html

# 3. Configure nginx to show maintenance page
sudo nano /etc/nginx/sites-available/default
# Add at the beginning of server block:
# if (-f $document_root/maintenance.html) {
#     return 503;
# }
# error_page 503 @maintenance;
# location @maintenance {
#     rewrite ^(.*)$ /maintenance.html break;
# }

sudo nginx -t && sudo systemctl reload nginx
```

### Phase 2: Stop Services (2 minutes)
```bash
# Stop application container only (keep DB running)
docker-compose stop app

# Verify database is still running
docker ps | grep 1001-stories-db
```

### Phase 3: Update Code (5 minutes)
```bash
cd /home/ubuntu/1001project

# Stash any local changes
git stash save "Production changes before v3 deployment"

# Fetch latest changes
git fetch origin

# Checkout v3-ui-overhaul
git checkout v3-ui-overhaul
git pull origin v3-ui-overhaul

# Restore production files
git checkout stash -- .env
cp -r $BACKUP_DIR/books public/
cp -r $BACKUP_DIR/books-upload public/

# Verify critical files
ls -la public/books/
cat .env | grep DATABASE_URL
```

### Phase 4: Database Migration (10 minutes)
```bash
# 1. Generate Prisma client
docker-compose run --rm app npx prisma generate

# 2. Create migration SQL
docker-compose run --rm app npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script > migration.sql

# 3. Review migration
cat migration.sql

# 4. Apply migration with backup point
docker exec -i 1001-stories-db psql -U postgres stories_db << EOF
BEGIN;
SAVEPOINT before_migration;

-- Apply migration
$(cat migration.sql)

-- Verify critical tables
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Story";

-- If everything looks good, commit
COMMIT;
-- If issues, rollback: ROLLBACK TO before_migration;
EOF

# 5. Run Prisma migrate deploy
docker-compose run --rm app npx prisma migrate deploy
```

### Phase 5: Build and Deploy (10 minutes)
```bash
# 1. Build new image
docker-compose build app

# 2. Start services
docker-compose up -d

# 3. Check logs
docker-compose logs -f app

# 4. Wait for "Ready on http://localhost:3000"
```

### Phase 6: Verification (5 minutes)
```bash
# 1. Test health endpoint
curl -I http://localhost:3000/api/health

# 2. Check database connectivity
docker-compose run --rm app npx prisma db pull

# 3. Verify uploaded files are accessible
curl -I http://localhost:3000/books/sample.pdf

# 4. Remove maintenance mode
rm maintenance.html
sudo systemctl reload nginx

# 5. Test production URL
curl -I https://1001stories.seedsofempowerment.org
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Functional Tests
- [ ] Homepage loads correctly
- [ ] Login with email magic link works
- [ ] User dashboard accessible
- [ ] Stories/books are viewable
- [ ] Uploaded PDFs are accessible
- [ ] ESL features are working
- [ ] Seeds of Empowerment theme displays

### 2. Database Verification
```sql
-- Check new schema
SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'tokenVersion';

-- Verify user roles
SELECT role, COUNT(*) FROM "User" GROUP BY role;

-- Check for orphaned data
SELECT COUNT(*) FROM "Story" WHERE "authorId" NOT IN (SELECT id FROM "User");
```

### 3. Performance Checks
```bash
# Check memory usage
docker stats --no-stream

# Check disk space
df -h

# Monitor logs for errors
docker-compose logs app | grep ERROR
```

---

## 🔄 ROLLBACK PROCEDURE

### Immediate Rollback (if deployment fails)
```bash
# 1. Stop failed deployment
docker-compose down

# 2. Restore code
cd /home/ubuntu/1001project
git checkout $(cat $BACKUP_DIR/current_commit.txt)

# 3. Restore database
docker exec -i 1001-stories-db psql -U postgres -c "DROP DATABASE stories_db;"
docker exec -i 1001-stories-db psql -U postgres -c "CREATE DATABASE stories_db;"
docker exec -i 1001-stories-db psql -U postgres stories_db < $BACKUP_DIR/database_backup.sql

# 4. Restore files
cp $BACKUP_DIR/.env.backup .env
cp -r $BACKUP_DIR/books public/
cp -r $BACKUP_DIR/books-upload public/

# 5. Rebuild and start
docker-compose build app
docker-compose up -d

# 6. Verify rollback
docker-compose logs app
curl -I https://1001stories.seedsofempowerment.org
```

### Database-Only Rollback
```bash
# If only database migration failed
docker exec -i 1001-stories-db psql -U postgres stories_db < $BACKUP_DIR/database_backup.sql
docker-compose restart app
```

---

## 🔧 TROUBLESHOOTING

### Common Issues and Solutions

1. **Migration Fails: "Column already exists"**
   ```sql
   -- Check and drop if needed
   ALTER TABLE "User" DROP COLUMN IF EXISTS "tokenVersion";
   ```

2. **Docker Build Fails: "No space left"**
   ```bash
   docker system prune -af
   docker volume prune -f
   ```

3. **App Won't Start: "Port already in use"**
   ```bash
   docker-compose down
   docker ps -aq | xargs docker stop
   docker-compose up -d
   ```

4. **Database Connection Refused**
   ```bash
   # Check database is running
   docker ps | grep db
   # Restart database
   docker-compose restart db
   # Wait 30 seconds
   sleep 30
   docker-compose restart app
   ```

5. **Nginx 502 Bad Gateway**
   ```bash
   # Check app is running
   docker ps | grep app
   # Check app logs
   docker-compose logs app
   # Restart everything
   docker-compose restart
   ```

---

## 📊 MONITORING POST-DEPLOYMENT

### First 24 Hours
- Monitor error logs every hour: `docker-compose logs app | grep ERROR`
- Check memory usage: `docker stats`
- Monitor database connections: `docker exec 1001-stories-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"`
- Check disk usage: `df -h`

### Key Metrics to Watch
- Response time: Should be < 500ms for homepage
- Error rate: Should be < 0.1%
- Database connections: Should be < 50 active
- Memory usage: Should be < 80% of available

---

## 📞 EMERGENCY CONTACTS

If deployment fails and rollback doesn't work:
1. Restore from AWS Lightsail snapshot (if available)
2. Contact AWS Support
3. Restore from backup directory: `$BACKUP_DIR`

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:
- [ ] All pages load without errors
- [ ] Users can log in and access dashboards
- [ ] Database queries execute successfully
- [ ] Uploaded files are accessible
- [ ] No critical errors in logs for 30 minutes
- [ ] Response times are acceptable (< 500ms)
- [ ] Memory usage is stable

---

## 📝 NOTES

- **Estimated Total Time:** 35-45 minutes
- **Estimated Downtime:** 15-20 minutes (with maintenance page)
- **Risk Level:** HIGH (major schema changes)
- **Recommended Time:** Low traffic period (early morning)
- **Required Access:** SSH key, sudo privileges, database passwords

**IMPORTANT:** 
- Always verify backups before proceeding
- Have rollback commands ready in another terminal
- Monitor logs continuously during deployment
- Test critical user flows immediately after deployment