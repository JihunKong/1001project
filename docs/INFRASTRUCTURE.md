# Infrastructure Configuration Guide

This document provides comprehensive guidance for the 1001 Stories infrastructure configuration, deployment, and maintenance.

## Quick Start

1. **Local Development**: `./scripts/test-docker-local.sh`
2. **Production Deployment**: `./scripts/deploy.sh deploy`
3. **View Logs**: `./scripts/deploy.sh logs`
4. **Health Check**: `./scripts/deploy.sh status`

## Architecture Overview

### Technology Stack
- **Containerization**: Docker + Docker Compose
- **Web Server**: nginx (reverse proxy, SSL termination)
- **Application**: Next.js 15.4.6 with React 19
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache/Session Store**: Redis 7
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Node Exporter, Docker health checks

### Container Architecture
```
[nginx] → [app] → [postgres]
    ↓         ↓        ↓
   SSL    Sessions  [redis]
```

## Docker Compose Configurations

### 1. Local Development (`docker-compose.local.yml`)
- **Purpose**: Local development and testing
- **Services**: app, postgres, redis, pgadmin
- **Network**: local-network (bridge)
- **Features**:
  - Hot reloading for development
  - PgAdmin for database management
  - Redis for session testing
  - Volume mounts for live code changes

### 2. Development (`docker-compose.dev.yml`)
- **Purpose**: Standalone database and Redis for external app
- **Services**: postgres, redis
- **Ports**: postgres:5434, redis:6380
- **Use Case**: When running Next.js directly but need backing services

### 3. Production (`docker/docker-compose.ssl.yml`)
- **Purpose**: Production deployment with SSL
- **Services**: nginx, app, postgres, redis, certbot
- **Features**:
  - SSL certificate management
  - Production-optimized nginx configuration
  - Health checks and restart policies
  - Secure Redis with password authentication

## Environment Configuration

### Local Development (`.env.docker`)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://stories_user:test_password@postgres:5432/stories_db
REDIS_URL=redis://:test_password@redis:6379
NEXTAUTH_URL=http://localhost:3000
# ... other development settings
```

### Production (`.env.production`)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@postgres:5432/stories_db
REDIS_URL=redis://:SECURE_PASSWORD@redis:6379
NEXTAUTH_URL=https://1001stories.seedsofempowerment.org
# ... other production settings
```

## Deployment Scripts

### `scripts/deploy.sh`
Main deployment script with multiple commands:

- `deploy` - Full application deployment
- `ssl` - Setup/renew SSL certificates
- `logs` - View application logs
- `rollback` - Rollback to previous deployment
- `status` - Check deployment health
- `test` - Test Docker configuration locally
- `backup` - Create manual database backup

**Example Usage:**
```bash
./scripts/deploy.sh test      # Test locally first
./scripts/deploy.sh deploy    # Deploy to production
./scripts/deploy.sh logs      # Monitor deployment
```

### `scripts/test-docker-local.sh`
Comprehensive local testing script that:
- Validates Docker configuration
- Tests all services (app, database, Redis)
- Verifies health endpoints
- Runs basic performance checks
- Provides debugging information

### `scripts/setup-server.sh`
Initial server setup script for fresh Ubuntu servers:
- Installs Docker and Docker Compose
- Configures firewall (UFW)
- Sets up fail2ban for security
- Configures SSH hardening
- Sets up automated backups
- Installs monitoring tools
- Optimizes system performance

## nginx Configuration

### SSL Setup (`nginx/ssl-setup.conf`)
Minimal configuration for Let's Encrypt ACME challenge:
- Serves `.well-known/acme-challenge/` for certificate verification
- Redirects all other traffic to HTTPS

### Production (`nginx/nginx-ssl.conf`)
Full production configuration with:
- **SSL/TLS**: Modern cipher suites, HSTS, OCSP stapling
- **Security Headers**: XSS protection, content type validation
- **Performance**: Gzip compression, static file caching
- **Rate Limiting**: API and auth endpoint protection
- **Monitoring**: Detailed access/error logging

## Security Features

### SSL/TLS Security
- **Protocols**: TLS 1.2 and 1.3 only
- **Ciphers**: Modern ECDHE and DHE suites
- **HSTS**: Enabled with preload directive
- **OCSP Stapling**: Improved certificate validation

### Application Security
- **CSRF Protection**: NextAuth.js built-in protection
- **Rate Limiting**: nginx-based request limiting
- **Input Validation**: Prisma ORM with type safety
- **Session Security**: Redis-backed secure sessions

### Infrastructure Security
- **Firewall**: UFW with minimal open ports (22, 80, 443)
- **Intrusion Detection**: fail2ban with custom rules
- **SSH Hardening**: Key-only authentication, root disabled
- **Container Security**: Non-root users, health checks

## Monitoring and Observability

### Health Checks
- **Application**: `/health` endpoint
- **Database**: `pg_isready` command
- **Redis**: `ping` command
- **nginx**: Process monitoring

### Logging
- **nginx**: Access and error logs with rotation
- **Application**: Docker container logs
- **Database**: PostgreSQL logs
- **System**: fail2ban, SSH, system logs

### Metrics
- **Node Exporter**: System metrics on port 9100
- **Docker Stats**: Container resource usage
- **Application Metrics**: Custom health endpoints

## Backup and Recovery

### Automated Backups
- **Schedule**: Daily at 2 AM
- **Retention**: 30 days
- **Location**: `/home/ubuntu/1001project/backups/`
- **Format**: Compressed SQL dumps

### Manual Backup
```bash
./scripts/deploy.sh backup
```

### Restore Procedure
1. Stop application containers
2. Start only PostgreSQL
3. Restore from backup file
4. Restart all containers
5. Verify application functionality

## Troubleshooting

### Common Issues

#### 1. SSL Certificate Problems
```bash
# Check certificate status
openssl x509 -in /path/to/cert.pem -text -noout

# Renew certificates
./scripts/deploy.sh ssl
```

#### 2. Database Connection Issues
```bash
# Check database health
docker-compose exec postgres pg_isready -U postgres

# View database logs
docker-compose logs postgres
```

#### 3. Redis Connection Problems
```bash
# Test Redis connectivity
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

#### 4. Application Not Starting
```bash
# Check application logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep -E "(DATABASE|REDIS|NEXTAUTH)"
```

### Performance Issues

#### 1. High Memory Usage
```bash
# Check container memory usage
docker stats

# Optimize container resources
# Edit docker-compose.yml and add memory limits
```

#### 2. Slow Response Times
```bash
# Check nginx access logs for slow requests
tail -f nginx/logs/access.log

# Monitor database performance
docker-compose exec postgres pg_stat_activity
```

### Recovery Procedures

#### 1. Complete System Failure
1. Restore from backup
2. Redeploy application
3. Verify all services
4. Check data integrity

#### 2. Partial Service Failure
1. Identify failed service
2. Restart specific container
3. Check logs for errors
4. Apply targeted fixes

## Best Practices

### Development Workflow
1. Always test locally with `./scripts/test-docker-local.sh`
2. Use feature branches for infrastructure changes
3. Test SSL configuration in staging environment
4. Document all configuration changes

### Production Deployment
1. Create database backup before deployment
2. Deploy during low-traffic periods
3. Monitor logs during and after deployment
4. Have rollback plan ready
5. Verify all critical functionality post-deployment

### Security Maintenance
1. Regular security updates: `apt update && apt upgrade`
2. Monitor fail2ban logs: `sudo fail2ban-client status`
3. Review nginx access logs for suspicious activity
4. Update Docker images regularly
5. Rotate secrets and passwords periodically

### Performance Optimization
1. Monitor container resource usage
2. Implement CDN for static assets
3. Optimize database queries
4. Use Redis for caching
5. Implement proper logging levels

## Configuration Reference

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - NextAuth.js encryption key
- `NEXTAUTH_URL` - Application base URL
- `EMAIL_SERVER_*` - SMTP configuration
- `OPENAI_API_KEY` - OpenAI API access
- `UPSTAGE_API_KEY` - Upstage API access

### Optional Environment Variables
- `AWS_*` - S3 storage configuration
- `SENTRY_DSN` - Error tracking
- `GA_TRACKING_ID` - Analytics
- Feature flags for specific functionality

### Port Mappings
- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (nginx → app)
- **3000**: Application (internal)
- **5432**: PostgreSQL (internal)
- **6379**: Redis (internal)
- **9100**: Node Exporter (monitoring)

## Support and Maintenance

### Regular Maintenance Tasks
- Weekly: Review logs and performance metrics
- Monthly: Update system packages and Docker images
- Quarterly: Security audit and penetration testing
- Annually: SSL certificate renewal (automated)

### Emergency Contacts
- **Server Issues**: Check AWS Lightsail console
- **DNS Issues**: Verify domain configuration
- **SSL Issues**: Check Let's Encrypt logs
- **Application Issues**: Review Docker and application logs

For additional support, refer to the main project documentation in `CLAUDE.md` and `README.md`.