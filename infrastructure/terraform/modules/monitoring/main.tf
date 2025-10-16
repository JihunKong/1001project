# Monitoring Module - Comprehensive Observability for 1001 Stories
# Includes CloudWatch, X-Ray, custom metrics, and educational platform specific monitoring

# SNS Topic for Critical Alerts
resource "aws_sns_topic" "critical_alerts" {
  name = "${var.name_prefix}-critical-alerts"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-critical-alerts"
    Type = "critical"
  })
}

resource "aws_sns_topic" "warning_alerts" {
  name = "${var.name_prefix}-warning-alerts"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-warning-alerts"
    Type = "warning"
  })
}

# SNS Topic Subscriptions
resource "aws_sns_topic_subscription" "critical_email" {
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "warning_email" {
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Log Groups for Custom Application Logs
resource "aws_cloudwatch_log_group" "application_events" {
  name              = "/aws/lambda/${var.name_prefix}-app-events"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-events"
    Type = "application-events"
  })
}

resource "aws_cloudwatch_log_group" "user_activity" {
  name              = "/aws/lambda/${var.name_prefix}-user-activity"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-user-activity"
    Type = "user-activity"
  })
}

resource "aws_cloudwatch_log_group" "workflow_events" {
  name              = "/aws/lambda/${var.name_prefix}-workflow-events"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-workflow-events"
    Type = "workflow"
  })
}

# Custom CloudWatch Metrics
resource "aws_cloudwatch_log_metric_filter" "user_registration" {
  name           = "${var.name_prefix}-user-registration"
  log_group_name = var.app_log_group_name
  pattern        = "[timestamp, request_id, level=\"INFO\", message=\"USER_REGISTERED\", ...]"

  metric_transformation {
    name      = "UserRegistrations"
    namespace = "1001Stories/Users"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "story_submissions" {
  name           = "${var.name_prefix}-story-submissions"
  log_group_name = var.app_log_group_name
  pattern        = "[timestamp, request_id, level=\"INFO\", message=\"STORY_SUBMITTED\", ...]"

  metric_transformation {
    name      = "StorySubmissions"
    namespace = "1001Stories/Content"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "pdf_reads" {
  name           = "${var.name_prefix}-pdf-reads"
  log_group_name = var.app_log_group_name
  pattern        = "[timestamp, request_id, level=\"INFO\", message=\"PDF_OPENED\", ...]"

  metric_transformation {
    name      = "PDFReads"
    namespace = "1001Stories/Content"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "workflow_approvals" {
  name           = "${var.name_prefix}-workflow-approvals"
  log_group_name = var.app_log_group_name
  pattern        = "[timestamp, request_id, level=\"INFO\", message=\"CONTENT_APPROVED\", ...]"

  metric_transformation {
    name      = "ContentApprovals"
    namespace = "1001Stories/Workflow"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "auto_save_events" {
  name           = "${var.name_prefix}-auto-save-events"
  log_group_name = var.app_log_group_name
  pattern        = "[timestamp, request_id, level=\"INFO\", message=\"AUTO_SAVE\", ...]"

  metric_transformation {
    name      = "AutoSaveEvents"
    namespace = "1001Stories/Editor"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "error_tracking" {
  name           = "${var.name_prefix}-application-errors"
  log_group_name = var.app_log_group_name
  pattern        = "[timestamp, request_id, level=\"ERROR\", ...]"

  metric_transformation {
    name      = "ApplicationErrors"
    namespace = "1001Stories/Errors"
    value     = "1"
  }
}

# ECS Service Monitoring
resource "aws_cloudwatch_metric_alarm" "ecs_high_cpu" {
  alarm_name          = "${var.name_prefix}-ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS service CPU utilization is high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    ServiceName = var.service_name
    ClusterName = var.cluster_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_high_memory" {
  alarm_name          = "${var.name_prefix}-ecs-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "ECS service memory utilization is high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    ServiceName = var.service_name
    ClusterName = var.cluster_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_service_count_low" {
  alarm_name          = "${var.name_prefix}-ecs-service-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RunningTaskCount"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "ECS service running task count is critically low"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    ServiceName = var.service_name
    ClusterName = var.cluster_name
  }

  tags = var.tags
}

# Database Monitoring
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "${var.name_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "RDS cluster CPU utilization is high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.database_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_high_connections" {
  alarm_name          = "${var.name_prefix}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS connection count is high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.database_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_replica_lag" {
  alarm_name          = "${var.name_prefix}-rds-replica-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "10000"  # 10 seconds
  alarm_description   = "RDS read replica lag is high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.database_id
  }

  tags = var.tags
}

# Application Load Balancer Monitoring
resource "aws_cloudwatch_metric_alarm" "alb_high_response_time" {
  alarm_name          = "${var.name_prefix}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"  # 2 seconds
  alarm_description   = "ALB target response time is high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_high_4xx_errors" {
  alarm_name          = "${var.name_prefix}-alb-high-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_4XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "High number of 4XX errors from ALB targets"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_high_5xx_errors" {
  alarm_name          = "${var.name_prefix}-alb-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "High number of 5XX errors from ALB targets - CRITICAL"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = var.tags
}

# Custom Application Metrics Alarms
resource "aws_cloudwatch_metric_alarm" "high_application_errors" {
  alarm_name          = "${var.name_prefix}-high-application-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApplicationErrors"
  namespace           = "1001Stories/Errors"
  period              = "300"
  statistic           = "Sum"
  threshold           = "20"
  alarm_description   = "High number of application errors"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "low_story_submissions" {
  alarm_name          = "${var.name_prefix}-low-story-submissions"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "4"
  metric_name         = "StorySubmissions"
  namespace           = "1001Stories/Content"
  period              = "3600"  # 1 hour
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Unusually low story submission rate - possible platform issue"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  tags = var.tags
}

# Educational Platform Specific Monitoring
resource "aws_cloudwatch_metric_alarm" "workflow_bottleneck" {
  alarm_name          = "${var.name_prefix}-workflow-bottleneck"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "6"
  metric_name         = "ContentApprovals"
  namespace           = "1001Stories/Workflow"
  period              = "3600"  # 1 hour
  statistic           = "Sum"
  threshold           = "2"
  alarm_description   = "Content approval workflow may be bottlenecked"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  tags = var.tags
}

# Comprehensive CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-main-dashboard"

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
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.service_name, "ClusterName", var.cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."],
            [".", "RunningTaskCount", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ECS Service Metrics"
          period  = 300
          yAxis = {
            left = {
              min = 0
              max = 100
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
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", var.database_id],
            [".", "DatabaseConnections", ".", "."],
            [".", "AuroraReplicaLag", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "RDS Cluster Metrics"
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
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Application Load Balancer Metrics"
          period  = 300
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
            ["1001Stories/Users", "UserRegistrations"],
            ["1001Stories/Content", "StorySubmissions"],
            ["1001Stories/Content", "PDFReads"],
            ["1001Stories/Workflow", "ContentApprovals"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Educational Platform Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          metrics = [
            ["1001Stories/Editor", "AutoSaveEvents"],
            ["1001Stories/Errors", "ApplicationErrors"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Real-time Features & Error Tracking"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 18
        width  = 24
        height = 8

        properties = {
          query   = "SOURCE '${var.app_log_group_name}' | fields @timestamp, @message, level, user_role, action | filter level = \"ERROR\" | sort @timestamp desc | limit 50"
          region  = data.aws_region.current.name
          title   = "Recent Application Errors"
          view    = "table"
        }
      }
    ]
  })
}

# Educational Platform Performance Dashboard
resource "aws_cloudwatch_dashboard" "educational_metrics" {
  dashboard_name = "${var.name_prefix}-educational-metrics"

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
            ["1001Stories/Users", "UserRegistrations"]
          ]
          view    = "singleValue"
          region  = data.aws_region.current.name
          title   = "Daily User Registrations"
          period  = 86400
          stat    = "Sum"
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
            ["1001Stories/Content", "StorySubmissions"]
          ]
          view    = "singleValue"
          region  = data.aws_region.current.name
          title   = "Daily Story Submissions"
          period  = 86400
          stat    = "Sum"
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
            ["1001Stories/Content", "PDFReads"]
          ]
          view    = "singleValue"
          region  = data.aws_region.current.name
          title   = "Daily PDF Reads"
          period  = 86400
          stat    = "Sum"
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
            ["1001Stories/Workflow", "ContentApprovals"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Content Approval Workflow"
          period  = 3600
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
            ["1001Stories/Editor", "AutoSaveEvents"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Text Editor Auto-Save Activity"
          period  = 300
        }
      }
    ]
  })
}

# X-Ray Tracing Configuration
resource "aws_xray_sampling_rule" "main" {
  rule_name      = "${var.name_prefix}-sampling-rule"
  priority       = 9000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  tags = var.tags
}

# X-Ray Encryption Configuration
resource "aws_xray_encryption_config" "main" {
  type   = "KMS"
  key_id = aws_kms_key.xray.arn
}

resource "aws_kms_key" "xray" {
  description             = "KMS key for X-Ray encryption"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-xray-kms-key"
  })
}

resource "aws_kms_alias" "xray" {
  name          = "alias/${var.name_prefix}-xray"
  target_key_id = aws_kms_key.xray.key_id
}

# CloudWatch Synthetics for Health Monitoring
resource "aws_synthetics_canary" "health_check" {
  name                 = "${var.name_prefix}-health-check"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics.bucket}/"
  execution_role_arn   = aws_iam_role.synthetics.arn
  handler              = "pageLoadBlueprint.handler"
  zip_file             = data.archive_file.synthetics_script.output_path
  runtime_version      = "syn-nodejs-puppeteer-7.0"

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds    = 60
    memory_in_mb         = 960
    active_tracing       = true
  }

  tags = var.tags
}

# S3 Bucket for Synthetics artifacts
resource "aws_s3_bucket" "synthetics" {
  bucket        = "${var.name_prefix}-synthetics-artifacts-${random_string.synthetics_suffix.result}"
  force_destroy = true

  tags = var.tags
}

resource "random_string" "synthetics_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Synthetics script
data "archive_file" "synthetics_script" {
  type        = "zip"
  output_path = "/tmp/synthetics-script.zip"
  source {
    content = templatefile("${path.module}/synthetics-script.js", {
      health_check_url = var.health_check_url
    })
    filename = "nodejs/node_modules/pageLoadBlueprint.js"
  }
}

# IAM Role for Synthetics
resource "aws_iam_role" "synthetics" {
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

resource "aws_iam_role_policy_attachment" "synthetics" {
  role       = aws_iam_role.synthetics.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchSyntheticsExecutionRolePolicy"
}

data "aws_region" "current" {}

# Cost Anomaly Detection
resource "aws_ce_anomaly_detector" "main" {
  name         = "${var.name_prefix}-cost-anomaly"
  monitor_type = "DIMENSIONAL"

  specification = jsonencode({
    Dimension = "SERVICE"
    MatchOptions = ["EQUALS"]
    Values = ["Amazon Elastic Compute Cloud - Compute", "Amazon Relational Database Service"]
  })

  tags = var.tags
}

resource "aws_ce_anomaly_subscription" "main" {
  name      = "${var.name_prefix}-cost-alerts"
  frequency = "DAILY"

  monitor_arn_list = [
    aws_ce_anomaly_detector.main.arn
  ]

  subscriber {
    type    = "EMAIL"
    address = var.alert_email
  }

  threshold_expression {
    and {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
        values        = ["100"]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
  }

  tags = var.tags
}