# 1001 Stories Zero-Downtime Deployment Guide

## Overview

This guide provides a comprehensive deployment strategy for the 1001 Stories role system redesign with zero-downtime implementation. The deployment migrates 2 LEARNER users to CUSTOMER role and introduces a universal dashboard system.

**Production Environment:**
- **Server**: AWS Lightsail 3.128.143.122 (Ubuntu 22.04)
- **Current Users**: 4 total (2 LEARNER → 2 CUSTOMER, 2 ADMIN)
- **Stack**: Docker Compose (nginx, app, postgres)
- **Strategy**: Blue-Green Deployment with Database Migration

## Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] SSH access to production server (PEM key available)
- [ ] Docker and Docker Compose installed
- [ ] At least 2GB free disk space
- [ ] Database backup capabilities verified
- [ ] Nginx SSL certificates valid

### Code Requirements
- [ ] New role system code tested locally
- [ ] Universal dashboard components complete
- [ ] Database migration scripts validated
- [ ] Playwright tests passing

### Backup Requirements
- [ ] Current database backup taken
- [ ] Docker configurations backed up
- [ ] SSL certificates backed up
- [ ] User data export available

## Deployment Timeline (60 Minutes)

### Phase 1: Infrastructure Assessment (5 minutes)
**Script**: `./01-assess-infrastructure.sh`

**Actions:**
- Check container health status
- Validate database connectivity
- Create comprehensive backup
- Document current state

**Success Criteria:**
- All containers report status
- Database responds to queries
- Backup file created and validated
- System resources within acceptable limits

**Rollback Trigger:**
- Database unreachable
- Critical disk space issues
- Backup creation failure

### Phase 2: Database Migration (15 minutes)
**Script**: `./02-run-migration.sh`

**Actions:**
- Add CUSTOMER role to enum
- Migrate 2 LEARNER → CUSTOMER users
- Validate migration success
- Update migration logs

**Success Criteria:**
- 2 CUSTOMER users exist
- 0 LEARNER users remain
- 2 ADMIN users unchanged
- User sessions intact

**Rollback Trigger:**
- Migration validation fails
- User data corruption detected
- Transaction rollback occurs

### Phase 3: Green Environment Setup (20 minutes)
**Script**: `./03-blue-green-deploy.sh`

**Actions:**
- Build new Docker image
- Start green environment (port 3001)
- Validate green health checks
- Test database connectivity

**Success Criteria:**
- Green container healthy
- Health endpoint responds
- Database queries successful
- No memory/CPU issues

**Rollback Trigger:**
- Green container fails to start
- Health checks fail
- Database connection issues

### Phase 4: Traffic Switching (10 minutes)
**Continuation of**: `./03-blue-green-deploy.sh`

**Actions:**
- Update nginx configuration
- Switch traffic to green
- Validate public endpoints
- Monitor error rates

**Success Criteria:**
- Main site responds via green
- API endpoints functional
- Authentication working
- Response times acceptable

**Rollback Trigger:**
- Public site inaccessible
- API endpoints failing
- Authentication broken

### Phase 5: Validation & Cleanup (10 minutes)
**Script**: `./05-validate-deployment.sh`

**Actions:**
- Comprehensive system validation
- User experience testing
- Performance monitoring
- Blue environment cleanup

**Success Criteria:**
- All validation tests pass
- User flows functional
- Performance within baseline
- System stability confirmed

**Rollback Trigger:**
- Critical validations fail
- User experience broken
- Performance degradation >2x

## Detailed Execution Steps

### Step 1: Infrastructure Assessment

```bash
cd /path/to/1001-stories/deployment
./01-assess-infrastructure.sh
```

**What it does:**
- Analyzes current container health (fixes unhealthy status)
- Tests database connectivity and user counts
- Creates timestamped backup in `/tmp/1001-stories-backup-YYYYMMDD-HHMMSS/`
- Validates system resources and health endpoints
- Generates assessment report

**Expected Output:**
```
Infrastructure Assessment Complete. System ready for deployment.
Backup created in: /tmp/1001-stories-backup-20240828-143000/
Database users: 4
Unhealthy containers: 0
```

### Step 2: Database Migration

```bash
./02-run-migration.sh
```

**What it does:**
- Uploads migration SQL script to server
- Creates additional pre-migration backup
- Executes transactional role migration
- Validates migration success with user counts
- Updates migration log table

**Expected Output:**
```
Migration Summary:
• Users migrated: 2 LEARNER → 2 CUSTOMER
• Total users: 4 (2 CUSTOMER, 2 ADMIN)  
• Data integrity: Verified
```

### Step 3: Blue-Green Deployment

```bash
./03-blue-green-deploy.sh
```

**What it does:**
- Builds new Docker image with updated code
- Starts green environment on port 3001
- Validates green environment health
- Updates nginx configuration for traffic switching
- Stops blue environment after validation

**Expected Output:**
```
Deployment Summary:
• New version: 1001stories:20240828-143000
• Environment: Green (was Blue)
• Traffic: 100% switched to new version
• Health status: {"status":"ok","database":"connected"}
```

## Rollback Procedures

### Application-Only Rollback

```bash
./04-rollback.sh --app-only
```

**When to use:**
- Application issues but database is fine
- Green environment problems
- Performance degradation

**What it does:**
- Restarts blue environment
- Switches nginx back to blue
- Stops problematic green environment
- Validates blue environment health

### Full Rollback (Database + Application)

```bash
./04-rollback.sh --full
```

**When to use:**
- Database migration issues
- User data problems
- Complete deployment failure

**What it does:**
- Restores database from pre-migration backup
- Reverts CUSTOMER → LEARNER users
- Restarts blue environment with old code
- Updates migration log to "ROLLED_BACK"

### Emergency Rollback Commands

If scripts fail, manual rollback:

```bash
# Connect to server
ssh ubuntu@3.128.143.122

# Stop green, start blue
docker stop 1001-stories-app-green
docker start 1001-stories-app-blue

# Restore nginx config
cp /home/ubuntu/1001-stories/nginx/nginx.conf.backup-* /home/ubuntu/1001-stories/nginx/nginx.conf
docker exec 1001-stories-nginx nginx -s reload

# Database restore (if needed)
cd /home/ubuntu/1001-stories
docker-compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB < /tmp/pre-migration-backup-*.sql
```

## Validation and Monitoring

### Post-Deployment Validation

```bash
./05-validate-deployment.sh
```

**Validates:**
- Container health and resource usage
- Database migration status and user roles
- Application endpoints and response times
- Security headers and HTTPS configuration
- User authentication flows
- Static asset delivery

### Monitoring Commands

```bash
# Real-time application logs
ssh ubuntu@3.128.143.122 'docker logs -f $(docker ps -q -f name=1001-stories-app)'

# System health check
curl -s https://1001stories.seedsofempowerment.org/api/health | jq

# Container status
ssh ubuntu@3.128.143.122 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'

# Database user verification
ssh ubuntu@3.128.143.122 'cd /home/ubuntu/1001-stories && docker-compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT role, COUNT(*) FROM \"User\" GROUP BY role;"'
```

### Performance Monitoring

```bash
# Response time test
curl -w "@curl-format.txt" -o /dev/null -s https://1001stories.seedsofempowerment.org

# Resource usage
ssh ubuntu@3.128.143.122 'docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"'
```

## Success Metrics

### Database Migration Success
- ✅ 0 LEARNER users
- ✅ 2 CUSTOMER users  
- ✅ 2 ADMIN users unchanged
- ✅ All user sessions valid
- ✅ No data loss

### Application Deployment Success
- ✅ Main site HTTP 200
- ✅ Health endpoint returns `{"status":"ok"}`
- ✅ Authentication flows working
- ✅ Universal dashboard accessible
- ✅ Admin panel functional

### System Performance Success
- ✅ Response times < 2 seconds
- ✅ Container health checks passing
- ✅ No critical errors in logs
- ✅ SSL certificates valid
- ✅ Security headers present

## Troubleshooting

### Common Issues

**Issue**: Containers showing unhealthy status
```bash
# Check specific container logs
docker logs 1001-stories-app-green

# Check health check endpoint
docker exec 1001-stories-app-green curl -f http://localhost:3000/api/health
```

**Issue**: Database migration fails
```bash
# Check migration logs
docker-compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT * FROM migration_log ORDER BY started_at DESC LIMIT 1;"

# Manual rollback
docker-compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB < /tmp/pre-migration-backup-*.sql
```

**Issue**: Nginx not switching traffic
```bash
# Test nginx config
docker exec 1001-stories-nginx nginx -t

# Check upstream status  
curl -H "Host: 1001stories.seedsofempowerment.org" http://3.128.143.122/blue/api/health
curl -H "Host: 1001stories.seedsofempowerment.org" http://3.128.143.122/green/api/health
```

**Issue**: Green environment won't start
```bash
# Check build logs
docker build -t debug-image . 2>&1 | tail -20

# Check environment variables
docker run --rm debug-image env | grep DATABASE_URL
```

### Recovery Procedures

1. **Immediate Issues (0-5 minutes)**
   - Run `./04-rollback.sh --app-only`
   - Check main site accessibility
   - Verify user authentication

2. **Database Issues (5-15 minutes)**
   - Run `./04-rollback.sh --full`
   - Validate user data integrity
   - Test user sessions

3. **Complete Failure (15+ minutes)**
   - Manual container restart
   - Database restore from backup
   - Nginx configuration restore
   - Contact system administrator

## File Structure

```
deployment/
├── 01-assess-infrastructure.sh    # Infrastructure assessment and backup
├── 02-database-migration.sql      # SQL migration script
├── 02-run-migration.sh           # Database migration runner
├── 03-blue-green-deploy.sh       # Main deployment script
├── 04-rollback.sh                # Rollback procedures
├── 05-validate-deployment.sh     # Post-deployment validation
├── docker-compose.blue-green.yml # Blue-green configuration
├── nginx-blue-green.conf         # Nginx load balancer config
└── DEPLOYMENT_GUIDE.md           # This guide
```

## Security Considerations

- All scripts use SSH key authentication
- Database backups are created before any changes
- Nginx maintains rate limiting during deployment
- SSL certificates remain valid throughout process
- User sessions preserved during migration
- No credentials stored in deployment scripts

## Contact Information

- **System Administrator**: [Your contact info]
- **Emergency Rollback**: `./04-rollback.sh --full`
- **Deployment Logs**: `/tmp/deployment-validation-*.txt`
- **Server Access**: `ssh ubuntu@3.128.143.122`

## Post-Deployment Tasks

### Immediate (0-2 hours)
- [ ] Monitor application logs
- [ ] Test user authentication flows
- [ ] Verify admin functionality  
- [ ] Check response times
- [ ] Validate database queries

### Short-term (2-24 hours)
- [ ] Monitor error rates
- [ ] Test all user workflows
- [ ] Verify email functionality
- [ ] Check backup integrity
- [ ] Document any issues

### Long-term (1-7 days)
- [ ] Clean up old Docker images
- [ ] Archive deployment logs
- [ ] Update monitoring dashboards
- [ ] Plan next deployment iteration
- [ ] Review deployment metrics

---

**Deployment Strategy**: Blue-Green with Database Migration  
**Expected Downtime**: 0 seconds  
**User Impact**: Seamless transition to new role system  
**Rollback Time**: < 5 minutes for application, < 15 minutes for database