# Variables for IAM Publishing Module

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "1001-stories"
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# S3 Resource ARNs
variable "content_bucket_arn" {
  description = "ARN of the main content S3 bucket"
  type        = string
}

variable "backup_bucket_arn" {
  description = "ARN of the backup S3 bucket"
  type        = string
  default     = null
}

variable "temp_bucket_arn" {
  description = "ARN of the temporary uploads S3 bucket"
  type        = string
}

variable "logs_bucket_arn" {
  description = "ARN of the access logs S3 bucket"
  type        = string
  default     = null
}

# KMS Configuration
variable "kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  type        = string
}

# Role Configuration
variable "enable_cross_account_access" {
  description = "Enable cross-account role assumption"
  type        = bool
  default     = false
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs allowed to assume roles"
  type        = list(string)
  default     = []
}

variable "external_id" {
  description = "External ID for role assumption security"
  type        = string
  default     = null
}

# Session Configuration
variable "max_session_duration_hours" {
  description = "Maximum session duration in hours for role assumption"
  type        = number
  default     = 8

  validation {
    condition     = var.max_session_duration_hours >= 1 && var.max_session_duration_hours <= 12
    error_message = "Max session duration must be between 1 and 12 hours."
  }
}

# Access Control Configuration
variable "enable_mfa_requirement" {
  description = "Require MFA for sensitive operations"
  type        = bool
  default     = true
}

variable "mfa_age_requirement_seconds" {
  description = "Maximum age of MFA token in seconds"
  type        = number
  default     = 3600 # 1 hour
}

variable "ip_restriction_enabled" {
  description = "Enable IP-based access restrictions"
  type        = bool
  default     = false
}

variable "allowed_ip_ranges" {
  description = "List of allowed IP CIDR ranges"
  type        = list(string)
  default     = []
}

# Application Integration
variable "app_cluster_name" {
  description = "ECS cluster name for application deployment"
  type        = string
  default     = ""
}

variable "app_service_name" {
  description = "ECS service name for application deployment"
  type        = string
  default     = ""
}

# Lambda Configuration
variable "enable_lambda_processing" {
  description = "Enable Lambda functions for content processing"
  type        = bool
  default     = true
}

variable "lambda_function_names" {
  description = "List of Lambda function names that need S3 access"
  type        = list(string)
  default = [
    "pdf-processor",
    "image-optimizer",
    "audio-generator",
    "thumbnail-generator"
  ]
}

# Logging and Monitoring
variable "enable_cloudtrail_logging" {
  description = "Enable CloudTrail logging for IAM events"
  type        = bool
  default     = true
}

variable "cloudwatch_log_group" {
  description = "CloudWatch log group name for application logs"
  type        = string
  default     = "/aws/ecs/1001-stories"
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30

  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

# Security Configuration
variable "enable_resource_based_policies" {
  description = "Enable resource-based policies for additional security"
  type        = bool
  default     = true
}

variable "deny_unencrypted_uploads" {
  description = "Deny uploads that are not encrypted"
  type        = bool
  default     = true
}

variable "require_ssl_requests_only" {
  description = "Require SSL/TLS for all requests"
  type        = bool
  default     = true
}

# Educational Platform Specific
variable "student_access_control" {
  description = "Enable fine-grained student access control"
  type        = bool
  default     = true
}

variable "teacher_assignment_permissions" {
  description = "Enable teacher book assignment capabilities"
  type        = bool
  default     = true
}

variable "content_approval_workflow" {
  description = "Enable multi-stage content approval workflow"
  type        = bool
  default     = true
}

# API Integration
variable "enable_api_gateway_integration" {
  description = "Enable API Gateway integration for signed URLs"
  type        = bool
  default     = true
}

variable "api_gateway_arn" {
  description = "ARN of API Gateway for S3 proxy integration"
  type        = string
  default     = ""
}

# Cost Optimization
variable "enable_cost_allocation_tags" {
  description = "Enable detailed cost allocation tags"
  type        = bool
  default     = true
}

variable "cost_center" {
  description = "Cost center identifier for billing"
  type        = string
  default     = "education-platform"
}

# Compliance and Audit
variable "enable_compliance_mode" {
  description = "Enable compliance mode with additional restrictions"
  type        = bool
  default     = false
}

variable "data_residency_region" {
  description = "Required data residency region"
  type        = string
  default     = ""
}

variable "audit_log_bucket_arn" {
  description = "S3 bucket ARN for audit logs"
  type        = string
  default     = ""
}

# Performance Configuration
variable "enable_s3_transfer_acceleration" {
  description = "Enable S3 Transfer Acceleration permissions"
  type        = bool
  default     = true
}

variable "enable_multipart_upload" {
  description = "Enable multipart upload permissions"
  type        = bool
  default     = true
}

variable "max_upload_size_bytes" {
  description = "Maximum upload size in bytes"
  type        = number
  default     = 52428800 # 50MB
}

# Development and Testing
variable "enable_development_access" {
  description = "Enable additional permissions for development environment"
  type        = bool
  default     = false
}

variable "development_users" {
  description = "List of IAM users with development access"
  type        = list(string)
  default     = []
}

# Backup and Recovery
variable "enable_backup_access" {
  description = "Enable backup and recovery permissions"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 90
}

# Feature Flags
variable "enable_ai_processing" {
  description = "Enable AI processing permissions for content generation"
  type        = bool
  default     = true
}

variable "enable_real_time_notifications" {
  description = "Enable real-time notifications for S3 events"
  type        = bool
  default     = true
}

variable "enable_content_delivery_network" {
  description = "Enable CDN integration permissions"
  type        = bool
  default     = true
}

# Integration with External Services
variable "openai_integration_enabled" {
  description = "Enable OpenAI service integration"
  type        = bool
  default     = true
}

variable "external_webhook_urls" {
  description = "List of external webhook URLs for notifications"
  type        = list(string)
  default     = []
}