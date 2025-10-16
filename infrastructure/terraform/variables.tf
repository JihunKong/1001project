# 1001 Stories Infrastructure Variables

variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "backup_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "1001stories.seedsofempowerment.org"
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate in us-east-1 for CloudFront"
  type        = string
}

variable "alert_email" {
  description = "Email address for infrastructure alerts"
  type        = string
}

# Secrets Manager ARNs for sensitive data
variable "openai_api_key_secret_arn" {
  description = "ARN of OpenAI API key in AWS Secrets Manager"
  type        = string
}

variable "upstage_api_key_secret_arn" {
  description = "ARN of Upstage API key in AWS Secrets Manager"
  type        = string
}

variable "smtp_password_secret_arn" {
  description = "ARN of SMTP password in AWS Secrets Manager"
  type        = string
}

# Database configuration
variable "database_backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
}

variable "enable_database_deletion_protection" {
  description = "Enable deletion protection for RDS cluster"
  type        = bool
  default     = true
}

# Application scaling configuration
variable "app_min_capacity" {
  description = "Minimum number of application instances"
  type        = number
  default     = 2
}

variable "app_max_capacity" {
  description = "Maximum number of application instances"
  type        = number
  default     = 10
}

variable "app_target_cpu_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "app_target_memory_utilization" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 80
}

# Monitoring configuration
variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for RDS and ECS"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

# Cost optimization
variable "enable_spot_instances" {
  description = "Use Spot instances for non-production environments"
  type        = bool
  default     = false
}

variable "enable_reserved_capacity" {
  description = "Use reserved capacity for cost optimization"
  type        = bool
  default     = true
}

# Feature flags
variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray distributed tracing"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable AWS WAF for security"
  type        = bool
  default     = true
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup for disaster recovery"
  type        = bool
  default     = true
}

# Global configuration
variable "allowed_countries" {
  description = "List of allowed countries for content access (ISO country codes)"
  type        = list(string)
  default     = [] # Empty list means all countries allowed
}

variable "rate_limit_per_ip" {
  description = "Maximum requests per IP per 5-minute window"
  type        = number
  default     = 2000
}

# Educational platform specific configurations
variable "max_file_size_mb" {
  description = "Maximum file size for PDF uploads in MB"
  type        = number
  default     = 50
}

variable "pdf_processing_timeout" {
  description = "Timeout for PDF processing in seconds"
  type        = number
  default     = 300
}

variable "max_concurrent_readers" {
  description = "Maximum concurrent PDF readers per book"
  type        = number
  default     = 100
}

# Database specific configurations
variable "db_parameter_group_family" {
  description = "DB parameter group family"
  type        = string
  default     = "aurora-postgresql15"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights for RDS"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Performance Insights retention period in days"
  type        = number
  default     = 7
}

# Redis configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in Redis cluster"
  type        = number
  default     = 3
}

variable "redis_snapshot_retention_limit" {
  description = "Number of days to retain Redis snapshots"
  type        = number
  default     = 5
}

# CloudFront configuration
variable "cloudfront_price_class" {
  description = "CloudFront price class for global distribution"
  type        = string
  default     = "PriceClass_All"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "CloudFront price class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache in seconds"
  type        = number
  default     = 3600
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache in seconds"
  type        = number
  default     = 86400
}

# Load Balancer Configuration
variable "load_balancer_name" {
  description = "Name of the Application Load Balancer"
  type        = string
  default     = ""
}

# Alert Configuration
variable "critical_alert_emails" {
  description = "Email addresses for critical alerts"
  type        = list(string)
  default     = []
}

variable "warning_alert_emails" {
  description = "Email addresses for warning alerts"
  type        = list(string)
  default     = []
}

variable "cost_alert_emails" {
  description = "Email addresses for cost alerts"
  type        = list(string)
  default     = []
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 500
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}