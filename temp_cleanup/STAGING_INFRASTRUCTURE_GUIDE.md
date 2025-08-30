# 1001 Stories - Staging Infrastructure Guide

## Week 1: Safe Role System Testing Environment

This guide provides comprehensive documentation for the staging environment infrastructure created to support the safe deployment of the role system migration from LEARNER to CUSTOMER roles.

## 🎯 Infrastructure Overview

The staging environment provides a complete, isolated testing environment that mirrors production while ensuring safety through:

- **Port Isolation**: Uses different ports to avoid conflicts with production
- **Data Anonymization**: Safely copies and anonymizes production data
- **SSL Configuration**: Self-signed certificates for HTTPS testing
- **Comprehensive Monitoring**: Health checks, logging, and validation
- **Migration Testing**: Full database migration testing framework
- **Rollback Capabilities**: Complete rollback mechanisms for safety

## 📁 File Structure

```
1001-stories/
├── docker-compose.staging.yml     # Staging Docker configuration
├── .env.staging                   # Staging environment variables
├── nginx/
│   ├── staging.conf               # Staging nginx configuration
│   └── ssl-staging/               # Self-signed SSL certificates
├── scripts/
│   ├── setup-staging.sh           # Automated staging setup
│   ├── copy-production-data.sh    # Safe production data copy
│   ├── test-migration.sh          # Database migration testing
│   └── validate-staging.sh        # Comprehensive validation
├── staging-backups/               # Staging backups and reports
├── staging-data/                  # Staging-specific data
└── staging-monitoring/            # Monitoring configurations
```

## 🚀 Quick Start

### 1. Set Up Staging Environment

```bash
# Set up complete staging environment
./scripts/setup-staging.sh --all

# Or minimal setup (without monitoring/admin tools)
./scripts/setup-staging.sh
```

### 2. Copy Production Data

```bash
# Preview what would be copied (dry run)
./scripts/copy-production-data.sh --dry-run

# Copy production data safely
./scripts/copy-production-data.sh
```

### 3. Test Database Migration

```bash
# Test role system migration
./scripts/test-migration.sh

# Verbose testing with detailed output
./scripts/test-migration.sh --verbose
```

### 4. Validate Environment

```bash
# Complete validation
./scripts/validate-staging.sh

# Quick essential checks
./scripts/validate-staging.sh --quick
```

## 🔧 Detailed Configuration

### Docker Compose Staging Configuration

The staging environment uses isolated containers with dedicated resources:

- **Application**: `localhost:3001` → `https://localhost:8080` (via nginx)
- **Database**: `localhost:5434` (PostgreSQL)
- **Cache**: `localhost:6380` (Redis)
- **Admin Tools**: `localhost:5051` (pgAdmin)
- **Monitoring**: `localhost:9091` (Prometheus), `localhost:3002` (Grafana)

### Environment Variables

Key staging-specific configurations in `.env.staging`:

```env
NODE_ENV=staging
NEXTAUTH_URL=https://localhost:8080
DATABASE_URL=postgresql://staging_user:staging_pass_123@postgres-staging:5432/staging_db
ROLE_MIGRATION_MODE=true
ENABLE_UNIVERSAL_DASHBOARD=true
DISABLE_ROLE_SELECTION=true
```

### SSL Configuration

Self-signed certificates for local HTTPS testing:
- Generated automatically during setup
- Valid for 365 days
- Includes localhost and IP alternatives
- Located in `nginx/ssl-staging/`

## 📊 Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| nginx HTTPS | 8080 | Main staging application access |
| nginx HTTP | 8081 | HTTP redirect to HTTPS |
| App Direct | 3001 | Direct application access (development) |
| PostgreSQL | 5434 | Database access |
| Redis | 6380 | Cache access |
| pgAdmin | 5051 | Database administration |
| Prometheus | 9091 | Metrics collection |
| Grafana | 3002 | Metrics visualization |

## 🔒 Security Features

### Data Protection
- **Anonymization**: Email addresses anonymized to `@staging.local`
- **Limited Data**: Maximum 10 users copied by default
- **Safe Queries**: Read-only production queries with limits
- **Backup Creation**: Automatic staging backups before operations

### Access Controls
- **Network Isolation**: Separate Docker network
- **Container Security**: Non-root user configurations
- **SSL Enforcement**: HTTPS-only access
- **Development Headers**: Clear staging environment identification

## 🗃️ Database Configuration

### Staging Database Structure

```sql
-- Main application tables (copied from production)
"User", "Story", "UserStory", "Order", "Donation"

-- Staging-specific tables
staging_migrations.role_migration_log  -- Migration tracking
staging_migrations.test_results        -- Test execution results
staging_logs.init_log                  -- Initialization logs
```

### Migration Testing

The migration testing framework provides:

- **Role Migration**: LEARNER → CUSTOMER conversion testing
- **Data Integrity**: Foreign key and constraint validation
- **Performance Testing**: Query performance measurement
- **Rollback Testing**: Complete rollback capability verification
- **Edge Case Testing**: Invalid data and error condition handling

## 📈 Monitoring and Logging

### Health Checks

All services include comprehensive health checks:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
  interval: 15s
  timeout: 10s
  retries: 5
  start_period: 30s
```

### Logging Configuration

Enhanced logging for staging analysis:

```nginx
log_format staging '$time_iso8601 [STAGING] $remote_addr "$request" $status '
                  '$request_time $upstream_response_time "$http_user_agent"';
```

### Monitoring Stack (Optional)

- **Prometheus**: Metrics collection from all services
- **Grafana**: Visualization dashboards for performance monitoring
- **Custom Metrics**: Application-specific role system metrics

## 🧪 Testing Framework

### Migration Testing Categories

1. **Prerequisites**: Environment and data validation
2. **Role Migration Logic**: Actual LEARNER → CUSTOMER conversion
3. **Data Integrity**: Constraint and relationship validation
4. **Rollback Functionality**: Complete migration reversal
5. **Performance Testing**: Query and operation performance
6. **Edge Cases**: Error conditions and invalid data handling

### Validation Categories

1. **Infrastructure**: Docker containers, ports, volumes, SSL
2. **Application**: Health checks, API routes, static assets
3. **Database**: Connectivity, tables, data integrity, performance
4. **Security**: HTTPS, headers, access controls, file permissions
5. **Performance**: Load times, resource usage, concurrent requests
6. **Integration**: Service connectivity, cross-component communication

## 📋 Common Operations

### Starting Services

```bash
# Start all staging services
docker-compose -f docker-compose.staging.yml up -d

# Start with admin tools
docker-compose -f docker-compose.staging.yml --profile admin up -d

# Start with monitoring
docker-compose -f docker-compose.staging.yml --profile monitoring up -d
```

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.staging.yml logs -f

# Specific service
docker-compose -f docker-compose.staging.yml logs -f app-staging

# Database logs
docker logs 1001-stories-db-staging
```

### Database Access

```bash
# PostgreSQL shell
docker exec -it 1001-stories-db-staging psql -U staging_user -d staging_db

# pgAdmin web interface
open http://localhost:5051

# View migration logs
docker exec -it 1001-stories-db-staging psql -U staging_user -d staging_db -c "SELECT * FROM staging_migrations.role_migration_log;"
```

### Performance Monitoring

```bash
# Container statistics
docker stats 1001-stories-app-staging

# Resource usage
docker exec 1001-stories-app-staging top

# Network connectivity
docker exec 1001-stories-app-staging netstat -tlnp
```

## 🔄 Migration Workflow

### Step 1: Environment Setup
1. Run `./scripts/setup-staging.sh --all`
2. Verify all containers are running
3. Check SSL certificate generation

### Step 2: Data Preparation
1. Run `./scripts/copy-production-data.sh --dry-run` (preview)
2. Run `./scripts/copy-production-data.sh` (actual copy)
3. Verify data anonymization and integrity

### Step 3: Migration Testing
1. Run `./scripts/test-migration.sh --verbose`
2. Review test results and migration logs
3. Verify rollback functionality

### Step 4: Validation
1. Run `./scripts/validate-staging.sh`
2. Address any failed validations
3. Generate final readiness report

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Port Conflicts
```bash
# Check port usage
lsof -i :8080
lsof -i :5434

# Kill conflicting processes
kill -9 <PID>
```

#### Container Issues
```bash
# Restart specific service
docker-compose -f docker-compose.staging.yml restart app-staging

# Rebuild and restart
docker-compose -f docker-compose.staging.yml up -d --build app-staging
```

#### Database Connection Issues
```bash
# Check database status
docker exec 1001-stories-db-staging pg_isready -U staging_user -d staging_db

# Reset database
docker-compose -f docker-compose.staging.yml down
docker volume rm postgres_staging_data
./scripts/setup-staging.sh
```

#### SSL Certificate Issues
```bash
# Regenerate certificates
rm -rf nginx/ssl-staging/*
./scripts/setup-staging.sh

# Check certificate validity
openssl x509 -in nginx/ssl-staging/staging.crt -text -noout
```

### Log Locations

- **Application Logs**: `docker-compose -f docker-compose.staging.yml logs app-staging`
- **Nginx Logs**: `nginx/logs-staging/`
- **Database Logs**: `docker logs 1001-stories-db-staging`
- **Migration Logs**: Database table `staging_migrations.role_migration_log`
- **Validation Reports**: `staging-backups/staging-validation-report-*.json`

## 📊 Success Criteria for Week 1

### Infrastructure Readiness
- [ ] All Docker containers running and healthy
- [ ] SSL certificates generated and valid
- [ ] Port isolation working correctly
- [ ] Monitoring stack operational (if enabled)

### Data Preparation
- [ ] Production data safely copied and anonymized
- [ ] Test users available for migration testing
- [ ] Database integrity verified
- [ ] Backup procedures confirmed working

### Migration Testing
- [ ] Role migration logic tested successfully
- [ ] Data integrity maintained after migration
- [ ] Rollback functionality verified
- [ ] Performance characteristics acceptable
- [ ] Edge cases handled properly

### Environment Validation
- [ ] All validation categories pass
- [ ] Security configuration verified
- [ ] Application functionality confirmed
- [ ] Service integration working

## 🎯 Week 2 Preparation

### Production Deployment Readiness

With successful Week 1 completion:

1. **Migration Strategy Validated**: Role system migration tested safely
2. **Rollback Procedures Confirmed**: Complete rollback capability verified
3. **Performance Impact Assessed**: Query and application performance measured
4. **Data Integrity Assured**: No data corruption or constraint violations
5. **Security Maintained**: Access controls and permissions verified

### Next Phase Actions

1. Schedule production deployment window
2. Prepare production deployment checklist
3. Set up production monitoring and alerting
4. Create communication plan for stakeholders
5. Prepare rollback procedures for production

## 📞 Support and Resources

### Quick Reference Commands

```bash
# Setup
./scripts/setup-staging.sh --all

# Data Copy
./scripts/copy-production-data.sh

# Migration Test
./scripts/test-migration.sh --verbose

# Validation
./scripts/validate-staging.sh

# Access Points
open https://localhost:8080          # Application
open http://localhost:5051           # pgAdmin
docker exec -it 1001-stories-db-staging psql -U staging_user -d staging_db
```

### Report Locations

- Migration Test Reports: `staging-backups/migration-test-report-*.json`
- Validation Reports: `staging-backups/staging-validation-report-*.json`  
- Data Summary Reports: `staging-backups/test-data-summary-*.json`
- Backup Files: `staging-backups/staging-backup-*.sql.gz`

### Key Metrics to Monitor

- **Container Health**: All containers running and healthy
- **Response Times**: < 3 seconds for page loads
- **Database Performance**: < 100ms for standard queries
- **Migration Success Rate**: 100% for test migrations
- **Rollback Success Rate**: 100% for rollback tests

---

## 🎉 Week 1 Completion

Upon successful completion of all staging infrastructure setup, data preparation, migration testing, and validation, you will have:

✅ **Safe Testing Environment**: Fully isolated staging environment
✅ **Production Data Copy**: Anonymized production data for realistic testing
✅ **Migration Framework**: Complete role system migration testing capability
✅ **Validation System**: Comprehensive environment validation and monitoring
✅ **Rollback Procedures**: Verified rollback mechanisms for safety
✅ **Performance Baseline**: Understanding of migration performance impact
✅ **Week 2 Readiness**: Complete preparation for production deployment

**Ready to proceed to Week 2: Production Deployment! 🚀**