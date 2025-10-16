# Variables for CloudFront CDN Module

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

# S3 Configuration
variable "s3_bucket_name" {
  description = "Name of the S3 bucket for content storage"
  type        = string
}

variable "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  type        = string
}

variable "origin_access_identity_path" {
  description = "CloudFront origin access identity path"
  type        = string
}

# Domain and SSL Configuration
variable "domain_aliases" {
  description = "List of domain aliases for the CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "ssl_certificate_arn" {
  description = "ARN of the SSL certificate in us-east-1"
  type        = string
  default     = ""
}

# CDN Configuration
variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_All"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "Price class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

variable "default_ttl" {
  description = "Default TTL for cache behavior in seconds"
  type        = number
  default     = 3600
}

variable "max_ttl" {
  description = "Maximum TTL for cache behavior in seconds"
  type        = number
  default     = 86400
}

variable "min_ttl" {
  description = "Minimum TTL for cache behavior in seconds"
  type        = number
  default     = 0
}

# Geographic Restrictions
variable "geo_restriction_type" {
  description = "Method to restrict distribution (none, whitelist, blacklist)"
  type        = string
  default     = "none"

  validation {
    condition     = contains(["none", "whitelist", "blacklist"], var.geo_restriction_type)
    error_message = "Geo restriction type must be none, whitelist, or blacklist."
  }
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo restrictions"
  type        = list(string)
  default     = []
}

# CORS and Security Configuration
variable "allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["https://1001stories.seedsofempowerment.org"]
}

variable "allowed_methods" {
  description = "List of allowed HTTP methods"
  type        = list(string)
  default     = ["GET", "HEAD", "OPTIONS", "POST", "PUT"]
}

variable "allowed_headers" {
  description = "List of allowed headers for CORS"
  type        = list(string)
  default = [
    "Accept",
    "Accept-Language",
    "Authorization",
    "Content-Type",
    "Origin",
    "X-User-Role"
  ]
}

variable "custom_headers" {
  description = "List of custom headers to add to responses"
  type = list(object({
    name     = string
    value    = string
    override = bool
  }))
  default = [
    {
      name     = "X-Educational-Platform"
      value    = "1001-stories"
      override = false
    },
    {
      name     = "X-Content-Type-Options"
      value    = "nosniff"
      override = false
    }
  ]
}

# Authentication and Access Control
variable "enable_edge_auth" {
  description = "Enable Lambda@Edge authentication"
  type        = bool
  default     = false
}

variable "allowed_roles" {
  description = "List of allowed user roles for content access"
  type        = list(string)
  default = [
    "learner",
    "teacher",
    "volunteer",
    "story_manager",
    "book_manager",
    "content_admin",
    "admin"
  ]
}

variable "signed_url_expiration" {
  description = "Expiration time for signed URLs in seconds"
  type        = number
  default     = 3600
}

# API Gateway Integration
variable "api_gateway_domain" {
  description = "Domain name of the API Gateway"
  type        = string
  default     = ""
}

variable "api_gateway_stage" {
  description = "API Gateway stage name"
  type        = string
  default     = ""
}

# WAF Configuration
variable "waf_web_acl_id" {
  description = "WAF Web ACL ID to associate with CloudFront"
  type        = string
  default     = ""
}

variable "enable_waf_protection" {
  description = "Enable WAF protection for CloudFront"
  type        = bool
  default     = true
}

# Logging Configuration
variable "enable_logging" {
  description = "Enable CloudFront access logging"
  type        = bool
  default     = true
}

variable "logs_bucket_domain_name" {
  description = "Domain name of the S3 bucket for access logs"
  type        = string
  default     = ""
}

variable "log_prefix" {
  description = "Prefix for CloudFront access logs"
  type        = string
  default     = "cloudfront-logs/"
}

variable "include_cookies_in_logs" {
  description = "Include cookies in access logs"
  type        = bool
  default     = false
}

# Monitoring and Alerting
variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring and alarms"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of alarm actions (SNS topic ARNs)"
  type        = list(string)
  default     = []
}

variable "error_4xx_threshold" {
  description = "Threshold for 4xx error rate alarm"
  type        = number
  default     = 5
}

variable "error_5xx_threshold" {
  description = "Threshold for 5xx error rate alarm"
  type        = number
  default     = 1
}

variable "cache_hit_rate_threshold" {
  description = "Minimum cache hit rate threshold"
  type        = number
  default     = 80
}

# Performance Configuration
variable "enable_compression" {
  description = "Enable compression for supported file types"
  type        = bool
  default     = true
}

variable "enable_ipv6" {
  description = "Enable IPv6 support"
  type        = bool
  default     = true
}

variable "http_version" {
  description = "Maximum HTTP version supported"
  type        = string
  default     = "http2"

  validation {
    condition     = contains(["http1.1", "http2"], var.http_version)
    error_message = "HTTP version must be http1.1 or http2."
  }
}

# Educational Platform Specific
variable "enable_role_based_caching" {
  description = "Enable role-based caching for different user types"
  type        = bool
  default     = true
}

variable "learner_cache_ttl" {
  description = "Cache TTL for learner content in seconds"
  type        = number
  default     = 3600
}

variable "teacher_cache_ttl" {
  description = "Cache TTL for teacher content in seconds"
  type        = number
  default     = 1800
}

variable "admin_cache_ttl" {
  description = "Cache TTL for admin content in seconds"
  type        = number
  default     = 0
}

# Content Type Specific Configurations
variable "pdf_cache_ttl" {
  description = "Cache TTL for PDF files in seconds"
  type        = number
  default     = 86400 # 1 day
}

variable "image_cache_ttl" {
  description = "Cache TTL for image files in seconds"
  type        = number
  default     = 2592000 # 30 days
}

variable "audio_cache_ttl" {
  description = "Cache TTL for audio files in seconds"
  type        = number
  default     = 3600 # 1 hour
}

variable "enable_audio_compression" {
  description = "Enable compression for audio files"
  type        = bool
  default     = false
}

# Cost Optimization
variable "enable_intelligent_caching" {
  description = "Enable intelligent caching based on content type"
  type        = bool
  default     = true
}

variable "enable_origin_shield" {
  description = "Enable CloudFront Origin Shield"
  type        = bool
  default     = false
}

variable "origin_shield_region" {
  description = "AWS region for Origin Shield"
  type        = string
  default     = "us-east-1"
}

# Error Page Configuration
variable "custom_error_pages" {
  description = "Custom error page configurations"
  type = list(object({
    error_code         = number
    response_code      = number
    response_page_path = string
    error_caching_min_ttl = number
  }))
  default = [
    {
      error_code            = 403
      response_code         = 404
      response_page_path    = "/404.html"
      error_caching_min_ttl = 10
    },
    {
      error_code            = 404
      response_code         = 404
      response_page_path    = "/404.html"
      error_caching_min_ttl = 10
    },
    {
      error_code            = 500
      response_code         = 500
      response_page_path    = "/500.html"
      error_caching_min_ttl = 0
    }
  ]
}

# Feature Flags
variable "enable_real_time_logs" {
  description = "Enable CloudFront real-time logs"
  type        = bool
  default     = false
}

variable "real_time_log_config_arn" {
  description = "ARN of the real-time log configuration"
  type        = string
  default     = ""
}

variable "enable_field_level_encryption" {
  description = "Enable field-level encryption"
  type        = bool
  default     = false
}

variable "field_level_encryption_id" {
  description = "Field-level encryption configuration ID"
  type        = string
  default     = ""
}

# Development and Testing
variable "enable_staging_distribution" {
  description = "Create a separate staging distribution"
  type        = bool
  default     = false
}

variable "staging_domain_aliases" {
  description = "Domain aliases for staging distribution"
  type        = list(string)
  default     = []
}

# Integration with Other AWS Services
variable "enable_lambda_edge" {
  description = "Enable Lambda@Edge functions"
  type        = bool
  default     = false
}

variable "lambda_edge_functions" {
  description = "Lambda@Edge function configurations"
  type = list(object({
    event_type   = string
    lambda_arn   = string
    include_body = bool
  }))
  default = []
}

variable "enable_cloudfront_functions" {
  description = "Enable CloudFront Functions"
  type        = bool
  default     = true
}

# Regional Configuration
variable "preferred_cache_regions" {
  description = "Preferred cache regions for global distribution"
  type        = list(string)
  default = [
    "US",
    "Europe",
    "Asia"
  ]
}

variable "enable_global_acceleration" {
  description = "Enable Global Accelerator integration"
  type        = bool
  default     = false
}