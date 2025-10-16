# 1001 Stories - S3 Publishing Infrastructure

## Overview

This directory contains the comprehensive AWS S3-based infrastructure for the 1001 Stories educational publishing platform, featuring role-based access control, global content delivery, and automated monitoring designed specifically for the educational publishing workflow.

## 🏗️ Architecture Summary

### S3 Publishing Infrastructure
**Focus:** Educational Content Management & Global Delivery
**Components:**
- **S3 Multi-Bucket Architecture** for organized content storage
- **7-Tier Role-Based Access Control** (LEARNER → ADMIN)
- **CloudFront CDN** with educational content optimization
- **Cross-Region Replication** for disaster recovery
- **Comprehensive Monitoring** with cost optimization

### Key Features
- **Role-Based Content Access** with fine-grained permissions
- **Publishing Workflow** from submission to publication
- **Global Content Delivery** with edge optimization
- **Intelligent Tiering** for cost optimization
- **Real-Time Monitoring** with educational metrics
- **Secure Content Distribution** with signed URLs

## 📁 Directory Structure

```
infrastructure/
├── architecture-design.md          # Comprehensive architecture documentation
├── deployment-guide.md             # Step-by-step deployment instructions
├── terraform/                      # Infrastructure as Code
│   ├── main.tf                    # Main Terraform configuration
│   ├── variables.tf               # Input variables
│   ├── outputs.tf                 # Output values
│   └── modules/                   # Reusable Terraform modules
│       ├── rds/                   # Database optimization module
│       ├── ecs/                   # Container orchestration module
│       ├── monitoring/            # Observability and alerting
│       ├── vpc/                   # Network configuration
│       ├── security/              # Security groups and policies
│       ├── cloudfront/            # CDN and global distribution
│       ├── elasticache/           # Redis caching layer
│       ├── backup/                # Disaster recovery
│       ├── waf/                   # Web Application Firewall
│       └── autoscaling/           # Auto-scaling policies
└── scripts/                       # Deployment and utility scripts
    ├── migrate-data.sh            # Database migration script
    ├── deploy-blue-green.sh       # Blue-green deployment
    └── health-check.sh            # System health verification
```

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Terraform >= 1.6.0
- Docker for container builds
- kubectl for Kubernetes management (if using EKS later)

### 1. Environment Setup
```bash
# Clone and navigate to infrastructure
cd infrastructure/terraform

# Copy and customize variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your specific values

# Initialize Terraform
terraform init
```

### 2. Deploy Infrastructure
```bash
# Plan deployment
terraform plan -var-file="terraform.tfvars"

# Apply infrastructure (takes ~20 minutes)
terraform apply -var-file="terraform.tfvars"
```

### 3. Deploy Application
```bash
# Build and push container
./scripts/build-and-push.sh

# Deploy to ECS
./scripts/deploy-blue-green.sh deploy
```

## 📊 Architecture Components

### Database Layer
- **Aurora PostgreSQL 15** with Multi-AZ deployment
- **3 Read Replicas** for different workloads:
  - Dashboard queries
  - Analytics and reporting
  - Public library access
- **RDS Proxy** for connection pooling
- **Optimized indexes** for 1001 Stories' complex schema

### Application Layer
- **ECS Fargate** with auto-scaling (2-10 instances)
- **Blue-Green deployment** for zero-downtime updates
- **Application Load Balancer** with health checks
- **Sticky sessions** for auto-save functionality
- **Service discovery** for internal communication

### Caching and Storage
- **ElastiCache Redis** for session management
- **S3** for static assets and PDF storage
- **CloudFront CDN** with global distribution
- **EFS** (optional) for shared file storage

### Monitoring and Security
- **CloudWatch** with custom dashboards
- **X-Ray tracing** for performance analysis
- **AWS WAF** for application protection
- **SNS alerts** for critical events
- **CloudWatch Synthetics** for health monitoring

## 📈 Performance Specifications

### Scalability Targets
- **Concurrent Users:** 1000+ simultaneous users
- **Database Connections:** 500+ concurrent connections
- **Response Time:** <2 seconds (95th percentile)
- **API Latency:** <500ms (95th percentile)
- **Global Latency:** <200ms via CloudFront

### Availability Targets
- **Uptime:** 99.9% availability
- **RTO:** Recovery Time Objective <1 hour
- **RPO:** Recovery Point Objective <15 minutes
- **Auto-scaling Response:** <2 minutes

### Cost Optimization
- **Target Cost:** <$0.10 per active user per month
- **Infrastructure Efficiency:** 70%+ resource utilization
- **Reserved Instances:** For predictable workloads
- **Spot Instances:** For non-critical tasks

## 🔧 Configuration Examples

### Production Variables (`terraform.tfvars`)
```hcl
# Basic Configuration
aws_region = "us-east-1"
environment = "production"
domain_name = "1001stories.seedsofempowerment.org"

# Scaling Configuration
app_min_capacity = 2
app_max_capacity = 10
app_target_cpu_utilization = 70

# Database Configuration
database_backup_retention_days = 30
enable_database_deletion_protection = true

# Feature Flags
enable_xray_tracing = true
enable_waf = true
enable_cross_region_backup = true
```

### Environment-Specific Overrides
```hcl
# Staging Environment
environment = "staging"
app_min_capacity = 1
app_max_capacity = 3
database_backup_retention_days = 7
enable_database_deletion_protection = false
```

## 🔍 Monitoring and Observability

### CloudWatch Dashboards
1. **Main Dashboard:** ECS, RDS, ALB metrics
2. **Educational Metrics:** User registrations, story submissions, PDF reads
3. **Performance Dashboard:** Response times, error rates, throughput

### Custom Metrics
- **User Activity:** Registrations, logins, role assignments
- **Content Workflow:** Submissions, reviews, approvals
- **Reading Analytics:** PDF opens, reading progress, completions
- **Error Tracking:** Application errors, workflow bottlenecks

### Alerting Rules
- **Critical Alerts:** High error rates, service unavailability
- **Warning Alerts:** High resource utilization, slow responses
- **Educational Alerts:** Workflow bottlenecks, low engagement

## 🛡️ Security Implementation

### Network Security
- **VPC** with private/public subnet isolation
- **Security Groups** with least-privilege access
- **WAF** with rate limiting and attack protection
- **SSL/TLS** encryption for all communications

### Data Protection
- **Encryption at rest** for RDS and S3
- **Encryption in transit** for all services
- **KMS key management** for encryption keys
- **Secrets Manager** for sensitive configuration

### Access Control
- **IAM roles** with minimal required permissions
- **Service-specific policies** for each component
- **Cross-region access** controls for backup

## 📋 Operational Procedures

### Daily Operations
1. **Monitor** CloudWatch dashboards for anomalies
2. **Review** application logs for errors
3. **Verify** backup completion status
4. **Check** cost utilization and trends

### Weekly Operations
1. **Analyze** performance metrics and optimize
2. **Review** security alerts and incidents
3. **Update** auto-scaling policies based on usage
4. **Test** monitoring and alerting systems

### Monthly Operations
1. **Review** and optimize infrastructure costs
2. **Update** application containers and dependencies
3. **Plan** capacity based on growth trends
4. **Test** disaster recovery procedures

## 🚨 Troubleshooting Guide

### Common Issues

#### High Database Connections
```bash
# Check connection count
aws rds describe-db-cluster-performance-insight \
    --db-cluster-identifier 1001-stories-cluster

# Solutions:
# 1. Enable RDS Proxy connection pooling
# 2. Optimize application connection handling
# 3. Add read replicas for read-heavy workloads
```

#### ECS Task Failures
```bash
# Check service health
aws ecs describe-services \
    --cluster 1001-stories-cluster \
    --services 1001-stories-app-blue

# Common causes:
# 1. Insufficient memory/CPU allocation
# 2. Environment variable configuration issues
# 3. Health check endpoint failures
```

#### Performance Degradation
```bash
# Analyze with X-Ray
aws xray get-trace-summaries \
    --time-range-type TimeRangeByStartTime \
    --start-time $(date -d '1 hour ago' -u +%s) \
    --end-time $(date -u +%s)

# Common solutions:
# 1. Scale up ECS service instances
# 2. Add database read replicas
# 3. Optimize CloudFront caching
```

## 📊 Cost Analysis

### Monthly Cost Breakdown (Production)
- **ECS Fargate (3 instances):** ~$150
- **RDS Aurora (Primary + 2 replicas):** ~$300
- **ElastiCache Redis:** ~$80
- **Application Load Balancer:** ~$25
- **CloudFront CDN:** ~$30
- **S3 Storage (500GB):** ~$12
- **CloudWatch and Monitoring:** ~$20
- **Data Transfer:** ~$50
- **Total Estimated:** ~$667/month

### Cost Optimization Strategies
1. **Reserved Instances:** 30-40% savings on predictable workloads
2. **Spot Instances:** 50-70% savings for development/testing
3. **Lifecycle Policies:** Automatic archival of old data
4. **Monitoring:** Regular cost reviews and rightsizing

## 🔄 Migration Strategy

### Phase 1: Infrastructure Setup
- Deploy new AWS infrastructure
- Configure monitoring and security
- Set up CI/CD pipelines

### Phase 2: Data Migration
- Backup current Lightsail data
- Migrate database to Aurora RDS
- Transfer files to S3

### Phase 3: Application Deployment
- Deploy containerized application
- Configure load balancers
- Set up auto-scaling

### Phase 4: Traffic Cutover
- Update DNS to new infrastructure
- Monitor performance and stability
- Gradually increase traffic

### Phase 5: Optimization
- Fine-tune performance settings
- Optimize costs and resources
- Complete old infrastructure cleanup

## 📝 Documentation Links

- **[Architecture Design](architecture-design.md):** Comprehensive architecture documentation
- **[Deployment Guide](deployment-guide.md):** Step-by-step deployment instructions
- **[Terraform Modules](terraform/modules/):** Detailed module documentation
- **[Monitoring Setup](terraform/modules/monitoring/):** Observability configuration
- **[Security Policies](terraform/modules/security/):** Security implementation

## 🤝 Contributing

When contributing to infrastructure changes:

1. **Test in staging** environment first
2. **Document** all changes in pull requests
3. **Update** relevant documentation
4. **Follow** security best practices
5. **Monitor** changes post-deployment

## 📞 Support

For infrastructure support and questions:
- **Primary:** Infrastructure team lead
- **Emergency:** On-call rotation
- **Documentation:** This README and linked guides
- **Monitoring:** CloudWatch dashboards and alerts

---

This infrastructure is designed to support 1001 Stories' mission of providing global educational content while maintaining high performance, security, and cost efficiency.