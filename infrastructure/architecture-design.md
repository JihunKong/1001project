# 1001 Stories - Scalable Cloud Infrastructure Architecture

## Executive Summary

This document outlines a comprehensive cloud infrastructure optimization strategy for the 1001 Stories publishing platform to support global growth, high availability, and cost efficiency while maintaining the platform's mission of serving underserved communities worldwide.

## Current State Analysis

### Existing Infrastructure
- **Platform**: AWS Lightsail single server (3.128.143.122)
- **Architecture**: Docker Compose with nginx, Next.js app, PostgreSQL
- **Database**: Single PostgreSQL 15 instance
- **Storage**: Local volumes for uploads and PDF content
- **Deployment**: Script-based manual deployment
- **Monitoring**: Basic health checks only

### Identified Challenges
1. **Single Point of Failure**: All services on one server
2. **Database Bottlenecks**: Complex multi-role workflow queries
3. **No Auto-scaling**: Fixed capacity regardless of demand
4. **Limited Global Reach**: Single US region deployment
5. **Storage Limitations**: Local file storage for PDFs and media
6. **Manual Deployment**: Risk-prone deployment process
7. **Minimal Monitoring**: Limited visibility into performance
8. **No Disaster Recovery**: Insufficient backup automation

## Target Architecture

### High-Level Architecture Diagram

```
Internet → CloudFront (CDN) → ALB → ECS/Fargate Cluster
                                ↓
                        Auto Scaling Groups
                                ↓
                    [App1] [App2] [App3] [AppN]
                                ↓
                        ElastiCache (Redis)
                                ↓
                    RDS Primary + Read Replicas
                                ↓
                        S3 (Static Assets)
```

### Core Components

#### 1. Application Layer
- **Container Orchestration**: Amazon ECS with Fargate
- **Load Balancing**: Application Load Balancer (ALB)
- **Auto Scaling**: Target-based scaling (CPU, memory, request count)
- **Service Discovery**: AWS Cloud Map for service communication

#### 2. Database Layer
- **Primary Database**: Amazon RDS PostgreSQL Multi-AZ
- **Read Replicas**: 2-3 read replicas for query distribution
- **Connection Pooling**: RDS Proxy for connection management
- **Caching**: ElastiCache Redis for session and query caching

#### 3. Storage and CDN
- **Static Assets**: Amazon S3 with CloudFront CDN
- **PDF Storage**: S3 with presigned URLs for secure access
- **File Processing**: Lambda functions for image/PDF processing
- **Backup Storage**: S3 with Glacier for long-term retention

#### 4. Security and Networking
- **VPC**: Private subnets for application and database tiers
- **Security Groups**: Least-privilege access controls
- **WAF**: CloudFront WAF for DDoS and attack protection
- **Secrets Management**: AWS Secrets Manager for credentials

#### 5. Monitoring and Observability
- **Application Monitoring**: AWS X-Ray and CloudWatch
- **Infrastructure Monitoring**: CloudWatch, AWS Config
- **Log Aggregation**: CloudWatch Logs with custom dashboards
- **Alerting**: SNS notifications for critical events

## Detailed Implementation Plan

### Phase 1: Foundation Setup (Weeks 1-2)

#### 1.1 VPC and Networking
```hcl
# vpc.tf
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "1001-stories-vpc"
    Environment = "production"
    Project     = "1001-stories"
  }
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}"
    Type = "private"
  }
}

resource "aws_subnet" "public" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 101}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}"
    Type = "public"
  }
}
```

#### 1.2 Security Groups
```hcl
# security-groups.tf
resource "aws_security_group" "alb" {
  name_prefix = "1001-stories-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "1001-stories-alb-sg"
  }
}

resource "aws_security_group" "app" {
  name_prefix = "1001-stories-app-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "1001-stories-app-sg"
  }
}
```

### Phase 2: Database Migration and Optimization (Weeks 2-3)

#### 2.1 RDS Setup with Read Replicas
```hcl
# rds.tf
resource "aws_db_subnet_group" "main" {
  name       = "1001-stories-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "1001 Stories DB subnet group"
  }
}

resource "aws_rds_cluster" "postgresql" {
  cluster_identifier      = "1001-stories-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "stories_db"
  master_username         = "stories_admin"
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "Sun:04:00-Sun:05:00"

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "1001-stories-final-snapshot"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = "1001-stories-db-cluster"
    Environment = "production"
  }
}

resource "aws_rds_cluster_instance" "cluster_instances" {
  count              = 3
  identifier         = "1001-stories-${count.index}"
  cluster_identifier = aws_rds_cluster.postgresql.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.postgresql.engine
  engine_version     = aws_rds_cluster.postgresql.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_enhanced_monitoring.arn

  tags = {
    Name = "1001-stories-db-${count.index}"
  }
}
```

#### 2.2 Database Performance Optimization
```sql
-- database-optimization.sql

-- Create indexes for frequently queried tables
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_volunteer_submissions_status ON volunteer_submissions(status);
CREATE INDEX CONCURRENTLY idx_volunteer_submissions_reviewer ON volunteer_submissions(reviewer_id);
CREATE INDEX CONCURRENTLY idx_reading_progress_user_story ON reading_progress(user_id, story_id);
CREATE INDEX CONCURRENTLY idx_books_published ON books(is_published, created_at);

-- Optimize for workflow queries
CREATE INDEX CONCURRENTLY idx_submissions_workflow ON volunteer_submissions(status, priority, created_at);
CREATE INDEX CONCURRENTLY idx_submission_reviews_pending ON submission_reviews(status, created_at) WHERE status = 'PENDING';

-- Add partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_active_entitlements ON entitlements(user_id, book_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_published_books ON books(language, category) WHERE is_published = true;

-- Connection pooling configuration
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET track_functions = 'all';
SELECT pg_reload_conf();
```

#### 2.3 Redis Caching Strategy
```hcl
# elasticache.tf
resource "aws_elasticache_subnet_group" "main" {
  name       = "1001-stories-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "1001-stories-redis"
  description                = "Redis cluster for 1001 Stories"

  node_type                  = "cache.t3.medium"
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.redis.name

  num_cache_clusters         = 3
  automatic_failover_enabled = true
  multi_az_enabled          = true

  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  tags = {
    Name = "1001-stories-redis"
  }
}
```

### Phase 3: Application Scaling with ECS (Weeks 3-4)

#### 3.1 ECS Cluster Configuration
```hcl
# ecs.tf
resource "aws_ecs_cluster" "main" {
  name = "1001-stories-cluster"

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"

      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "1001-stories-ecs-cluster"
  }
}

resource "aws_ecs_service" "app" {
  name            = "1001-stories-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 50
  }

  enable_execute_command = true

  depends_on = [aws_lb_listener.app]

  tags = {
    Name = "1001-stories-app-service"
  }
}
```

#### 3.2 Application Load Balancer
```hcl
# alb.tf
resource "aws_lb" "main" {
  name               = "1001-stories-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = {
    Name = "1001-stories-alb"
  }
}

resource "aws_lb_target_group" "app" {
  name        = "1001-stories-app-tg"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "1001-stories-app-target-group"
  }
}
```

#### 3.3 Auto Scaling Configuration
```hcl
# autoscaling.tf
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu_scaling" {
  name               = "cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

resource "aws_appautoscaling_policy" "memory_scaling" {
  name               = "memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}
```

### Phase 4: CDN and Global Distribution (Week 4)

#### 4.1 S3 and CloudFront Setup
```hcl
# s3-cloudfront.tf
resource "aws_s3_bucket" "static_assets" {
  bucket = "1001-stories-static-assets-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "1001 Stories Static Assets"
    Environment = "production"
  }
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name              = aws_lb.main.dns_name
    origin_id                = "ALB-1001-stories"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id   = "S3-static-assets"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.s3.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  aliases = ["1001stories.seedsofempowerment.org", "www.1001stories.org"]

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-1001-stories"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Host", "CloudFront-Forwarded-Proto"]

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  ordered_cache_behavior {
    path_pattern           = "/static/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-static-assets"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  ordered_cache_behavior {
    path_pattern           = "/books/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-static-assets"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "CloudFront-Viewer-Country"]
      cookies {
        forward = "whitelist"
        whitelisted_names = ["session"]
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }

  web_acl_id = aws_wafv2_web_acl.main.arn

  tags = {
    Name = "1001-stories-cloudfront"
  }
}
```

### Phase 5: Monitoring and Observability (Week 5)

#### 5.1 CloudWatch Dashboards and Alarms
```hcl
# monitoring.tf
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "1001-Stories-Production"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.app.name, "ClusterName", aws_ecs_cluster.main.name],
            [".", "MemoryUtilization", ".", ".", ".", "."],
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "ECS Service Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", aws_rds_cluster.postgresql.cluster_identifier],
            [".", "CPUUtilization", ".", "."],
            [".", "FreeableMemory", ".", "."],
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "RDS Cluster Metrics"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          query   = "SOURCE '/aws/ecs/1001-stories-app' | fields @timestamp, @message | sort @timestamp desc | limit 100"
          region  = "us-east-1"
          title   = "Application Logs"
          view    = "table"
        }
      }
    ]
  })
}

# Critical Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "1001-stories-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors ecs cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "1001-stories-high-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "1001-stories-db-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Database connection count is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.postgresql.cluster_identifier
  }
}
```

#### 5.2 Application Performance Monitoring Setup
```javascript
// apm-config.js - Application monitoring configuration
const AWS = require('aws-sdk');
const AWSXRay = require('aws-xray-sdk-core');

// X-Ray tracing configuration
AWSXRay.config([
  AWSXRay.plugins.ECSPlugin,
  AWSXRay.plugins.EC2Plugin,
]);

// Instrument AWS SDK
const aws = AWSXRay.captureAWS(AWS);

// Custom middleware for Next.js performance monitoring
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Create X-Ray subsegment for request
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('request-processing');

  subsegment.addAnnotation('method', req.method);
  subsegment.addAnnotation('url', req.url);
  subsegment.addAnnotation('userRole', req.user?.role || 'anonymous');

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    subsegment.addMetadata('response', {
      statusCode: res.statusCode,
      duration: duration,
      contentLength: res.get('content-length'),
    });

    // Log slow requests
    if (duration > 2000) {
      console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }

    subsegment.close();
  });

  next();
};

// Database query monitoring
const monitorDatabaseQueries = (prisma) => {
  const originalQuery = prisma._engine.query.bind(prisma._engine);

  prisma._engine.query = async (query, parameters) => {
    const startTime = Date.now();
    const subsegment = AWSXRay.getSegment()?.addNewSubsegment('database-query');

    try {
      subsegment?.addAnnotation('query', query.slice(0, 100));
      const result = await originalQuery(query, parameters);

      const duration = Date.now() - startTime;
      subsegment?.addMetadata('query-stats', {
        duration,
        rowsAffected: result.affectedRows || 0,
      });

      if (duration > 1000) {
        console.warn(`Slow database query: ${duration}ms`);
      }

      return result;
    } catch (error) {
      subsegment?.addError(error);
      throw error;
    } finally {
      subsegment?.close();
    }
  };
};

module.exports = {
  performanceMiddleware,
  monitorDatabaseQueries,
};
```

### Phase 6: Backup and Disaster Recovery (Week 6)

#### 6.1 Automated Backup Strategy
```hcl
# backup.tf
resource "aws_backup_vault" "main" {
  name        = "1001-stories-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn

  tags = {
    Name = "1001 Stories Backup Vault"
  }
}

resource "aws_backup_plan" "main" {
  name = "1001-stories-backup-plan"

  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 4 ? * * *)"

    recovery_point_tags = {
      Environment = "production"
      Project     = "1001-stories"
    }

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.cross_region.arn

      lifecycle {
        cold_storage_after = 30
        delete_after       = 365
      }
    }
  }

  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 ? * SUN *)"

    recovery_point_tags = {
      Environment = "production"
      Project     = "1001-stories"
      Type        = "weekly"
    }

    lifecycle {
      cold_storage_after = 90
      delete_after       = 2555  # 7 years
    }
  }

  tags = {
    Name = "1001 Stories Backup Plan"
  }
}

# Cross-region backup for disaster recovery
resource "aws_backup_vault" "cross_region" {
  provider    = aws.backup_region
  name        = "1001-stories-backup-vault-dr"
  kms_key_arn = aws_kms_key.backup_dr.arn

  tags = {
    Name = "1001 Stories DR Backup Vault"
  }
}
```

#### 6.2 Database Point-in-Time Recovery
```hcl
# Enable enhanced monitoring and point-in-time recovery
resource "aws_rds_cluster" "postgresql" {
  # ... existing configuration ...

  backup_retention_period   = 30
  preferred_backup_window  = "03:00-04:00"
  copy_tags_to_snapshot    = true
  deletion_protection      = true

  # Point-in-time recovery
  backup_retention_period = 30

  # Enhanced monitoring
  enabled_cloudwatch_logs_exports = [
    "postgresql"
  ]

  # Automated backup configuration
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"

  # Cross-region automated backups
  replication_source_identifier = var.source_region != var.region ? aws_rds_cluster.postgresql.arn : null
}
```

### Phase 7: Zero-Downtime Deployment (Week 7)

#### 7.1 Blue-Green Deployment Strategy
```hcl
# blue-green-deployment.tf
resource "aws_ecs_service" "app_blue" {
  name            = "1001-stories-app-blue"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.blue_green_deployment ? 0 : 3
  launch_type     = "FARGATE"

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_blue.arn
    container_name   = "app"
    container_port   = 3000
  }

  tags = {
    Name = "1001-stories-app-blue"
    Slot = "blue"
  }
}

resource "aws_ecs_service" "app_green" {
  name            = "1001-stories-app-green"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.blue_green_deployment ? 3 : 0
  launch_type     = "FARGATE"

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_green.arn
    container_name   = "app"
    container_port   = 3000
  }

  tags = {
    Name = "1001-stories-app-green"
    Slot = "green"
  }
}
```

#### 7.2 Deployment Automation Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: 1001-stories-app
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Blue-Green Deployment
        env:
          CLUSTER_NAME: 1001-stories-cluster
          SERVICE_NAME: 1001-stories-app
        run: |
          # Determine current active slot
          ACTIVE_SLOT=$(aws elbv2 describe-target-groups \
            --names 1001-stories-app-tg \
            --query 'TargetGroups[0].Tags[?Key==`ActiveSlot`].Value' \
            --output text)

          if [ "$ACTIVE_SLOT" = "blue" ]; then
            INACTIVE_SLOT="green"
          else
            INACTIVE_SLOT="blue"
          fi

          # Update inactive slot with new image
          aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service 1001-stories-app-$INACTIVE_SLOT \
            --task-definition 1001-stories-app:LATEST \
            --desired-count 3

          # Wait for deployment to complete
          aws ecs wait services-stable \
            --cluster $CLUSTER_NAME \
            --services 1001-stories-app-$INACTIVE_SLOT

          # Health check on inactive slot
          HEALTH_CHECK_URL="https://1001stories.seedsofempowerment.org/api/health"
          for i in {1..10}; do
            if curl -f $HEALTH_CHECK_URL; then
              echo "Health check passed"
              break
            fi
            sleep 30
          done

          # Switch traffic to new slot
          aws elbv2 modify-listener \
            --listener-arn $ALB_LISTENER_ARN \
            --default-actions Type=forward,TargetGroupArn=$INACTIVE_TG_ARN

          # Scale down old slot
          aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service 1001-stories-app-$ACTIVE_SLOT \
            --desired-count 0
```

## Cost Optimization Strategy

### 1. Resource Right-Sizing
- **RDS**: Start with db.r6g.large instances, monitor and adjust
- **ECS**: Use Fargate Spot for non-critical workloads
- **CloudFront**: Optimize cache behaviors to reduce origin requests
- **S3**: Implement lifecycle policies for aging data

### 2. Reserved Capacity Planning
```hcl
# reserved-instances.tf
resource "aws_rds_reserved_instance" "postgresql" {
  count                = 2
  instance_class       = "db.r6g.large"
  instance_count       = 1
  offering_type        = "Partial Upfront"
  duration             = "31536000"  # 1 year
  product_description  = "postgresql"

  tags = {
    Name = "1001-stories-rds-ri"
  }
}

# Savings Plans for compute
resource "aws_savingsplans_plan" "compute" {
  savings_plan_type = "Compute"
  term             = "1"
  payment_option   = "Partial Upfront"
  hourly_commitment = "50"  # $50/hour commitment

  tags = {
    Name = "1001-stories-compute-savings"
  }
}
```

### 3. Automated Cost Monitoring
```hcl
# cost-monitoring.tf
resource "aws_budgets_budget" "monthly" {
  name         = "1001-stories-monthly-budget"
  budget_type  = "COST"
  limit_amount = "500"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filters = {
    Tag = [
      "Project:1001-stories"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = ["admin@1001stories.org"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = ["admin@1001stories.org"]
  }
}
```

## Security Implementation

### 1. Web Application Firewall (WAF)
```hcl
# waf.tf
resource "aws_wafv2_web_acl" "main" {
  name  = "1001-stories-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    override_action {
      none {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "1001StoriesWAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "1001-stories-waf"
  }
}
```

### 2. Secrets Management
```hcl
# secrets.tf
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "1001-stories/app/production"
  description             = "Application secrets for 1001 Stories"
  recovery_window_in_days = 30

  tags = {
    Name = "1001-stories-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${aws_rds_cluster.postgresql.master_username}:${random_password.db_password.result}@${aws_rds_cluster.postgresql.endpoint}:5432/stories_db"
    NEXTAUTH_SECRET = random_password.nextauth_secret.result
    REDIS_URL = aws_elasticache_replication_group.redis.configuration_endpoint_address
    OPENAI_API_KEY = var.openai_api_key
    UPSTAGE_API_KEY = var.upstage_api_key
  })
}
```

## Performance Testing and Capacity Planning

### 1. Load Testing Configuration
```javascript
// load-test.js - K6 load testing script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],      // Error rate must be below 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'https://1001stories.seedsofempowerment.org';

export default function() {
  // Test scenarios for different user roles
  let scenarios = [
    testHomePage,
    testBookListing,
    testBookReading,
    testSubmissionWorkflow,
    testAPI,
  ];

  let scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

function testHomePage() {
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage load time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
}

function testBookListing() {
  let response = http.get(`${BASE_URL}/library`);
  check(response, {
    'library status is 200': (r) => r.status === 200,
    'library load time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);
}

function testBookReading() {
  // Simulate PDF loading
  let response = http.get(`${BASE_URL}/books/sample-book-1`);
  check(response, {
    'book page status is 200': (r) => r.status === 200,
    'book load time < 3s': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1);
}

function testSubmissionWorkflow() {
  // Test submission form
  let response = http.get(`${BASE_URL}/dashboard/volunteer`);
  check(response, {
    'volunteer dashboard status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
}

function testAPI() {
  let response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'API health status is 200': (r) => r.status === 200,
    'API response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
}
```

### 2. Capacity Planning Model
```python
# capacity-planning.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt

class CapacityPlanner:
    def __init__(self):
        self.baseline_metrics = {
            'concurrent_users': 100,
            'requests_per_second': 50,
            'db_connections': 20,
            'cpu_utilization': 40,
            'memory_utilization': 60,
        }

    def project_growth(self, months=12, growth_rate=0.1):
        """Project infrastructure needs based on growth rate"""
        projections = []

        for month in range(months):
            growth_factor = (1 + growth_rate) ** month

            projection = {
                'month': month + 1,
                'date': datetime.now() + timedelta(days=30 * month),
                'concurrent_users': int(self.baseline_metrics['concurrent_users'] * growth_factor),
                'requests_per_second': int(self.baseline_metrics['requests_per_second'] * growth_factor),
                'db_connections': int(self.baseline_metrics['db_connections'] * growth_factor),
                'cpu_utilization': min(90, self.baseline_metrics['cpu_utilization'] * growth_factor),
                'memory_utilization': min(90, self.baseline_metrics['memory_utilization'] * growth_factor),
            }

            # Calculate required instances
            projection['required_app_instances'] = max(2, int(projection['concurrent_users'] / 50))
            projection['required_db_replicas'] = max(1, int(projection['db_connections'] / 100))

            projections.append(projection)

        return pd.DataFrame(projections)

    def generate_scaling_recommendations(self, projections):
        """Generate scaling recommendations based on projections"""
        recommendations = []

        for _, row in projections.iterrows():
            if row['month'] in [3, 6, 9, 12]:  # Quarterly reviews
                recommendations.append({
                    'month': row['month'],
                    'action': 'SCALE_UP' if row['cpu_utilization'] > 70 else 'MONITOR',
                    'app_instances': row['required_app_instances'],
                    'db_replicas': row['required_db_replicas'],
                    'estimated_cost': self.estimate_monthly_cost(
                        row['required_app_instances'],
                        row['required_db_replicas']
                    )
                })

        return recommendations

    def estimate_monthly_cost(self, app_instances, db_replicas):
        """Estimate monthly AWS costs"""
        costs = {
            'fargate': app_instances * 50,  # $50 per instance per month
            'rds': (1 + db_replicas) * 150,  # Primary + replicas
            'elasticache': 80,  # Redis cluster
            'cloudfront': 30,   # CDN
            'alb': 25,          # Load balancer
            's3': 50,           # Storage
            'monitoring': 20,   # CloudWatch
        }

        return sum(costs.values())

# Generate 12-month capacity planning report
planner = CapacityPlanner()
projections = planner.project_growth(months=12, growth_rate=0.15)  # 15% monthly growth
recommendations = planner.generate_scaling_recommendations(projections)

print("=== 1001 Stories Capacity Planning Report ===")
print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("\nProjected Growth (Next 12 Months):")
print(projections[['month', 'concurrent_users', 'required_app_instances', 'required_db_replicas']].to_string())

print("\nScaling Recommendations:")
for rec in recommendations:
    print(f"Month {rec['month']}: {rec['action']} - "
          f"App Instances: {rec['app_instances']}, "
          f"DB Replicas: {rec['db_replicas']}, "
          f"Est. Cost: ${rec['estimated_cost']:,.2f}/month")
```

## Migration Roadmap

### Week-by-Week Implementation Schedule

| Week | Phase | Key Activities | Deliverables |
|------|-------|----------------|--------------|
| 1 | Infrastructure Setup | VPC, Security Groups, IAM Roles | Terraform templates |
| 2 | Database Migration | RDS setup, data migration, read replicas | Database cluster |
| 3 | Application Migration | ECS setup, container migration | Containerized app |
| 4 | CDN & Global Distribution | CloudFront, S3, global optimization | Global delivery |
| 5 | Monitoring Implementation | CloudWatch, X-Ray, alerting | Full observability |
| 6 | Backup & DR Setup | Automated backups, cross-region DR | Disaster recovery |
| 7 | Deployment Automation | CI/CD, blue-green deployment | Zero-downtime deployment |
| 8 | Testing & Optimization | Load testing, performance tuning | Production-ready system |

### Risk Mitigation

1. **Data Loss Prevention**
   - Full database backup before migration
   - Incremental sync during migration
   - Rollback procedures tested

2. **Service Interruption**
   - Blue-green deployment strategy
   - Health checks at every stage
   - Automated rollback triggers

3. **Cost Overruns**
   - Budget alerts and limits
   - Resource tagging for cost tracking
   - Regular cost optimization reviews

4. **Security Vulnerabilities**
   - Security scanning in CI/CD
   - Regular penetration testing
   - Compliance monitoring

## Success Metrics

### Performance KPIs
- **Page Load Time**: < 2 seconds (95th percentile)
- **API Response Time**: < 500ms (95th percentile)
- **Database Query Time**: < 100ms (average)
- **Uptime**: 99.9% availability

### Scalability KPIs
- **Concurrent Users**: Support 1000+ simultaneous users
- **Auto-scaling Response**: < 2 minutes to scale up/down
- **Database Connections**: 500+ concurrent connections
- **Global Latency**: < 200ms response time globally

### Cost KPIs
- **Cost Per User**: < $0.10 per active user per month
- **Infrastructure Efficiency**: 70%+ resource utilization
- **Cost Growth Rate**: < 50% of user growth rate

### Reliability KPIs
- **RTO**: Recovery Time Objective < 1 hour
- **RPO**: Recovery Point Objective < 15 minutes
- **MTTR**: Mean Time To Recovery < 30 minutes
- **Error Rate**: < 0.1% of all requests

This comprehensive infrastructure design provides a solid foundation for 1001 Stories to scale globally while maintaining cost efficiency and high availability for its educational mission.