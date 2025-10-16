# Monitoring and Alerting Module for 1001 Stories
# Comprehensive monitoring for S3, CloudFront, and educational platform metrics

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  # Alarm name prefix
  alarm_prefix = "${var.name_prefix}-${var.environment}"

  # Common alarm tags
  alarm_tags = merge(var.tags, {
    Component = "monitoring"
    Service   = "cloudwatch"
  })

  # Educational platform specific metrics
  educational_metrics = {
    student_engagement = "StudentEngagement"
    content_access     = "ContentAccess"
    book_assignments   = "BookAssignments"
    submission_rate    = "SubmissionRate"
    approval_workflow  = "ApprovalWorkflow"
  }
}

# SNS Topic for Critical Alerts
resource "aws_sns_topic" "critical_alerts" {
  name = "${var.name_prefix}-critical-alerts"

  tags = local.alarm_tags
}

# SNS Topic for Warning Alerts
resource "aws_sns_topic" "warning_alerts" {
  name = "${var.name_prefix}-warning-alerts"

  tags = local.alarm_tags
}

# SNS Topic for Cost Alerts
resource "aws_sns_topic" "cost_alerts" {
  name = "${var.name_prefix}-cost-alerts"

  tags = local.alarm_tags
}

# SNS Topic Subscriptions
resource "aws_sns_topic_subscription" "critical_email" {
  count = length(var.critical_alert_emails) > 0 ? length(var.critical_alert_emails) : 0

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.critical_alert_emails[count.index]
}

resource "aws_sns_topic_subscription" "warning_email" {
  count = length(var.warning_alert_emails) > 0 ? length(var.warning_alert_emails) : 0

  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.warning_alert_emails[count.index]
}

resource "aws_sns_topic_subscription" "cost_email" {
  count = length(var.cost_alert_emails) > 0 ? length(var.cost_alert_emails) : 0

  topic_arn = aws_sns_topic.cost_alerts.arn
  protocol  = "email"
  endpoint  = var.cost_alert_emails[count.index]
}

# CloudWatch Dashboard for S3 and CDN
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"

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
            ["AWS/S3", "BucketSizeBytes", "BucketName", var.s3_bucket_name, "StorageType", "StandardStorage"],
            [".", "NumberOfObjects", ".", ".", ".", "AllStorageTypes"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "S3 Bucket Size and Object Count"
          period  = 300
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
            ["AWS/CloudFront", "Requests", "DistributionId", var.cloudfront_distribution_id],
            [".", "BytesDownloaded", ".", "."],
            [".", "BytesUploaded", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1" # CloudFront metrics are always in us-east-1
          title   = "CloudFront Traffic"
          period  = 300
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
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", var.cloudfront_distribution_id],
            [".", "OriginLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Performance"
          period  = 300
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
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", var.cloudfront_distribution_id],
            [".", "5xxErrorRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Error Rates"
          period  = 300
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
            ["AWS/S3", "AllRequests", "BucketName", var.s3_bucket_name],
            [".", "GetRequests", ".", "."],
            [".", "PutRequests", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "S3 Request Metrics"
          period  = 300
        }
      }
    ]
  })
}

# Educational Platform Custom Dashboard
resource "aws_cloudwatch_dashboard" "educational" {
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
            ["${var.name_prefix}", "UserLogins", "Role", "LEARNER"],
            [".", ".", ".", "TEACHER"],
            [".", ".", ".", "VOLUNTEER"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "User Activity by Role"
          period  = 300
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
            ["${var.name_prefix}", "ContentAccess", "ContentType", "PDF"],
            [".", ".", ".", "Audio"],
            [".", ".", ".", "Images"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Content Access by Type"
          period  = 300
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
            ["${var.name_prefix}", "SubmissionWorkflow", "Stage", "Pending"],
            [".", ".", ".", "UnderReview"],
            [".", ".", ".", "Approved"],
            [".", ".", ".", "Published"]
          ]
          view    = "timeSeries"
          stacked = true
          region  = data.aws_region.current.name
          title   = "Publishing Workflow Status"
          period  = 300
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
            ["${var.name_prefix}", "BookAssignments", "Class", "Total"],
            [".", "StudentProgress", "Status", "InProgress"],
            [".", ".", ".", "Completed"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Educational Progress"
          period  = 300
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
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.load_balancer_name],
            [".", "ResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Application Performance"
          period  = 300
        }
      }
    ]
  })
}

# S3 Monitoring Alarms
resource "aws_cloudwatch_metric_alarm" "s3_bucket_size" {
  alarm_name          = "${local.alarm_prefix}-s3-bucket-size-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = "86400" # Daily
  statistic           = "Average"
  threshold           = var.s3_size_threshold_bytes
  alarm_description   = "This metric monitors S3 bucket size"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    BucketName  = var.s3_bucket_name
    StorageType = "StandardStorage"
  }

  tags = local.alarm_tags
}

resource "aws_cloudwatch_metric_alarm" "s3_4xx_errors" {
  alarm_name          = "${local.alarm_prefix}-s3-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors S3 4xx errors"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    BucketName = var.s3_bucket_name
  }

  tags = local.alarm_tags
}

resource "aws_cloudwatch_metric_alarm" "s3_5xx_errors" {
  alarm_name          = "${local.alarm_prefix}-s3-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors S3 5xx errors"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    BucketName = var.s3_bucket_name
  }

  tags = local.alarm_tags
}

# CloudFront Monitoring Alarms
resource "aws_cloudwatch_metric_alarm" "cloudfront_4xx_errors" {
  alarm_name          = "${local.alarm_prefix}-cloudfront-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront 4xx error rate"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
  }

  tags = local.alarm_tags
}

resource "aws_cloudfront_metric_alarm" "cloudfront_5xx_errors" {
  alarm_name          = "${local.alarm_prefix}-cloudfront-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
  }

  tags = local.alarm_tags
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_cache_hit_rate" {
  alarm_name          = "${local.alarm_prefix}-cloudfront-low-cache-hit-rate"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CacheHitRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors CloudFront cache hit rate"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
  }

  tags = local.alarm_tags
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_origin_latency" {
  alarm_name          = "${local.alarm_prefix}-cloudfront-high-origin-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "OriginLatency"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "3000" # 3 seconds
  alarm_description   = "This metric monitors CloudFront origin latency"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
  }

  tags = local.alarm_tags
}

# Educational Platform Custom Metrics and Alarms
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "${var.name_prefix}-failed-logins"
  log_group_name = var.application_log_group
  pattern        = "[timestamp, request_id, level=\"ERROR\", message=\"LOGIN_FAILED\", ...]"

  metric_transformation {
    name      = "FailedLogins"
    namespace = var.name_prefix
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_failed_logins" {
  alarm_name          = "${local.alarm_prefix}-high-failed-logins"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FailedLogins"
  namespace           = var.name_prefix
  period              = "300"
  statistic           = "Sum"
  threshold           = "20"
  alarm_description   = "High number of failed login attempts detected"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  tags = local.alarm_tags
}

resource "aws_cloudwatch_log_metric_filter" "content_access" {
  name           = "${var.name_prefix}-content-access"
  log_group_name = var.application_log_group
  pattern        = "[timestamp, request_id, level=\"INFO\", message=\"CONTENT_ACCESS\", user_role, content_type, ...]"

  metric_transformation {
    name      = "ContentAccess"
    namespace = var.name_prefix
    value     = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "submission_workflow" {
  name           = "${var.name_prefix}-submission-workflow"
  log_group_name = var.application_log_group
  pattern        = "[timestamp, request_id, level=\"INFO\", message=\"WORKFLOW_TRANSITION\", from_stage, to_stage, ...]"

  metric_transformation {
    name      = "SubmissionWorkflow"
    namespace = var.name_prefix
    value     = "1"
  }
}

# Cost Monitoring
resource "aws_budgets_budget" "monthly_cost" {
  name       = "${var.name_prefix}-monthly-budget"
  budget_type = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  time_period_start = "2024-01-01_00:00"

  cost_filters = {
    Service = ["Amazon Simple Storage Service", "Amazon CloudFront"]
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

  depends_on = [aws_sns_topic.cost_alerts]
}

# Application Performance Monitoring
resource "aws_cloudwatch_metric_alarm" "application_response_time" {
  count = var.load_balancer_name != "" ? 1 : 0

  alarm_name          = "${local.alarm_prefix}-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2" # 2 seconds
  alarm_description   = "High application response time"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_name
  }

  tags = local.alarm_tags
}

resource "aws_cloudwatch_metric_alarm" "application_error_rate" {
  count = var.load_balancer_name != "" ? 1 : 0

  alarm_name          = "${local.alarm_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "High application error rate"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_name
  }

  tags = local.alarm_tags
}

# Log Groups with Retention
resource "aws_cloudwatch_log_group" "application" {
  name              = var.application_log_group
  retention_in_days = var.log_retention_days

  tags = local.alarm_tags
}

resource "aws_cloudwatch_log_group" "access_logs" {
  name              = "${var.name_prefix}-access-logs"
  retention_in_days = var.access_log_retention_days

  tags = local.alarm_tags
}

# Custom Metric for Educational Engagement
resource "aws_cloudwatch_composite_alarm" "educational_health" {
  alarm_name        = "${local.alarm_prefix}-educational-platform-health"
  alarm_description = "Composite alarm for overall educational platform health"

  alarm_rule = join(" AND ", [
    "ALARM(${aws_cloudwatch_metric_alarm.s3_5xx_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.cloudfront_5xx_errors.alarm_name})",
    var.load_balancer_name != "" ? "ALARM(${aws_cloudwatch_metric_alarm.application_error_rate[0].alarm_name})" : "FALSE"
  ])

  alarm_actions = [aws_sns_topic.critical_alerts.arn]
  ok_actions    = [aws_sns_topic.warning_alerts.arn]

  tags = local.alarm_tags
}