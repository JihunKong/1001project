# Security-Hardened Deployment Guide for 1001 Stories

## 🔐 Overview

This guide provides step-by-step instructions for deploying 1001 Stories with comprehensive security hardening. All configurations implement defense-in-depth principles and industry best practices.

## ⚠️ Critical Security Issues Fixed

### 1. Container Security Issues
- **FIXED**: Removed port exposure for PostgreSQL (5432) and Redis (6379) in production
- **FIXED**: Added `no-new-privileges` security option to prevent privilege escalation
- **FIXED**: Configured read-only root filesystem with secure tmpfs mounts
- **FIXED**: Implemented proper user isolation in all containers

### 2. Authentication & Credentials
- **FIXED**: Replaced hardcoded weak passwords with environment variable placeholders
- **FIXED**: Created secure password generation script with 32-character passwords
- **FIXED**: Fixed invalid email domain in pgadmin configuration
- **FIXED**: Implemented proper secrets management system

### 3. Network Security
- **FIXED**: Added comprehensive security headers in nginx
- **FIXED**: Implemented Content Security Policy (CSP)
- **FIXED**: Enhanced rate limiting with proper HTTP status codes
- **FIXED**: Improved SSL/TLS configuration with modern ciphers

### 4. Monitoring & Alerting
- **FIXED**: Created security monitoring rules for Prometheus
- **FIXED**: Implemented alerting for authentication failures, rate limit violations
- **FIXED**: Added container security violation detection
- **FIXED**: Configured SSL certificate expiration monitoring

### 5. Backup Security
- **FIXED**: Implemented encrypted backup system with AES-256
- **FIXED**: Added backup integrity verification with SHA-256 checksums
- **FIXED**: Configured secure file permissions (600) for all backup files
- **FIXED**: Automated cleanup of old backups with configurable retention

## 🚀 Pre-Deployment Security Checklist

### Step 1: Generate Secure Credentials
```bash
# Generate secure passwords for all services
./scripts/generate-secure-passwords.sh

# Copy generated secure environment file
cp .env.production.secure.generated .env.production

# Manually set email credentials (replace placeholders)
# EMAIL_SERVER_USER=your-actual-gmail@gmail.com
# EMAIL_SERVER_PASSWORD=your-app-specific-password
# OPENAI_API_KEY=your-openai-key (if using AI features)
# UPSTAGE_API_KEY=your-upstage-key (if using AI features)
```

### Step 2: Update Docker Compose with Secure Passwords
```bash
# Export environment variables for docker-compose
export DB_PASSWORD=$(grep DB_PASSWORD .env.production | cut -d'=' -f2)
export REDIS_PASSWORD=$(grep REDIS_PASSWORD .env.production | cut -d'=' -f2)

# Verify configuration
docker-compose config
```

### Step 3: SSL Certificate Setup
```bash
# Ensure SSL certificates exist
sudo mkdir -p /opt/1001-stories/certbot/conf/live/1001stories.seedsofempowerment.org/
sudo mkdir -p /opt/1001-stories/certbot/www

# Initial certificate generation (if needed)
sudo docker run --rm \
  -v /opt/1001-stories/certbot/conf:/etc/letsencrypt \
  -v /opt/1001-stories/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d 1001stories.seedsofempowerment.org \
  --email admin@1001stories.org \
  --agree-tos \
  --no-eff-email
```

### Step 4: File System Security
```bash
# Create secure directories with proper permissions
sudo mkdir -p /opt/1001-stories/{data,backups,secrets}
sudo chmod 700 /opt/1001-stories/{backups,secrets}
sudo chmod 755 /opt/1001-stories/data

# Set up backup encryption key
sudo mkdir -p /opt/1001-stories/secrets
sudo openssl rand -base64 32 | sudo tee /opt/1001-stories/secrets/backup.key
sudo chmod 600 /opt/1001-stories/secrets/backup.key
```

## 🛡️ Security Configuration Details

### Container Security
- **Read-only root filesystem**: Prevents runtime file system tampering
- **No privilege escalation**: Blocks container breakout attempts
- **Secure tmpfs mounts**: Temporary files use memory, not disk
- **Non-root users**: All processes run as unprivileged users
- **Resource limits**: CPU and memory constraints prevent resource exhaustion

### Network Security
- **No exposed database ports**: PostgreSQL and Redis only accessible internally
- **Comprehensive security headers**: XSS, CSRF, clickjacking protection
- **Content Security Policy**: Prevents code injection attacks
- **Rate limiting**: Protects against brute force and DDoS attacks
- **Modern TLS**: TLS 1.2+ with secure cipher suites

### Data Protection
- **Encrypted backups**: AES-256 encryption for all backup files
- **Secure file permissions**: 600 (owner read/write only) for sensitive files
- **Integrity verification**: SHA-256 checksums for all backups
- **Automated retention**: Old backups cleaned up automatically

### Monitoring Security
- **Authentication failure tracking**: Detects brute force attempts
- **Rate limit violation alerts**: Identifies potential DDoS attacks
- **Container security monitoring**: Detects privilege escalation attempts
- **SSL certificate expiration**: Prevents certificate-related outages
- **Resource exhaustion detection**: Identifies potential DoS attacks

## 🔧 Production Deployment

### Deploy with Security Hardening
```bash
# Deploy with secure configuration
docker-compose -f docker-compose.yml up -d

# Verify all containers are healthy
docker-compose ps

# Check security configurations
docker inspect 1001-stories-app | grep -A 10 SecurityOpt
```

### Post-Deployment Security Verification
```bash
# Test external port exposure (should show only 80, 443)
sudo netstat -tlnp | grep :5432  # Should return empty (PostgreSQL not exposed)
sudo netstat -tlnp | grep :6379  # Should return empty (Redis not exposed)

# Verify SSL configuration
curl -I https://1001stories.seedsofempowerment.org

# Test rate limiting
for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" https://1001stories.seedsofempowerment.org/api/auth/signin; done
```

### Automated Security Backup Setup
```bash
# Set up automated backups (daily at 2 AM)
sudo crontab -e
# Add line: 0 2 * * * /opt/1001-stories/scripts/secure-backup.sh

# Test backup system
sudo /opt/1001-stories/scripts/secure-backup.sh

# Verify backup integrity
sudo /opt/1001-stories/scripts/secure-backup.sh verify /opt/1001-stories/backups/database_$(date +%Y%m%d)*.gpg
```

## 🚨 Security Monitoring Setup

### Prometheus Security Alerts
```bash
# Add security alert rules to Prometheus
sudo cp monitoring/security-alerts.yml /opt/1001-stories/monitoring/

# Restart Prometheus to load new rules
docker-compose restart prometheus
```

### Log Security Events
```bash
# Monitor authentication failures
sudo tail -f /opt/1001-stories/nginx/logs/error.log | grep "429\|403\|auth"

# Check container security violations
docker logs 1001-stories-app 2>&1 | grep -i "security\|violation\|privilege"
```

## 🔍 Security Validation Tests

### Test Container Security
```bash
# Verify read-only filesystem
docker exec 1001-stories-app touch /test.txt  # Should fail

# Check user privileges
docker exec 1001-stories-app whoami  # Should return 'nextjs'
docker exec 1001-stories-app id      # Should show non-zero UID/GID
```

### Test Network Security
```bash
# Verify database is not externally accessible
timeout 5 telnet localhost 5432  # Should timeout/fail

# Test HTTPS redirect
curl -I http://1001stories.seedsofempowerment.org  # Should return 301

# Verify security headers
curl -I https://1001stories.seedsofempowerment.org | grep -E "(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security)"
```

## 📋 Security Maintenance

### Daily Tasks
- Monitor Prometheus security alerts
- Review nginx access and error logs
- Check container health status
- Verify backup completion

### Weekly Tasks
- Review backup integrity reports
- Update system packages in containers
- Analyze authentication failure patterns
- Check SSL certificate expiration

### Monthly Tasks
- Security configuration audit
- Penetration testing (basic)
- Update security monitoring rules
- Review and rotate backup encryption keys

## 🆘 Security Incident Response

### Immediate Response (High Priority Alerts)
1. **Authentication Failures**: Block suspicious IPs, investigate user accounts
2. **Container Violations**: Stop affected containers, examine logs
3. **Rate Limit Violations**: Increase rate limits if legitimate, block if malicious
4. **SSL Issues**: Renew certificates immediately, check DNS configuration

### Investigation Tools
```bash
# Check recent authentication attempts
docker logs 1001-stories-app | grep -i auth | tail -50

# Analyze nginx access patterns
sudo tail -1000 /opt/1001-stories/nginx/logs/access.log | awk '{print $1}' | sort | uniq -c | sort -nr

# Monitor real-time container activity
docker stats
```

## ✅ Security Compliance

This configuration addresses:
- **OWASP Top 10**: Web application security risks
- **CIS Docker Benchmark**: Container security best practices
- **NIST Cybersecurity Framework**: Comprehensive security controls
- **GDPR Data Protection**: Encryption and access controls

## 📞 Support

For security-related issues:
1. Check this documentation first
2. Review Prometheus security alerts
3. Examine container and nginx logs
4. Contact system administrator with detailed incident report

---

**⚠️ Important**: This configuration implements production-grade security but should be regularly reviewed and updated based on emerging threats and security advisories.