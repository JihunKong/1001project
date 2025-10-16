# Comprehensive Monitoring Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Log Groups Configuration
variable "log_groups" {
  description = "Configuration for CloudWatch log groups"
  type = map(object({
    retention_days = number
    log_type      = string
  }))
  default = {
    "/aws/ecs/1001-stories-app" = {
      retention_days = 30
      log_type      = "application"
    }
    "/aws/ecs/1001-stories-nginx" = {
      retention_days = 14
      log_type      = "webserver"
    }
    "/aws/rds/1001-stories" = {
      retention_days = 90
      log_type      = "database"
    }
    "/aws/lambda/1001-stories" = {
      retention_days = 14
      log_type      = "function"
    }
    "/aws/cloudtrail/1001-stories" = {
      retention_days = 365
      log_type      = "audit"
    }
  }
}

variable "logs_kms_key_arn" {
  description = "KMS key ARN for encrypting CloudWatch logs"
  type        = string
  default     = ""
}

# Service References
variable "ecs_service_name" {
  description = "Name of the ECS service to monitor"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "load_balancer_name" {
  description = "Name of the Application Load Balancer"
  type        = string
}

variable "target_group_arn_suffix" {
  description = "ARN suffix of the target group for ALB metrics"
  type        = string
  default     = ""
}

variable "database_cluster_identifier" {
  description = "RDS cluster identifier"
  type        = string
}

variable "content_bucket_name" {
  description = "S3 content bucket name"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name for synthetic monitoring"
  type        = string
}

# Alert Configuration
variable "critical_alert_emails" {
  description = "Email addresses for critical alerts (service outages, security incidents)"
  type        = list(string)
  default     = []
}

variable "warning_alert_emails" {
  description = "Email addresses for warning alerts (performance issues, high utilization)"
  type        = list(string)
  default     = []
}

variable "info_alert_emails" {
  description = "Email addresses for informational alerts (scaling events, recoveries)"
  type        = list(string)
  default     = []
}

variable "cost_alert_emails" {
  description = "Email addresses for cost-related alerts"
  type        = list(string)
  default     = []
}

# Alerting Thresholds
variable "error_rate_threshold" {
  description = "Threshold for 5XX error rate alarm"
  type        = number
  default     = 50
}

variable "response_time_threshold" {
  description = "Response time threshold in seconds"
  type        = number
  default     = 2.0
}

variable "cpu_threshold_warning" {
  description = "CPU utilization threshold for warnings"
  type        = number
  default     = 75
}

variable "cpu_threshold_critical" {
  description = "CPU utilization threshold for critical alerts"
  type        = number
  default     = 90
}

variable "memory_threshold_warning" {
  description = "Memory utilization threshold for warnings"
  type        = number
  default     = 85
}

variable "database_cpu_threshold" {
  description = "Database CPU utilization threshold"
  type        = number
  default     = 80
}

variable "database_connections_threshold" {
  description = "Database connections threshold"
  type        = number
  default     = 450
}

variable "low_user_activity_threshold" {
  description = "Minimum user registrations per hour before alerting"
  type        = number
  default     = 5
}

variable "high_application_errors_threshold" {
  description = "Maximum application errors per 5 minutes before alerting"
  type        = number
  default     = 10
}

# Monitoring Features
variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray distributed tracing"
  type        = bool
  default     = true
}

variable "enable_synthetics_monitoring" {
  description = "Enable CloudWatch Synthetics for end-to-end monitoring"
  type        = bool
  default     = true
}

variable "enable_custom_metrics" {
  description = "Enable custom application metrics"
  type        = bool
  default     = true
}

variable "enable_cost_monitoring" {
  description = "Enable AWS Budgets for cost monitoring"
  type        = bool
  default     = true
}

# Synthetics Configuration
variable "synthetics_schedule" {
  description = "Schedule expression for Synthetics canary (rate or cron)"
  type        = string
  default     = "rate(5 minutes)"
}

variable "synthetics_timeout" {
  description = "Timeout for Synthetics canary in seconds"
  type        = number
  default     = 60
}

variable "synthetics_retention_success" {
  description = "Retention period for successful Synthetics runs in days"
  type        = number
  default     = 2
}

variable "synthetics_retention_failure" {
  description = "Retention period for failed Synthetics runs in days"
  type        = number
  default     = 14
}

# Dashboard Configuration
variable "enable_main_dashboard" {
  description = "Create main overview dashboard"
  type        = bool
  default     = true
}

variable "enable_educational_dashboard" {
  description = "Create educational platform metrics dashboard"
  type        = bool
  default     = true
}

variable "enable_performance_dashboard" {
  description = "Create performance metrics dashboard"
  type        = bool
  default     = true
}

# Cost Monitoring
variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD for cost monitoring"
  type        = number
  default     = 18000  # $216K annual / 12 months
}

variable "cost_alert_threshold_warning" {
  description = "Cost threshold percentage for warning alerts"
  type        = number
  default     = 80
}

variable "cost_alert_threshold_critical" {
  description = "Cost threshold percentage for critical alerts"
  type        = number
  default     = 100
}

# Log Analysis Configuration
variable "enable_log_insights_queries" {
  description = "Enable predefined CloudWatch Log Insights queries"
  type        = bool
  default     = true
}

variable "log_analysis_retention_days" {
  description = "Number of days to retain log analysis results"
  type        = number
  default     = 30
}

# Educational Platform Specific Monitoring
variable "monitor_user_roles" {
  description = "List of user roles to monitor in educational metrics"
  type        = list(string)
  default     = ["LEARNER", "TEACHER", "VOLUNTEER", "STORY_MANAGER", "BOOK_MANAGER", "CONTENT_ADMIN", "ADMIN"]
}

variable "monitor_content_workflow" {
  description = "Enable monitoring of content workflow stages"
  type        = bool
  default     = true
}

variable "monitor_reading_analytics" {
  description = "Enable monitoring of reading and engagement analytics"
  type        = bool
  default     = true
}

# Composite Alarms
variable "enable_composite_alarms" {
  description = "Enable composite alarms for complex alerting scenarios"
  type        = bool
  default     = true
}

# Performance Targets
variable "performance_targets" {
  description = "Performance targets for monitoring"
  type = object({
    response_time_p95_seconds = number
    error_rate_percentage     = number
    availability_percentage   = number
    throughput_requests_per_second = number
  })
  default = {
    response_time_p95_seconds      = 2.0
    error_rate_percentage          = 1.0
    availability_percentage        = 99.9
    throughput_requests_per_second = 1000
  }
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}