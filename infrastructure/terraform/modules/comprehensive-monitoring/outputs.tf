# Comprehensive Monitoring Module Outputs

# Dashboard URLs
output "main_dashboard_url" {
  description = "URL for the main overview CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main_overview.dashboard_name}"
}

output "educational_dashboard_url" {
  description = "URL for the educational metrics dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.educational_metrics.dashboard_name}"
}

output "performance_dashboard_url" {
  description = "URL for the performance metrics dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.performance_metrics.dashboard_name}"
}

# SNS Topic ARNs
output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "warning_alerts_topic_arn" {
  description = "ARN of the warning alerts SNS topic"
  value       = aws_sns_topic.warning_alerts.arn
}

output "info_alerts_topic_arn" {
  description = "ARN of the info alerts SNS topic"
  value       = aws_sns_topic.info_alerts.arn
}

# CloudWatch Alarms
output "critical_alarms" {
  description = "Map of critical CloudWatch alarms"
  value = {
    high_error_rate       = aws_cloudwatch_metric_alarm.high_error_rate.arn
    service_unavailable   = aws_cloudwatch_metric_alarm.service_unavailable.arn
    database_cpu_high     = aws_cloudwatch_metric_alarm.database_cpu_high.arn
    high_application_errors = aws_cloudwatch_metric_alarm.high_application_errors.arn
  }
}

output "warning_alarms" {
  description = "Map of warning CloudWatch alarms"
  value = {
    high_response_time        = aws_cloudwatch_metric_alarm.high_response_time.arn
    ecs_cpu_high             = aws_cloudwatch_metric_alarm.ecs_cpu_high.arn
    ecs_memory_high          = aws_cloudwatch_metric_alarm.ecs_memory_high.arn
    database_connections_high = aws_cloudwatch_metric_alarm.database_connections_high.arn
    low_user_activity        = aws_cloudwatch_metric_alarm.low_user_activity.arn
  }
}

output "composite_alarms" {
  description = "Map of composite CloudWatch alarms"
  value = {
    application_health = aws_cloudwatch_composite_alarm.application_health.arn
  }
}

# Log Groups
output "log_groups" {
  description = "Map of CloudWatch log groups with their details"
  value = {
    for name, group in aws_cloudwatch_log_group.application_logs :
    name => {
      name           = group.name
      arn            = group.arn
      retention_days = group.retention_in_days
    }
  }
}

# Custom Metrics
output "custom_metrics" {
  description = "List of custom CloudWatch metrics created"
  value = [
    "1001Stories/UserActivity/UserRegistrations",
    "1001Stories/ContentWorkflow/StorySubmissions",
    "1001Stories/ReadingActivity/PDFReads",
    "1001Stories/ErrorTracking/ApplicationErrors"
  ]
}

# Synthetics Monitoring
output "synthetics_canary" {
  description = "CloudWatch Synthetics canary details"
  value = {
    name = aws_synthetics_canary.website_monitoring.name
    arn  = aws_synthetics_canary.website_monitoring.arn
    url  = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#synthetics:canary/detail/${aws_synthetics_canary.website_monitoring.name}"
  }
}

output "synthetics_artifacts_bucket" {
  description = "S3 bucket for Synthetics artifacts"
  value = {
    name = aws_s3_bucket.synthetics_artifacts.bucket
    arn  = aws_s3_bucket.synthetics_artifacts.arn
  }
}

# X-Ray Tracing
output "xray_sampling_rule" {
  description = "X-Ray sampling rule details"
  value = var.enable_xray_tracing ? {
    name = aws_xray_sampling_rule.main[0].rule_name
    arn  = aws_xray_sampling_rule.main[0].arn
  } : null
}

# Cost Monitoring
output "cost_budget" {
  description = "AWS Budget for cost monitoring"
  value = var.enable_cost_monitoring ? {
    name   = aws_budgets_budget.cost_monitoring[0].name
    limit  = "${aws_budgets_budget.cost_monitoring[0].limit_amount} ${aws_budgets_budget.cost_monitoring[0].limit_unit}"
  } : null
}

# Performance Targets
output "performance_targets" {
  description = "Configured performance targets for monitoring"
  value       = var.performance_targets
}

# Monitoring Commands and Queries
output "useful_commands" {
  description = "Useful commands for monitoring operations"
  value = {
    view_logs = {
      application_logs = "aws logs tail /aws/ecs/${var.name_prefix}-app --follow --region ${var.aws_region}"
      database_logs   = "aws logs tail /aws/rds/${var.name_prefix} --follow --region ${var.aws_region}"
    }

    cloudwatch_insights_queries = {
      error_analysis = "fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 100"
      user_activity  = "fields @timestamp, msg, user_id, role | filter msg like /User registered/ | stats count() by role"
      performance_analysis = "fields @timestamp, @message | filter @message like /response_time/ | sort @timestamp desc"
    }

    metric_queries = {
      current_users = "aws cloudwatch get-metric-statistics --namespace 1001Stories/UserActivity --metric-name UserRegistrations --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 3600 --statistics Sum --region ${var.aws_region}"

      error_rate = "aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name HTTPCode_Target_5XX_Count --dimensions Name=LoadBalancer,Value=${var.load_balancer_name} --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Sum --region ${var.aws_region}"

      response_times = "aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name TargetResponseTime --dimensions Name=LoadBalancer,Value=${var.load_balancer_name} --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Average --region ${var.aws_region}"
    }
  }
}

# Alert Configuration Summary
output "alert_configuration" {
  description = "Summary of alert configuration"
  value = {
    critical_alert_recipients = length(var.critical_alert_emails)
    warning_alert_recipients  = length(var.warning_alert_emails)
    info_alert_recipients     = length(var.info_alert_emails)
    cost_alert_recipients     = length(var.cost_alert_emails)

    thresholds = {
      error_rate_threshold         = var.error_rate_threshold
      response_time_threshold      = var.response_time_threshold
      cpu_threshold_warning        = var.cpu_threshold_warning
      cpu_threshold_critical       = var.cpu_threshold_critical
      memory_threshold_warning     = var.memory_threshold_warning
      database_cpu_threshold       = var.database_cpu_threshold
      database_connections_threshold = var.database_connections_threshold
    }
  }
}

# Monitoring Coverage Summary
output "monitoring_coverage" {
  description = "Summary of monitoring coverage"
  value = {
    application_monitoring = {
      response_times     = true
      error_rates       = true
      throughput        = true
      availability      = true
      custom_metrics    = var.enable_custom_metrics
    }

    infrastructure_monitoring = {
      ecs_metrics       = true
      database_metrics  = true
      load_balancer_metrics = true
      cloudfront_metrics = true
      s3_metrics        = true
    }

    educational_platform_monitoring = {
      user_registrations = true
      story_submissions  = true
      pdf_reading_activity = true
      workflow_tracking  = var.monitor_content_workflow
      reading_analytics  = var.monitor_reading_analytics
    }

    end_to_end_monitoring = {
      synthetics_enabled = var.enable_synthetics_monitoring
      health_checks     = true
      performance_tests = true
      mobile_testing    = true
      security_checks   = true
    }

    observability = {
      xray_tracing      = var.enable_xray_tracing
      detailed_monitoring = var.enable_detailed_monitoring
      log_analysis      = var.enable_log_insights_queries
      cost_monitoring   = var.enable_cost_monitoring
    }
  }
}

# Quick Access URLs
output "quick_access" {
  description = "Quick access URLs for monitoring resources"
  value = {
    cloudwatch_console = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}"

    logs_insights = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:logs-insights"

    synthetics_console = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#synthetics:"

    xray_console = var.enable_xray_tracing ? "https://${var.aws_region}.console.aws.amazon.com/xray/home?region=${var.aws_region}" : null

    cost_explorer = var.enable_cost_monitoring ? "https://console.aws.amazon.com/cost-management/home" : null

    alarms_console = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#alarmsV2:"
  }
}