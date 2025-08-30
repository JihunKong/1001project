# 1001 Stories Infrastructure Guide

This document provides comprehensive guidance for deploying and managing the 1001 Stories application infrastructure in production.

## Architecture Overview

### Production Stack
- **Frontend/Backend**: Next.js 15.4.6 application
- **Database**: PostgreSQL 15 with Prisma ORM
- **Web Server**: Nginx reverse proxy with SSL termination
- **Containerization**: Docker with Docker Compose
- **SSL**: Let's Encrypt certificates with automatic renewal
- **Monitoring**: Custom health checks and alerting
- **Backup**: Automated database and file backups

### Security Features
- Nginx reverse proxy (no direct port exposure)
- UFW firewall configuration
- SSL/TLS encryption (TLS 1.2/1.3)
- Rate limiting and security headers
- Container network isolation
- Automated security updates

## Quick Start

### 1. Initial Production Deployment

```bash
# Clone repository
git clone https://github.com/JihunKong/1001project.git
cd 1001project

# Run full production setup
./scripts/deploy.sh production
```

This command will:
- Configure firewall and security
- Deploy the application
- Set up SSL certificates
- Configure monitoring

### 2. Domain Access

After successful deployment:
- **HTTPS**: https://1001stories.seedsofempowerment.org
- **HTTP**: Redirects to HTTPS automatically

## Deployment Scripts

### Main Deployment Script: `scripts/deploy.sh`

```bash
# Deploy application only
./scripts/deploy.sh deploy

# Full production setup (recommended for first deployment)
./scripts/deploy.sh production

# Setup SSL certificates only
./scripts/deploy.sh ssl

# Configure security/firewall only
./scripts/deploy.sh security

# View logs
./scripts/deploy.sh logs

# Rollback to previous version
./scripts/deploy.sh rollback
```

### SSL Certificate Management: `scripts/setup-ssl.sh`

```bash
# Initial SSL setup
sudo ./scripts/setup-ssl.sh setup

# Renew certificates
sudo ./scripts/setup-ssl.sh renew

# Check certificate status
sudo ./scripts/setup-ssl.sh status
```

### Backup Management: `scripts/backup.sh`

```bash
# Create full backup
./scripts/backup.sh backup

# List available backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore <timestamp>

# Verify backup integrity
./scripts/backup.sh verify <timestamp>

# Clean old backups
./scripts/backup.sh cleanup
```

### System Monitoring: `scripts/monitor.sh`

```bash
# Quick health check
./scripts/monitor.sh health

# Full comprehensive check
./scripts/monitor.sh full

# Check SSL certificate
./scripts/monitor.sh ssl

# Check system resources
./scripts/monitor.sh resources

# Generate status report
./scripts/monitor.sh report

# Setup automated monitoring
sudo ./scripts/monitor.sh setup
```

## Configuration Files

### Docker Compose

#### `docker-compose.yml` - Production Configuration
- Application container (internal port 3000)
- Nginx reverse proxy (ports 80/443)
- PostgreSQL database (internal port 5432)
- PgAdmin (disabled by default for security)

#### `docker-compose.ssl.yml` - SSL Setup
- Certbot for Let's Encrypt certificates
- Temporary nginx for domain verification

### Nginx Configuration

#### `nginx/nginx.conf` - Main Configuration
- HTTP to HTTPS redirect
- Reverse proxy to Next.js app
- SSL termination
- Security headers
- Rate limiting
- Static file optimization

#### `nginx/nginx-ssl-setup.conf` - SSL Setup
- Minimal configuration for certificate verification
- Used during initial SSL setup only

## Environment Variables

### Production Environment (`.env.production`)

Required variables:
```env
# Database
DATABASE_URL=postgresql://stories_user:PASSWORD@postgres:5432/stories_db
DB_USER=stories_user
DB_PASSWORD=your_secure_password

# NextAuth
NEXTAUTH_URL=https://1001stories.seedsofempowerment.org
NEXTAUTH_SECRET=your_secret_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@1001stories.org

# Admin
PGADMIN_EMAIL=admin@1001stories.org
PGADMIN_PASSWORD=admin_password
```

Optional variables:
```env
# Backup
S3_BACKUP_BUCKET=your-backup-bucket

# Monitoring
ALERT_EMAIL=alerts@1001stories.org
SLACK_WEBHOOK=https://hooks.slack.com/...
```

## Security Configuration

### Firewall Rules (UFW)
```bash
# Allowed ports
80/tcp     # HTTP (redirects to HTTPS)
443/tcp    # HTTPS
22/tcp     # SSH

# Blocked ports
3000/tcp   # Next.js app (internal only)
5432/tcp   # PostgreSQL (internal only)
5050/tcp   # PgAdmin (internal only)
```

### SSL/TLS Configuration
- **Protocols**: TLS 1.2, TLS 1.3
- **Ciphers**: Modern cipher suites
- **Certificate**: Let's Encrypt with auto-renewal
- **HSTS**: Enabled with 1-year max-age
- **Security Headers**: Complete set configured

### Container Security
- Non-root users in containers
- Network isolation
- No privileged containers
- Read-only file systems where possible

## Monitoring and Alerting

### Automated Monitoring
- **Health checks**: Every 5 minutes
- **Status reports**: Daily at 6 AM
- **Comprehensive checks**: Weekly on Sundays

### Monitored Metrics
- Docker service status
- Website availability (HTTP/HTTPS)
- SSL certificate expiration
- System resources (CPU, memory, disk)
- Database connectivity
- Application error rates

### Alert Conditions
- Service down
- Website unavailable
- SSL certificate expiring (<30 days)
- High resource usage (>90%)
- Database connectivity issues
- High error rates

## Backup Strategy

### Automated Backups
- **Database**: PostgreSQL dumps (compressed)
- **Uploads**: User-uploaded files
- **Configuration**: Application config files
- **SSL**: Certificate backups
- **Retention**: 30 days local, unlimited S3

### Backup Schedule
- **Daily**: Full backup at 2 AM
- **Weekly**: Verification and cleanup
- **Monthly**: Restore testing

### Recovery Procedures
1. Stop application services
2. Restore database from backup
3. Restore file uploads
4. Restore SSL certificates (if needed)
5. Start services and verify

## Troubleshooting

### Common Issues

#### 1. SSL Certificate Issues
```bash
# Check certificate status
sudo ./scripts/setup-ssl.sh status

# Renew certificate manually
sudo ./scripts/setup-ssl.sh renew

# Check nginx configuration
docker-compose exec nginx nginx -t
```

#### 2. Service Not Starting
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs service_name

# Restart services
docker-compose restart
```

#### 3. Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U stories_user

# Access database
docker-compose exec postgres psql -U stories_user -d stories_db

# Check connections
./scripts/monitor.sh database
```

#### 4. High Resource Usage
```bash
# Check system resources
./scripts/monitor.sh resources

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
docker stats
```

### Log Files

#### Application Logs
```bash
# View application logs
docker-compose logs app

# View nginx logs
docker-compose logs nginx

# View all service logs
docker-compose logs
```

#### System Logs
```bash
# Monitoring logs
tail -f /var/log/1001-stories-monitor.log

# Nginx access logs
tail -f nginx/logs/access.log

# Nginx error logs
tail -f nginx/logs/error.log
```

## Maintenance Procedures

### Regular Maintenance (Monthly)

1. **Update system packages**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Update Docker images**
   ```bash
   docker-compose pull
   docker-compose up -d --build
   ```

3. **Clean Docker resources**
   ```bash
   docker system prune -f
   ```

4. **Review logs and monitoring**
   ```bash
   ./scripts/monitor.sh report
   ```

5. **Test backup restore**
   ```bash
   ./scripts/backup.sh verify latest
   ```

### Emergency Procedures

#### 1. Service Outage
```bash
# Quick restart
docker-compose restart

# Full rebuild if needed
docker-compose down
docker-compose up -d --build
```

#### 2. Data Recovery
```bash
# List available backups
./scripts/backup.sh list

# Restore from specific backup
./scripts/backup.sh restore TIMESTAMP
```

#### 3. Security Incident
```bash
# Stop all services
docker-compose down

# Review logs
docker-compose logs > incident-logs.txt

# Update credentials
# Edit .env.production

# Restart with new credentials
docker-compose up -d
```

## Performance Optimization

### Database Optimization
- Connection pooling via Prisma
- Regular VACUUM and ANALYZE
- Index optimization
- Query monitoring

### Application Optimization
- Static file caching
- Gzip compression
- CDN integration (optional)
- Image optimization

### Infrastructure Scaling
- Horizontal scaling with load balancer
- Database read replicas
- Container orchestration (Kubernetes)
- Auto-scaling groups

## Support and Resources

### Documentation
- [CLAUDE.md](./CLAUDE.md) - Development guide
- [README.md](./README.md) - Project overview
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Monitoring
- System metrics: `./scripts/monitor.sh report`
- Application health: `https://1001stories.seedsofempowerment.org/api/health`
- Service status: `docker-compose ps`

### Emergency Contacts
- **Technical**: [Your technical contact]
- **Infrastructure**: [Your infrastructure team]
- **Security**: [Your security team]

---

**Last Updated**: 2025-08-22
**Version**: 1.0.0
**Maintained By**: Infrastructure Team