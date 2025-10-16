# Comprehensive Monitoring and Alerting Module for 1001 Stories
# Advanced observability for 500K users, 50K concurrent peak

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudWatch Log Groups with retention policies
resource "aws_cloudwatch_log_group" "application_logs" {
  for_each = var.log_groups

  name              = each.key
  retention_in_days = each.value.retention_days
  kms_key_id        = var.logs_kms_key_arn

  tags = merge(var.tags, {
    LogType     = each.value.log_type
    Environment = var.environment
  })
}

# Custom CloudWatch Metrics for Educational Platform
resource "aws_cloudwatch_log_metric_filter" "user_registrations" {
  name           = "${var.name_prefix}-user-registrations"
  log_group_name = aws_cloudwatch_log_group.application_logs["/aws/ecs/${var.name_prefix}-app"].name
  pattern        = "[timestamp, request_id, level=\"INFO\", logger, msg=\"User registered\", user_id, role, ...]"

  metric_transformation {
    name      = "UserRegistrations"
    namespace = "1001Stories/UserActivity"
    value     = "1"

    default_value = 0
  }
}

resource "aws_cloudwatch_log_metric_filter" "story_submissions" {
  name           = "${var.name_prefix}-story-submissions"
  log_group_name = aws_cloudwatch_log_group.application_logs["/aws/ecs/${var.name_prefix}-app"].name
  pattern        = "[timestamp, request_id, level=\"INFO\", logger, msg=\"Story submitted\", user_id, story_id, ...]"

  metric_transformation {
    name      = "StorySubmissions"
    namespace = "1001Stories/ContentWorkflow"
    value     = "1"

    default_value = 0
  }
}

resource "aws_cloudwatch_log_metric_filter" "pdf_reads" {
  name           = "${var.name_prefix}-pdf-reads"
  log_group_name = aws_cloudwatch_log_group.application_logs["/aws/ecs/${var.name_prefix}-app"].name
  pattern        = "[timestamp, request_id, level=\"INFO\", logger, msg=\"PDF opened\", user_id, book_id, ...]"

  metric_transformation {
    name      = "PDFReads"
    namespace = "1001Stories/ReadingActivity"
    value     = "1"

    default_value = 0
  }
}

resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  name           = "${var.name_prefix}-application-errors"
  log_group_name = aws_cloudwatch_log_group.application_logs["/aws/ecs/${var.name_prefix}-app"].name
  pattern        = "[timestamp, request_id, level=\"ERROR\", ...]"

  metric_transformation {
    name      = "ApplicationErrors"
    namespace = "1001Stories/ErrorTracking"
    value     = "1"

    default_value = 0
  }
}

# Advanced CloudWatch Dashboards
resource "aws_cloudwatch_dashboard" "main_overview" {
  dashboard_name = "${var.name_prefix}-main-overview"

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
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name, {stat: "Average"}],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name, {stat: "Average"}],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.load_balancer_name, {stat: "Average"}],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.load_balancer_name, {stat: "Sum"}]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Application Performance Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", var.database_cluster_identifier],
            ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", var.database_cluster_identifier],
            ["AWS/RDS", "ReadLatency", "DBClusterIdentifier", var.database_cluster_identifier],
            ["AWS/RDS", "WriteLatency", "DBClusterIdentifier", var.database_cluster_identifier]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Database Performance"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6

        properties = {
          metrics = [
            ["1001Stories/UserActivity", "UserRegistrations"],
            ["1001Stories/ContentWorkflow", "StorySubmissions"],
            ["1001Stories/ReadingActivity", "PDFReads"]
          ]
          period = 3600
          stat   = "Sum"
          region = var.aws_region
          title  = "Educational Platform Activity"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6

        properties = {
          metrics = [
            ["1001Stories/ErrorTracking", "ApplicationErrors"],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", var.load_balancer_name],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.load_balancer_name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Error Tracking"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6

        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", "BucketName", var.content_bucket_name, "StorageType", "StandardStorage"],
            ["AWS/CloudFront", "Requests", "DistributionId", var.cloudfront_distribution_id],
            ["AWS/CloudFront", "BytesDownloaded", "DistributionId", var.cloudfront_distribution_id]
          ]
          period = 86400
          stat   = "Average"
          region = var.aws_region
          title  = "Content Delivery Metrics"
        }
      }
    ]
  })

  tags = var.tags
}

# Educational Metrics Dashboard
resource "aws_cloudwatch_dashboard" "educational_metrics" {
  dashboard_name = "${var.name_prefix}-educational-metrics"

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
            ["1001Stories/UserActivity", "UserRegistrations", {stat: "Sum"}],
            ["1001Stories/ContentWorkflow", "StorySubmissions", {stat: "Sum"}],
            ["1001Stories/ReadingActivity", "PDFReads", {stat: "Sum"}]
          ]
          period = 3600
          stat   = "Sum"
          region = var.aws_region
          title  = "Daily Educational Activity"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 6
        width  = 24
        height = 6

        properties = {
          query = "SOURCE '/aws/ecs/${var.name_prefix}-app' | fields @timestamp, msg, user_id, role\n| filter msg like /User registered/\n| stats count() by role\n| sort count desc"
          region = var.aws_region
          title  = "User Registrations by Role (Last 24 hours)"
          view   = "table"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          query = "SOURCE '/aws/ecs/${var.name_prefix}-app' | fields @timestamp, msg, book_id, user_id\n| filter msg like /PDF opened/\n| stats count() by book_id\n| sort count desc\n| limit 10"
          region = var.aws_region
          title  = "Most Read Books (Top 10)"
          view   = "table"
        }
      }
    ]
  })

  tags = var.tags
}

# Performance Dashboard
resource "aws_cloudwatch_dashboard" "performance_metrics" {
  dashboard_name = "${var.name_prefix}-performance"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 8
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.load_balancer_name, {stat: "Average"}],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.load_balancer_name, {stat: "p95"}],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.load_balancer_name, {stat: "p99"}]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Response Time Distribution"
          yAxis = {
            left = {
              min = 0
              max = 5
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 0
        width  = 8
        height = 6

        properties = {
          metrics = [
            ["AWS/CloudFront", "OriginLatency", "DistributionId", var.cloudfront_distribution_id],
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", var.cloudfront_distribution_id]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CDN Performance"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 0
        width  = 8
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "ServiceDesiredCount", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name],
            ["AWS/ECS", "ServiceRunningCount", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name],
            ["AWS/ECS", "ServicePendingCount", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Service Scaling"
        }
      }
    ]
  })

  tags = var.tags
}

# SNS Topics for Different Alert Severities
resource "aws_sns_topic" "critical_alerts" {
  name = "${var.name_prefix}-critical-alerts"

  tags = var.tags
}

resource "aws_sns_topic" "warning_alerts" {
  name = "${var.name_prefix}-warning-alerts"

  tags = var.tags
}

resource "aws_sns_topic" "info_alerts" {
  name = "${var.name_prefix}-info-alerts"

  tags = var.tags
}

# Email subscriptions for alerts
resource "aws_sns_topic_subscription" "critical_email_alerts" {
  count     = length(var.critical_alert_emails)
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.critical_alert_emails[count.index]
}

resource "aws_sns_topic_subscription" "warning_email_alerts" {
  count     = length(var.warning_alert_emails)
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.warning_alert_emails[count.index]
}

resource "aws_sns_topic_subscription" "info_email_alerts" {
  count     = length(var.info_alert_emails)
  topic_arn = aws_sns_topic.info_alerts.arn
  protocol  = "email"
  endpoint  = var.info_alert_emails[count.index]
}

# Critical Alerts - Service Availability
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.name_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "High 5XX error rate detected"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions         = [aws_sns_topic.info_alerts.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "service_unavailable" {
  alarm_name          = "${var.name_prefix}-service-unavailable"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "No healthy targets available"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions         = [aws_sns_topic.info_alerts.arn]

  dimensions = {
    TargetGroup  = var.target_group_arn_suffix
    LoadBalancer = var.load_balancer_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_cpu_high" {
  alarm_name          = "${var.name_prefix}-database-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Database CPU utilization is high"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions         = [aws_sns_topic.info_alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.database_cluster_identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections_high" {
  alarm_name          = "${var.name_prefix}-database-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "450"  # 90% of max connections (assuming 500 max)
  alarm_description   = "Database connection count is approaching limit"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions         = [aws_sns_topic.info_alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.database_cluster_identifier
  }

  tags = var.tags
}

# Warning Alerts - Performance Degradation
resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  alarm_name          = "${var.name_prefix}-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2.0"  # 2 seconds
  alarm_description   = "Response time is above acceptable threshold"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions         = [aws_sns_topic.info_alerts.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.name_prefix}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "ECS CPU utilization is high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.name_prefix}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "ECS Memory utilization is high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = var.tags
}

# Educational Platform Specific Alerts
resource "aws_cloudwatch_metric_alarm" "low_user_activity" {
  alarm_name          = "${var.name_prefix}-low-user-activity"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserRegistrations"
  namespace           = "1001Stories/UserActivity"
  period              = "3600"
  statistic           = "Sum"
  threshold           = "5"  # Less than 5 registrations per hour
  alarm_description   = "User registration activity is unusually low"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  treat_missing_data  = "breaching"

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "high_application_errors" {
  alarm_name          = "${var.name_prefix}-high-application-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApplicationErrors"
  namespace           = "1001Stories/ErrorTracking"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "High application error rate detected"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = var.tags
}

# CloudWatch Synthetics for End-to-End Monitoring
resource "aws_synthetics_canary" "website_monitoring" {
  name                 = "${var.name_prefix}-website-monitoring"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_artifacts.bucket}/canary-results"
  execution_role_arn   = aws_iam_role.synthetics_role.arn
  handler              = "pageLoadBlueprint.handler"
  zip_file             = data.archive_file.synthetics_zip.output_path
  runtime_version      = "syn-nodejs-puppeteer-3.9"

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds    = 60
    memory_in_mb         = 960
    active_tracing       = var.enable_xray_tracing
  }

  success_retention_period = 2
  failure_retention_period = 14

  tags = var.tags
}

# S3 Bucket for Synthetics artifacts
resource "aws_s3_bucket" "synthetics_artifacts" {
  bucket = "${var.name_prefix}-synthetics-artifacts-${random_string.bucket_suffix.result}"

  tags = var.tags
}

resource "aws_s3_bucket_versioning" "synthetics_artifacts_versioning" {
  bucket = aws_s3_bucket.synthetics_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "synthetics_artifacts_lifecycle" {
  bucket = aws_s3_bucket.synthetics_artifacts.id

  rule {
    id     = "synthetics_cleanup"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Synthetics Canary Code
data "archive_file" "synthetics_zip" {
  type        = "zip"
  output_path = "/tmp/synthetics-canary.zip"

  source {
    content = templatefile("${path.module}/templates/website_monitoring.js", {
      domain_name = var.domain_name
    })
    filename = "nodejs/node_modules/pageLoadBlueprint.js"
  }

  source {
    content = jsonencode({
      dependencies = {
        "puppeteer-core" = "^10.4.0"
      }
    })
    filename = "nodejs/package.json"
  }
}

# IAM Role for Synthetics
resource "aws_iam_role" "synthetics_role" {
  name = "${var.name_prefix}-synthetics-role"

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

resource "aws_iam_role_policy_attachment" "synthetics_policy" {
  role       = aws_iam_role.synthetics_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchSyntheticsExecutionRolePolicy"
}

# X-Ray Tracing Configuration
resource "aws_xray_sampling_rule" "main" {
  count           = var.enable_xray_tracing ? 1 : 0
  rule_name       = "${var.name_prefix}-sampling-rule"
  priority        = 9000
  version         = 1
  reservoir_size  = 1
  fixed_rate      = 0.1
  url_path        = "*"
  host            = "*"
  http_method     = "*"
  service_type    = "*"
  service_name    = "*"
  resource_arn    = "*"

  tags = var.tags
}

# CloudWatch Composite Alarms for Complex Scenarios
resource "aws_cloudwatch_composite_alarm" "application_health" {
  alarm_name        = "${var.name_prefix}-application-health-composite"
  alarm_description = "Composite alarm for overall application health"

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.high_error_rate.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.service_unavailable.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.database_cpu_high.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.high_response_time.alarm_name})"
  ])

  alarm_actions = [aws_sns_topic.critical_alerts.arn]
  ok_actions   = [aws_sns_topic.info_alerts.arn]

  tags = var.tags
}

# Cost Monitoring
resource "aws_budgets_budget" "cost_monitoring" {
  count        = var.enable_cost_monitoring ? 1 : 0
  name         = "${var.name_prefix}-cost-monitoring"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  time_period_start = formatdate("YYYY-MM-01_00:00", timestamp())

  cost_filters = {
    Service = [
      "Amazon Elastic Compute Cloud - Compute",
      "Amazon Relational Database Service",
      "Amazon Simple Storage Service",
      "Amazon CloudFront",
      "Amazon ElastiCache",
      "Amazon Elastic Load Balancing"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = var.cost_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.cost_alert_emails
  }

  tags = var.tags
}