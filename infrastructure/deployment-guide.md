# 1001 Stories - Infrastructure Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the scalable cloud infrastructure for 1001 Stories, migrating from the current AWS Lightsail setup to a highly available, auto-scaling architecture on AWS.

## Prerequisites

### Required Tools
```bash
# Install Terraform
brew install terraform  # macOS
# or
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip

# Install AWS CLI
brew install awscli  # macOS
# or
pip install awscli

# Install Docker
# Follow official Docker installation guide for your platform

# Install kubectl (for EKS if needed later)
brew install kubectl
```

### Required AWS Permissions
Ensure your AWS credentials have the following permissions:
- EC2 Full Access
- RDS Full Access
- ECS Full Access
- CloudFormation Full Access
- IAM Full Access
- S3 Full Access
- CloudWatch Full Access
- Route53 Full Access

### Environment Setup
```bash
# Configure AWS CLI
aws configure
# Enter your Access Key ID, Secret Access Key, and preferred region

# Verify access
aws sts get-caller-identity
```

## Phase 1: Pre-Migration Setup (Week 1)

### 1.1 Create S3 Backend for Terraform State

```bash
# Create unique bucket name
BUCKET_NAME="1001-stories-terraform-state-$(date +%s)"
REGION="us-east-1"

# Create S3 bucket for Terraform state
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
    --table-name terraform-state-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $REGION
```

### 1.2 SSL Certificate Setup

```bash
# Request SSL certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
    --domain-name "1001stories.seedsofempowerment.org" \
    --subject-alternative-names "*.1001stories.seedsofempowerment.org" \
    --validation-method DNS \
    --region us-east-1

# Note the certificate ARN for later use
```

### 1.3 Secrets Manager Setup

```bash
# Create secrets for sensitive data
aws secretsmanager create-secret \
    --name "1001-stories/openai-api-key" \
    --description "OpenAI API key for 1001 Stories" \
    --secret-string "your-openai-api-key-here"

aws secretsmanager create-secret \
    --name "1001-stories/smtp-password" \
    --description "SMTP password for email service" \
    --secret-string "your-smtp-password-here"
```

### 1.4 ECR Repository Setup

```bash
# Create ECR repository for application images
aws ecr create-repository \
    --repository-name 1001-stories-app \
    --region us-east-1

# Get login token and login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push initial image
cd /path/to/1001-stories
docker build -t 1001-stories-app .
docker tag 1001-stories-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/1001-stories-app:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/1001-stories-app:latest
```

## Phase 2: Data Backup and Migration Preparation (Week 1-2)

### 2.1 Current Data Backup

```bash
# SSH to current Lightsail instance
ssh -i /Users/jihunkong/Downloads/1001project.pem ubuntu@3.128.143.122

# Create database backup
sudo docker exec 1001-stories-db pg_dump -U stories_user -d stories_db > /tmp/1001-stories-backup-$(date +%Y%m%d).sql

# Backup uploaded files
sudo tar -czf /tmp/1001-stories-files-$(date +%Y%m%d).tar.gz /opt/1001-stories/public/books /opt/1001-stories/uploads

# Download backups to local machine
scp -i /Users/jihunkong/Downloads/1001project.pem ubuntu@3.128.143.122:/tmp/1001-stories-backup-$(date +%Y%m%d).sql ./
scp -i /Users/jihunkong/Downloads/1001project.pem ubuntu@3.128.143.122:/tmp/1001-stories-files-$(date +%Y%m%d).tar.gz ./
```

### 2.2 Upload Backups to S3

```bash
# Create backup bucket
aws s3 mb s3://1001-stories-migration-backup-$(date +%s)

# Upload database backup
aws s3 cp 1001-stories-backup-$(date +%Y%m%d).sql s3://1001-stories-migration-backup/database/

# Upload file backup
aws s3 cp 1001-stories-files-$(date +%Y%m%d).tar.gz s3://1001-stories-migration-backup/files/
```

## Phase 3: Infrastructure Deployment (Week 2-3)

### 3.1 Configure Terraform Variables

Create `terraform.tfvars` file:

```hcl
# terraform.tfvars
aws_region = "us-east-1"
backup_region = "us-west-2"
environment = "production"

# Domain and SSL
domain_name = "1001stories.seedsofempowerment.org"
ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"

# Alerts
alert_email = "admin@1001stories.org"

# Secrets Manager ARNs
openai_api_key_secret_arn = "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:1001-stories/openai-api-key"
smtp_password_secret_arn = "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:1001-stories/smtp-password"

# Performance settings
app_min_capacity = 2
app_max_capacity = 10
app_target_cpu_utilization = 70

# Feature flags
enable_xray_tracing = true
enable_waf = true
enable_cross_region_backup = true
```

### 3.2 Initialize and Deploy Infrastructure

```bash
# Navigate to terraform directory
cd infrastructure/terraform

# Update backend configuration with your bucket name
# Edit main.tf backend "s3" block with your bucket name

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan -var-file="terraform.tfvars"

# Apply infrastructure (this will take 15-20 minutes)
terraform apply -var-file="terraform.tfvars"
```

### 3.3 Verify Infrastructure Deployment

```bash
# Check ECS cluster
aws ecs describe-clusters --clusters 1001-stories-cluster

# Check RDS cluster
aws rds describe-db-clusters --db-cluster-identifier 1001-stories-cluster

# Check ALB
aws elbv2 describe-load-balancers --names 1001-stories-alb

# Check CloudFront distribution
aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`1001 Stories CDN`]'
```

## Phase 4: Database Migration (Week 3)

### 4.1 Restore Database to New RDS Cluster

```bash
# Get RDS endpoint from Terraform output
RDS_ENDPOINT=$(terraform output -raw database_endpoint)
RDS_PASSWORD=$(terraform output -raw database_password)

# Connect to new RDS instance and restore data
psql -h $RDS_ENDPOINT -U stories_admin -d stories_db < 1001-stories-backup-$(date +%Y%m%d).sql

# Verify data integrity
psql -h $RDS_ENDPOINT -U stories_admin -d stories_db -c "SELECT COUNT(*) FROM users;"
psql -h $RDS_ENDPOINT -U stories_admin -d stories_db -c "SELECT COUNT(*) FROM books;"
```

### 4.2 Run Database Optimization

```bash
# Connect to RDS and run optimization script
psql -h $RDS_ENDPOINT -U stories_admin -d stories_db << 'EOF'
-- Create optimized indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_volunteer_submissions_status ON volunteer_submissions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_volunteer_submissions_reviewer ON volunteer_submissions(reviewer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_progress_user_story ON reading_progress(user_id, story_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_published ON books(is_published, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_volunteer_submissions_workflow ON volunteer_submissions(status, priority, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_reviews_pending ON submission_reviews(status, created_at) WHERE status = 'PENDING';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_entitlements ON entitlements(user_id, book_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_published_books ON books(language, category) WHERE is_published = true;

-- Update statistics
ANALYZE;

-- Show index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename IN ('users', 'books', 'volunteer_submissions', 'reading_progress');
EOF
```

## Phase 5: File Migration to S3 (Week 3)

### 5.1 Upload Files to S3

```bash
# Get S3 bucket name from Terraform output
S3_BUCKET=$(terraform output -raw s3_bucket_name)

# Extract and upload files
tar -xzf 1001-stories-files-$(date +%Y%m%d).tar.gz

# Upload PDFs to S3 with proper structure
aws s3 sync extracted/opt/1001-stories/public/books/ s3://$S3_BUCKET/books/ --delete

# Upload other assets
aws s3 sync extracted/opt/1001-stories/uploads/ s3://$S3_BUCKET/uploads/ --delete

# Set proper permissions
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$S3_BUCKET'/books/*"
    }
  ]
}'
```

## Phase 6: Application Deployment (Week 3-4)

### 6.1 Update Environment Variables

```bash
# Update ECS task definition with new environment variables
cat > task-definition-update.json << EOF
{
  "family": "1001-stories-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "$(terraform output -raw execution_role_arn)",
  "taskRoleArn": "$(terraform output -raw task_role_arn)",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/1001-stories-app:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "$(terraform output -raw database_connection_string)"
        },
        {
          "name": "REDIS_URL",
          "value": "$(terraform output -raw redis_endpoint)"
        },
        {
          "name": "NEXTAUTH_URL",
          "value": "https://1001stories.seedsofempowerment.org"
        },
        {
          "name": "S3_BUCKET_NAME",
          "value": "$(terraform output -raw s3_bucket_name)"
        },
        {
          "name": "CLOUDFRONT_DOMAIN",
          "value": "$(terraform output -raw cloudfront_domain)"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "$(terraform output -raw openai_secret_arn)"
        },
        {
          "name": "SMTP_PASSWORD",
          "valueFrom": "$(terraform output -raw smtp_secret_arn)"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/1001-stories-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register new task definition
aws ecs register-task-definition --cli-input-json file://task-definition-update.json
```

### 6.2 Deploy to ECS

```bash
# Update ECS service with new task definition
aws ecs update-service \
    --cluster 1001-stories-cluster \
    --service 1001-stories-app-blue \
    --task-definition 1001-stories-app:LATEST \
    --desired-count 3

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster 1001-stories-cluster \
    --services 1001-stories-app-blue

# Check service status
aws ecs describe-services \
    --cluster 1001-stories-cluster \
    --services 1001-stories-app-blue
```

## Phase 7: DNS and Traffic Cutover (Week 4)

### 7.1 Update DNS Records

```bash
# Get ALB DNS name
ALB_DNS_NAME=$(terraform output -raw alb_dns_name)
ALB_ZONE_ID=$(terraform output -raw alb_zone_id)

# Update Route53 record to point to new ALB
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch '{
      "Changes": [
        {
          "Action": "UPSERT",
          "ResourceRecordSet": {
            "Name": "1001stories.seedsofempowerment.org",
            "Type": "A",
            "AliasTarget": {
              "DNSName": "'$ALB_DNS_NAME'",
              "EvaluateTargetHealth": true,
              "HostedZoneId": "'$ALB_ZONE_ID'"
            }
          }
        }
      ]
    }'
```

### 7.2 Health Check and Verification

```bash
# Wait for DNS propagation
sleep 300

# Test health endpoint
curl -f https://1001stories.seedsofempowerment.org/api/health

# Test main application
curl -f https://1001stories.seedsofempowerment.org/

# Test library page
curl -f https://1001stories.seedsofempowerment.org/library

# Test login page
curl -f https://1001stories.seedsofempowerment.org/login

# Monitor application logs
aws logs tail /ecs/1001-stories-app --follow
```

## Phase 8: Performance Testing and Optimization (Week 4)

### 8.1 Load Testing

```bash
# Install K6 for load testing
brew install k6

# Run load test
k6 run - <<'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  let response = http.get('https://1001stories.seedsofempowerment.org');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
EOF
```

### 8.2 Monitor Performance Metrics

```bash
# Check CloudWatch dashboard
echo "Dashboard URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=1001-stories-main-dashboard"

# Check auto scaling activity
aws application-autoscaling describe-scaling-activities \
    --service-namespace ecs \
    --resource-id service/1001-stories-cluster/1001-stories-app-blue

# Check RDS performance
aws rds describe-db-cluster-performance-insight \
    --db-cluster-identifier 1001-stories-cluster
```

## Phase 9: Monitoring and Alerting Setup (Week 4)

### 9.1 Verify Monitoring

```bash
# Test SNS notifications
aws sns publish \
    --topic-arn $(terraform output -raw critical_alerts_topic_arn) \
    --message "Test critical alert for 1001 Stories infrastructure"

# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/ecs/1001-stories"

# Verify X-Ray tracing
aws xray get-trace-summaries \
    --time-range-type TimeRangeByStartTime \
    --start-time $(date -d '1 hour ago' -u +%s) \
    --end-time $(date -u +%s)
```

### 9.2 Set Up Custom Metrics

```bash
# Create custom metric for user activity
aws cloudwatch put-metric-data \
    --namespace "1001Stories/Users" \
    --metric-data MetricName=ActiveUsers,Value=100,Unit=Count

# Test application-specific metrics
curl -X POST https://1001stories.seedsofempowerment.org/api/metrics/test
```

## Phase 10: Cleanup and Documentation (Week 4)

### 10.1 Decommission Old Infrastructure

```bash
# Once new infrastructure is stable (after 1 week), cleanup old Lightsail instance
# Note: Do this only after confirming everything works correctly

# Stop old Lightsail instance (DO NOT DELETE YET)
aws lightsail stop-instance --instance-name 1001-stories-production

# Create final snapshot
aws lightsail create-instance-snapshot \
    --instance-name 1001-stories-production \
    --instance-snapshot-name final-migration-snapshot-$(date +%Y%m%d)
```

### 10.2 Update Documentation

```bash
# Update deployment documentation
# Update monitoring runbooks
# Update incident response procedures
# Update backup and recovery procedures
```

## Rollback Procedures

### Emergency Rollback to Lightsail

If issues arise during migration:

```bash
# 1. Update DNS back to Lightsail
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch '{
      "Changes": [
        {
          "Action": "UPSERT",
          "ResourceRecordSet": {
            "Name": "1001stories.seedsofempowerment.org",
            "Type": "A",
            "TTL": 300,
            "ResourceRecords": [
              {
                "Value": "3.128.143.122"
              }
            ]
          }
        }
      ]
    }'

# 2. Start Lightsail instance
aws lightsail start-instance --instance-name 1001-stories-production

# 3. Verify old system is working
curl -f https://1001stories.seedsofempowerment.org/api/health
```

### Partial Rollback Options

```bash
# Rollback database only (use RDS but revert application)
# Update application environment to point back to Lightsail

# Rollback specific components
terraform destroy -target=aws_ecs_service.app_blue
terraform destroy -target=aws_lb.main
```

## Cost Optimization Post-Migration

### 1. Reserved Instances

```bash
# Purchase RDS Reserved Instances (after 30 days of usage data)
aws rds purchase-reserved-db-instances-offering \
    --reserved-db-instances-offering-id OFFERING_ID \
    --reserved-db-instance-id 1001-stories-rds-ri

# Purchase EC2 Savings Plans for ECS Fargate
# Do this through AWS Console after analyzing usage patterns
```

### 2. Monitoring and Optimization

```bash
# Set up AWS Cost Explorer alerts
aws ce create-anomaly-detector \
    --anomaly-detector Name="1001-stories-cost-anomaly",MonitorType="DIMENSIONAL"

# Review resource utilization weekly
aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ServiceName,Value=1001-stories-app-blue \
    --start-time $(date -d '7 days ago' -u +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Average
```

## Security Hardening

### 1. Enable GuardDuty

```bash
aws guardduty create-detector \
    --enable \
    --finding-publishing-frequency FIFTEEN_MINUTES
```

### 2. Enable Config

```bash
aws configservice put-configuration-recorder \
    --configuration-recorder name=1001-stories-config,roleARN=arn:aws:iam::ACCOUNT:role/config-role

aws configservice put-delivery-channel \
    --delivery-channel name=1001-stories-config,s3BucketName=1001-stories-config-bucket
```

### 3. Enable CloudTrail

```bash
aws cloudtrail create-trail \
    --name 1001-stories-audit-trail \
    --s3-bucket-name 1001-stories-audit-logs \
    --include-global-service-events \
    --is-multi-region-trail
```

## Support and Maintenance

### Daily Checks
1. Check CloudWatch dashboard for anomalies
2. Review error logs in CloudWatch
3. Verify backup completion
4. Monitor cost in AWS Cost Explorer

### Weekly Checks
1. Review performance metrics and optimize
2. Check security alerts in GuardDuty
3. Review and update auto-scaling policies
4. Analyze application-specific metrics

### Monthly Checks
1. Review and optimize costs
2. Update and patch application containers
3. Review capacity planning metrics
4. Test disaster recovery procedures

## Troubleshooting Common Issues

### High Database Connections
```bash
# Check current connections
aws rds describe-db-cluster-performance-insight \
    --db-cluster-identifier 1001-stories-cluster

# Scale up connection limit if needed
aws rds modify-db-cluster \
    --db-cluster-identifier 1001-stories-cluster \
    --db-cluster-parameter-group-name 1001-stories-cluster-params-high-conn
```

### ECS Task Failures
```bash
# Check task logs
aws ecs describe-tasks \
    --cluster 1001-stories-cluster \
    --tasks $(aws ecs list-tasks --cluster 1001-stories-cluster --query 'taskArns[0]' --output text)

# Check service events
aws ecs describe-services \
    --cluster 1001-stories-cluster \
    --services 1001-stories-app-blue \
    --query 'services[0].events[0:5]'
```

### Performance Issues
```bash
# Enable X-Ray tracing for detailed analysis
aws xray get-trace-summaries \
    --time-range-type TimeRangeByStartTime \
    --start-time $(date -d '1 hour ago' -u +%s) \
    --end-time $(date -u +%s) \
    --filter-expression "service(\"1001-stories-app\")"

# Check ALB response times
aws cloudwatch get-metric-statistics \
    --namespace AWS/ApplicationELB \
    --metric-name TargetResponseTime \
    --dimensions Name=LoadBalancer,Value=$(terraform output -raw alb_arn_suffix) \
    --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average,Maximum
```

This deployment guide provides a comprehensive roadmap for migrating from the current AWS Lightsail setup to a scalable, highly available infrastructure that can support 1001 Stories' global educational mission.