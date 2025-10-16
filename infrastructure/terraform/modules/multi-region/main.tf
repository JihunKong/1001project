# Multi-Region Deployment Module for 1001 Stories
# Global deployment: US, EU, APAC with disaster recovery

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
      configuration_aliases = [
        aws.us_east_1,
        aws.eu_west_1,
        aws.ap_southeast_1,
        aws.backup_region
      ]
    }
  }
}

# Local values for region-specific configurations
locals {
  regions = {
    primary = {
      name        = "us-east-1"
      description = "Primary region - US East (Virginia)"
      capacity    = var.primary_region_capacity
    }
    europe = {
      name        = "eu-west-1"
      description = "Europe region - EU West (Ireland)"
      capacity    = var.secondary_region_capacity
    }
    asia = {
      name        = "ap-southeast-1"
      description = "Asia Pacific region - AP Southeast (Singapore)"
      capacity    = var.secondary_region_capacity
    }
    backup = {
      name        = var.backup_region
      description = "Disaster recovery region"
      capacity    = var.disaster_recovery_capacity
    }
  }

  # RTO/RPO targets
  rto_target_seconds = 3600    # 1 hour Recovery Time Objective
  rpo_target_seconds = 900     # 15 minutes Recovery Point Objective
}

# Primary Region Infrastructure (US East 1)
module "primary_region" {
  source = "../regional-stack"

  providers = {
    aws = aws.us_east_1
  }

  name_prefix     = var.name_prefix
  environment     = var.environment
  region_name     = "us-east-1"
  is_primary      = true

  # Scaling configuration
  min_capacity    = local.regions.primary.capacity.min
  max_capacity    = local.regions.primary.capacity.max
  desired_capacity = local.regions.primary.capacity.desired

  # Database configuration
  enable_cross_region_backup = true
  backup_regions            = [local.regions.europe.name, local.regions.backup.name]

  # Monitoring and alerting
  enable_enhanced_monitoring = true
  alert_emails              = var.primary_region_alerts

  tags = merge(var.tags, {
    Region = "primary"
    Role   = "production"
  })
}

# Europe Region Infrastructure (EU West 1)
module "europe_region" {
  source = "../regional-stack"

  providers = {
    aws = aws.eu_west_1
  }

  name_prefix     = var.name_prefix
  environment     = var.environment
  region_name     = "eu-west-1"
  is_primary      = false

  # Scaling configuration
  min_capacity    = local.regions.europe.capacity.min
  max_capacity    = local.regions.europe.capacity.max
  desired_capacity = local.regions.europe.capacity.desired

  # Database - read replica configuration
  primary_database_arn = module.primary_region.database_cluster_arn
  enable_read_replicas = true

  # Monitoring and alerting
  enable_enhanced_monitoring = true
  alert_emails              = var.secondary_region_alerts

  tags = merge(var.tags, {
    Region = "europe"
    Role   = "secondary"
  })
}

# Asia Pacific Region Infrastructure (AP Southeast 1)
module "asia_region" {
  source = "../regional-stack"

  providers = {
    aws = aws.ap_southeast_1
  }

  name_prefix     = var.name_prefix
  environment     = var.environment
  region_name     = "ap-southeast-1"
  is_primary      = false

  # Scaling configuration
  min_capacity    = local.regions.asia.capacity.min
  max_capacity    = local.regions.asia.capacity.max
  desired_capacity = local.regions.asia.capacity.desired

  # Database - read replica configuration
  primary_database_arn = module.primary_region.database_cluster_arn
  enable_read_replicas = true

  # Monitoring and alerting
  enable_enhanced_monitoring = true
  alert_emails              = var.secondary_region_alerts

  tags = merge(var.tags, {
    Region = "asia-pacific"
    Role   = "secondary"
  })
}

# Disaster Recovery Region
module "disaster_recovery_region" {
  source = "../regional-stack"

  providers = {
    aws = aws.backup_region
  }

  name_prefix     = var.name_prefix
  environment     = "${var.environment}-dr"
  region_name     = local.regions.backup.name
  is_primary      = false
  is_disaster_recovery = true

  # Minimal capacity for DR
  min_capacity    = local.regions.backup.capacity.min
  max_capacity    = local.regions.backup.capacity.max
  desired_capacity = 0  # Kept at 0 until failover needed

  # Database backup and point-in-time recovery
  primary_database_arn = module.primary_region.database_cluster_arn
  enable_point_in_time_recovery = true
  backup_retention_days = 35

  # Quick activation capabilities
  enable_rapid_scaling = true

  tags = merge(var.tags, {
    Region = "disaster-recovery"
    Role   = "backup"
  })
}

# Global Load Balancer and Traffic Management
resource "aws_route53_health_check" "primary_region_health" {
  provider                  = aws.us_east_1
  fqdn                     = module.primary_region.load_balancer_dns_name
  port                     = 443
  type                     = "HTTPS"
  resource_path            = "/api/health"
  failure_threshold        = 3
  request_interval         = 30
  cloudwatch_logs_region   = "us-east-1"
  measure_latency         = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-primary-health-check"
    Region = "primary"
  })
}

resource "aws_route53_health_check" "europe_region_health" {
  provider                  = aws.us_east_1
  fqdn                     = module.europe_region.load_balancer_dns_name
  port                     = 443
  type                     = "HTTPS"
  resource_path            = "/api/health"
  failure_threshold        = 3
  request_interval         = 30
  measure_latency         = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-europe-health-check"
    Region = "europe"
  })
}

resource "aws_route53_health_check" "asia_region_health" {
  provider                  = aws.us_east_1
  fqdn                     = module.asia_region.load_balancer_dns_name
  port                     = 443
  type                     = "HTTPS"
  resource_path            = "/api/health"
  failure_threshold        = 3
  request_interval         = 30
  measure_latency         = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-asia-health-check"
    Region = "asia"
  })
}

# Route53 Hosted Zone and Geolocation Routing
resource "aws_route53_zone" "main" {
  provider = aws.us_east_1
  name     = var.domain_name

  tags = var.tags
}

# Primary record for US traffic
resource "aws_route53_record" "primary_region" {
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  set_identifier = "primary"
  health_check_id = aws_route53_health_check.primary_region_health.id

  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = module.primary_region.load_balancer_dns_name
    zone_id                = module.primary_region.load_balancer_zone_id
    evaluate_target_health = true
  }
}

# Failover record pointing to Europe
resource "aws_route53_record" "failover_europe" {
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  set_identifier = "failover-europe"
  health_check_id = aws_route53_health_check.europe_region_health.id

  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = module.europe_region.load_balancer_dns_name
    zone_id                = module.europe_region.load_balancer_zone_id
    evaluate_target_health = true
  }
}

# Geolocation-based routing for Europe
resource "aws_route53_record" "europe_geo" {
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  set_identifier = "europe-geo"
  health_check_id = aws_route53_health_check.europe_region_health.id

  geolocation_routing_policy {
    continent = "EU"
  }

  alias {
    name                   = module.europe_region.load_balancer_dns_name
    zone_id                = module.europe_region.load_balancer_zone_id
    evaluate_target_health = true
  }
}

# Geolocation-based routing for Asia
resource "aws_route53_record" "asia_geo" {
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = var.domain_name
  type     = "A"

  set_identifier = "asia-geo"
  health_check_id = aws_route53_health_check.asia_region_health.id

  geolocation_routing_policy {
    continent = "AS"
  }

  alias {
    name                   = module.asia_region.load_balancer_dns_name
    zone_id                = module.asia_region.load_balancer_zone_id
    evaluate_target_health = true
  }
}

# Cross-Region Data Replication
resource "aws_s3_bucket_replication_configuration" "content_replication" {
  provider   = aws.us_east_1
  depends_on = [module.primary_region.s3_bucket_versioning]

  role   = aws_iam_role.replication_role.arn
  bucket = module.primary_region.content_bucket_id

  rule {
    id     = "replicate-to-all-regions"
    status = "Enabled"

    destination {
      bucket        = module.europe_region.content_bucket_arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = module.europe_region.s3_kms_key_arn
      }
    }
  }

  rule {
    id     = "replicate-to-asia"
    status = "Enabled"

    destination {
      bucket        = module.asia_region.content_bucket_arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = module.asia_region.s3_kms_key_arn
      }
    }
  }

  rule {
    id     = "replicate-to-dr"
    status = "Enabled"

    destination {
      bucket        = module.disaster_recovery_region.content_bucket_arn
      storage_class = "GLACIER"

      encryption_configuration {
        replica_kms_key_id = module.disaster_recovery_region.s3_kms_key_arn
      }
    }
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication_role" {
  provider = aws.us_east_1
  name     = "${var.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "replication_policy" {
  provider = aws.us_east_1
  name     = "${var.name_prefix}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${module.primary_region.content_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = module.primary_region.content_bucket_arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = [
          "${module.europe_region.content_bucket_arn}/*",
          "${module.asia_region.content_bucket_arn}/*",
          "${module.disaster_recovery_region.content_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication_policy_attachment" {
  provider   = aws.us_east_1
  role       = aws_iam_role.replication_role.name
  policy_arn = aws_iam_policy.replication_policy.arn
}

# Disaster Recovery Automation
resource "aws_lambda_function" "disaster_recovery_orchestrator" {
  provider      = aws.us_east_1
  filename      = data.archive_file.dr_orchestrator_zip.output_path
  function_name = "${var.name_prefix}-dr-orchestrator"
  role         = aws_iam_role.dr_orchestrator_role.arn
  handler      = "index.handler"
  runtime      = "python3.11"
  timeout      = 900  # 15 minutes

  environment {
    variables = {
      PRIMARY_REGION                = "us-east-1"
      BACKUP_REGION                = var.backup_region
      DR_CLUSTER_NAME               = module.disaster_recovery_region.ecs_cluster_name
      DR_SERVICE_NAME               = module.disaster_recovery_region.ecs_service_name
      DATABASE_CLUSTER_IDENTIFIER   = module.primary_region.database_cluster_identifier
      SNS_TOPIC_ARN                = aws_sns_topic.disaster_recovery_alerts.arn
      RTO_TARGET_SECONDS           = local.rto_target_seconds
      RPO_TARGET_SECONDS           = local.rpo_target_seconds
    }
  }

  source_code_hash = data.archive_file.dr_orchestrator_zip.output_base64sha256

  tags = var.tags
}

data "archive_file" "dr_orchestrator_zip" {
  type        = "zip"
  output_path = "/tmp/dr_orchestrator.zip"

  source {
    content = templatefile("${path.module}/templates/dr_orchestrator.py", {
      sns_topic_arn = aws_sns_topic.disaster_recovery_alerts.arn
    })
    filename = "index.py"
  }
}

# IAM Role for DR Orchestrator
resource "aws_iam_role" "dr_orchestrator_role" {
  provider = aws.us_east_1
  name     = "${var.name_prefix}-dr-orchestrator-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "dr_orchestrator_policy" {
  provider = aws.us_east_1
  name     = "${var.name_prefix}-dr-orchestrator-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeClusters",
          "rds:DescribeDBClusters",
          "rds:RestoreDBClusterFromSnapshot",
          "rds:CreateDBCluster",
          "route53:ChangeResourceRecordSets",
          "route53:GetHostedZone",
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "dr_orchestrator_policy_attachment" {
  provider   = aws.us_east_1
  role       = aws_iam_role.dr_orchestrator_role.name
  policy_arn = aws_iam_policy.dr_orchestrator_policy.arn
}

# SNS Topic for Disaster Recovery Alerts
resource "aws_sns_topic" "disaster_recovery_alerts" {
  provider = aws.us_east_1
  name     = "${var.name_prefix}-disaster-recovery"

  tags = var.tags
}

resource "aws_sns_topic_subscription" "dr_email_notifications" {
  provider  = aws.us_east_1
  count     = length(var.disaster_recovery_alerts)
  topic_arn = aws_sns_topic.disaster_recovery_alerts.arn
  protocol  = "email"
  endpoint  = var.disaster_recovery_alerts[count.index]
}

# CloudWatch Alarms for Multi-Region Health
resource "aws_cloudwatch_metric_alarm" "multi_region_health" {
  provider            = aws.us_east_1
  alarm_name          = "${var.name_prefix}-multi-region-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckPercentHealthy"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Multi-region health check failure - potential disaster recovery needed"
  alarm_actions       = [aws_sns_topic.disaster_recovery_alerts.arn, aws_lambda_function.disaster_recovery_orchestrator.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary_region_health.id
  }

  tags = var.tags
}

# Global CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "multi_region_dashboard" {
  provider       = aws.us_east_1
  dashboard_name = "${var.name_prefix}-multi-region-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 24
        height = 6

        properties = {
          metrics = [
            ["AWS/Route53", "HealthCheckPercentHealthy", "HealthCheckId", aws_route53_health_check.primary_region_health.id, {region: "us-east-1", label: "US East 1 (Primary)"}],
            ["AWS/Route53", "HealthCheckPercentHealthy", "HealthCheckId", aws_route53_health_check.europe_region_health.id, {region: "us-east-1", label: "EU West 1"}],
            ["AWS/Route53", "HealthCheckPercentHealthy", "HealthCheckId", aws_route53_health_check.asia_region_health.id, {region: "us-east-1", label: "AP Southeast 1"}]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Multi-Region Health Status"
          yAxis = {
            left = {
              min = 0
              max = 1
            }
          }
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
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", module.primary_region.load_balancer_name, {region: "us-east-1", label: "US East 1"}],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", module.europe_region.load_balancer_name, {region: "eu-west-1", label: "EU West 1"}],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", module.asia_region.load_balancer_name, {region: "ap-southeast-1", label: "AP Southeast 1"}]
          ]
          period = 300
          stat   = "Average"
          title  = "Response Times by Region"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", module.primary_region.ecs_service_name, "ClusterName", module.primary_region.ecs_cluster_name, {region: "us-east-1", label: "US East 1"}],
            ["AWS/ECS", "CPUUtilization", "ServiceName", module.europe_region.ecs_service_name, "ClusterName", module.europe_region.ecs_cluster_name, {region: "eu-west-1", label: "EU West 1"}],
            ["AWS/ECS", "CPUUtilization", "ServiceName", module.asia_region.ecs_service_name, "ClusterName", module.asia_region.ecs_cluster_name, {region: "ap-southeast-1", label: "AP Southeast 1"}]
          ]
          period = 300
          stat   = "Average"
          title  = "CPU Utilization by Region"
        }
      }
    ]
  })

  tags = var.tags
}