# 1001 Stories Deployment Infrastructure

Zero-downtime deployment system for 1001 Stories role system redesign with comprehensive backup, migration, and rollback capabilities.

## Quick Start

```bash
# 1. Assess infrastructure
./01-assess-infrastructure.sh

# 2. Run database migration  
./02-run-migration.sh

# 3. Deploy new version
./03-blue-green-deploy.sh

# 4. Validate deployment
./05-validate-deployment.sh

# If issues occur:
./04-rollback.sh [--app-only | --full]
```

## Deployment Architecture

**Blue-Green Strategy** with shared database:
- **Blue Environment**: Current production (port 3000)
- **Green Environment**: New version (port 3001) 
- **Traffic Switch**: Nginx-based instant switching
- **Database**: Shared PostgreSQL with transactional migration

## Files Overview

| File | Purpose | Runtime | Critical |
|------|---------|---------|----------|
| `01-assess-infrastructure.sh` | Pre-deployment checks & backup | 5min | ✅ |
| `02-run-migration.sh` | Database role migration | 15min | ✅ |
| `03-blue-green-deploy.sh` | Application deployment | 20min | ✅ |
| `04-rollback.sh` | Emergency rollback | 5-15min | ✅ |
| `05-validate-deployment.sh` | Post-deploy validation | 10min | ✅ |

## Migration Details

### Database Changes
- **Before**: 2 LEARNER + 2 ADMIN = 4 users
- **After**: 2 CUSTOMER + 2 ADMIN = 4 users
- **Migration**: LEARNER → CUSTOMER role
- **Rollback**: Available with full data restore

### Application Changes
- Remove role selection from signup
- Add universal dashboard
- Update authentication flows
- Maintain admin functionality

## Safety Features

- **Transactional migrations** with automatic rollback
- **Health monitoring** with failure detection
- **Automatic backup** before any changes
- **Blue-green deployment** for zero downtime
- **Instant rollback** capability
- **Comprehensive validation** with detailed reporting

## Production Environment

- **Server**: AWS Lightsail 3.128.143.122
- **Users**: 4 total (low-risk deployment)
- **Stack**: Docker Compose + Nginx + PostgreSQL
- **SSL**: Configured and maintained
- **Monitoring**: Built-in health checks

## Success Criteria

✅ **Zero Downtime**: Users experience no service interruption  
✅ **Data Safety**: All 4 users' data preserved and accessible  
✅ **Role Migration**: 2 LEARNER → 2 CUSTOMER successful  
✅ **Functionality**: Universal dashboard and admin panel working  
✅ **Performance**: Response times within acceptable limits  

## Emergency Contacts

- **Rollback Command**: `./04-rollback.sh --full`
- **Server SSH**: `ssh ubuntu@3.128.143.122`
- **Health Check**: `curl https://1001stories.seedsofempowerment.org/api/health`
- **Database Access**: Via Docker Compose exec

---

**Total Deployment Time**: 60 minutes  
**Risk Level**: Low (4 users, comprehensive backup)  
**Recovery Time**: < 15 minutes for full rollback