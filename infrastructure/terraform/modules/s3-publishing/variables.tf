# Variables for S3 Publishing Module

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

variable "enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for disaster recovery"
  type        = bool
  default     = true
}

variable "backup_region" {
  description = "AWS region for backup bucket"
  type        = string
  default     = "us-west-2"
}

variable "kms_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7

  validation {
    condition     = var.kms_deletion_window >= 7 && var.kms_deletion_window <= 30
    error_message = "KMS deletion window must be between 7 and 30 days."
  }
}

variable "lifecycle_rules" {
  description = "Custom lifecycle rules for S3 buckets"
  type = list(object({
    id                            = string
    status                        = string
    filter_prefix                 = optional(string)
    expiration_days              = optional(number)
    noncurrent_version_expiration = optional(number)
    transitions = optional(list(object({
      days          = number
      storage_class = string
    })))
  }))
  default = []
}

# Content Management Variables
variable "max_file_size_bytes" {
  description = "Maximum file size for uploads in bytes"
  type        = number
  default     = 52428800 # 50MB
}

variable "allowed_file_types" {
  description = "Allowed file types for uploads"
  type        = list(string)
  default     = ["pdf", "txt", "md", "jpg", "jpeg", "png", "mp3", "wav"]
}

variable "enable_multipart_upload" {
  description = "Enable multipart upload for large files"
  type        = bool
  default     = true
}

variable "multipart_threshold_bytes" {
  description = "Threshold for multipart upload in bytes"
  type        = number
  default     = 10485760 # 10MB
}

# Access Control Variables
variable "enable_public_read" {
  description = "Enable public read access (NOT recommended for production)"
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["https://1001stories.seedsofempowerment.org"]
}

variable "cors_allowed_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "PUT", "POST", "DELETE", "HEAD"]
}

variable "cors_allowed_headers" {
  description = "CORS allowed headers"
  type        = list(string)
  default     = ["*"]
}

variable "cors_expose_headers" {
  description = "CORS headers to expose"
  type        = list(string)
  default     = ["ETag", "x-amz-request-id"]
}

variable "cors_max_age_seconds" {
  description = "CORS max age in seconds"
  type        = number
  default     = 3600
}

# Cost Optimization Variables
variable "enable_intelligent_tiering" {
  description = "Enable S3 Intelligent Tiering"
  type        = bool
  default     = true
}

variable "intelligent_tiering_optional_fields" {
  description = "Optional fields for intelligent tiering"
  type        = list(string)
  default     = ["BucketKeyStatus"]
}

variable "transition_to_ia_days" {
  description = "Days after which to transition to IA storage class"
  type        = number
  default     = 30
}

variable "transition_to_glacier_days" {
  description = "Days after which to transition to Glacier storage class"
  type        = number
  default     = 90
}

variable "transition_to_deep_archive_days" {
  description = "Days after which to transition to Deep Archive storage class"
  type        = number
  default     = 365
}

# Educational Platform Specific Variables
variable "enable_pdf_processing" {
  description = "Enable PDF processing and optimization"
  type        = bool
  default     = true
}

variable "enable_image_optimization" {
  description = "Enable automatic image optimization"
  type        = bool
  default     = true
}

variable "enable_audio_processing" {
  description = "Enable audio file processing for TTS"
  type        = bool
  default     = true
}

variable "pdf_thumbnail_size" {
  description = "PDF thumbnail size in pixels"
  type        = number
  default     = 300
}

variable "image_max_width" {
  description = "Maximum image width in pixels"
  type        = number
  default     = 1920
}

variable "image_max_height" {
  description = "Maximum image height in pixels"
  type        = number
  default     = 1080
}

variable "image_quality" {
  description = "Image compression quality (1-100)"
  type        = number
  default     = 85

  validation {
    condition     = var.image_quality >= 1 && var.image_quality <= 100
    error_message = "Image quality must be between 1 and 100."
  }
}

# Publishing Workflow Variables
variable "submission_retention_days" {
  description = "Days to retain submission files after approval"
  type        = number
  default     = 90
}

variable "temp_file_retention_hours" {
  description = "Hours to retain temporary files"
  type        = number
  default     = 24
}

variable "enable_submission_versioning" {
  description = "Enable versioning for submission files"
  type        = bool
  default     = true
}

variable "max_submission_versions" {
  description = "Maximum number of versions to keep for submissions"
  type        = number
  default     = 10
}

# Monitoring Variables
variable "enable_cloudwatch_metrics" {
  description = "Enable CloudWatch metrics for S3"
  type        = bool
  default     = true
}

variable "enable_cloudtrail_logging" {
  description = "Enable CloudTrail logging for S3 API calls"
  type        = bool
  default     = true
}

variable "enable_access_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Days to retain access logs"
  type        = number
  default     = 90
}

# Security Variables
variable "enable_mfa_delete" {
  description = "Enable MFA delete protection"
  type        = bool
  default     = false # Can only be enabled via CLI/API by root user
}

variable "enable_object_lock" {
  description = "Enable S3 object lock for compliance"
  type        = bool
  default     = false
}

variable "object_lock_retention_days" {
  description = "Object lock retention period in days"
  type        = number
  default     = 30
}

variable "block_public_access" {
  description = "Block all public access to S3 buckets"
  type        = bool
  default     = true
}

variable "ssl_requests_only" {
  description = "Require SSL/TLS for all requests"
  type        = bool
  default     = true
}

# Notification Variables
variable "enable_event_notifications" {
  description = "Enable S3 event notifications"
  type        = bool
  default     = true
}

variable "notification_events" {
  description = "S3 events to monitor"
  type        = list(string)
  default = [
    "s3:ObjectCreated:*",
    "s3:ObjectRemoved:*"
  ]
}

variable "notification_filter_prefix" {
  description = "Filter prefix for event notifications"
  type        = string
  default     = ""
}

variable "notification_filter_suffix" {
  description = "Filter suffix for event notifications"
  type        = string
  default     = ""
}