# Multi-Region Deployment Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
}

variable "backup_region" {
  description = "AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

# Regional Capacity Configuration
variable "primary_region_capacity" {
  description = "Capacity configuration for the primary region"
  type = object({
    min     = number
    max     = number
    desired = number
  })
  default = {
    min     = 5
    max     = 50
    desired = 10
  }
}

variable "secondary_region_capacity" {
  description = "Capacity configuration for secondary regions"
  type = object({
    min     = number
    max     = number
    desired = number
  })
  default = {
    min     = 2
    max     = 20
    desired = 5
  }
}

variable "disaster_recovery_capacity" {
  description = "Capacity configuration for disaster recovery region"
  type = object({
    min     = number
    max     = number
    desired = number
  })
  default = {
    min     = 0
    max     = 50
    desired = 0  # Kept at 0 until DR activation
  }
}

# Traffic Distribution
variable "traffic_distribution" {
  description = "Percentage of traffic to route to each region"
  type = object({
    primary_region   = number
    europe_region    = number
    asia_region      = number
  })
  default = {
    primary_region   = 50
    europe_region    = 30
    asia_region      = 20
  }

  validation {
    condition     = var.traffic_distribution.primary_region + var.traffic_distribution.europe_region + var.traffic_distribution.asia_region == 100
    error_message = "Traffic distribution percentages must sum to 100."
  }
}

# Disaster Recovery Configuration
variable "enable_automatic_failover" {
  description = "Enable automatic failover to DR region"
  type        = bool
  default     = true
}

variable "failover_threshold_minutes" {
  description = "Minutes of downtime before triggering automatic failover"
  type        = number
  default     = 5
}

variable "rto_target_minutes" {
  description = "Recovery Time Objective in minutes"
  type        = number
  default     = 60  # 1 hour
}

variable "rpo_target_minutes" {
  description = "Recovery Point Objective in minutes"
  type        = number
  default     = 15  # 15 minutes
}

# Cross-Region Replication
variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for S3 buckets"
  type        = bool
  default     = true
}

variable "replication_storage_class" {
  description = "Storage class for replicated objects in secondary regions"
  type        = string
  default     = "STANDARD_IA"

  validation {
    condition     = contains(["STANDARD", "STANDARD_IA", "ONEZONE_IA", "GLACIER", "DEEP_ARCHIVE"], var.replication_storage_class)
    error_message = "Replication storage class must be a valid S3 storage class."
  }
}

variable "dr_storage_class" {
  description = "Storage class for disaster recovery region"
  type        = string
  default     = "GLACIER"
}

# Database Configuration
variable "enable_cross_region_automated_backups" {
  description = "Enable cross-region automated backups for RDS"
  type        = bool
  default     = true
}

variable "database_backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 35
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for databases"
  type        = bool
  default     = true
}

# Health Checks
variable "health_check_failure_threshold" {
  description = "Number of consecutive failures before marking unhealthy"
  type        = number
  default     = 3
}

variable "health_check_request_interval" {
  description = "Interval between health check requests in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Timeout for health check requests in seconds"
  type        = number
  default     = 10
}

# Monitoring and Alerting
variable "primary_region_alerts" {
  description = "Email addresses for primary region alerts"
  type        = list(string)
  default     = []
}

variable "secondary_region_alerts" {
  description = "Email addresses for secondary region alerts"
  type        = list(string)
  default     = []
}

variable "disaster_recovery_alerts" {
  description = "Email addresses for disaster recovery alerts"
  type        = list(string)
  default     = []
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

# Route53 Configuration
variable "ttl_values" {
  description = "TTL values for Route53 records"
  type = object({
    health_check = number
    failover     = number
    geolocation  = number
  })
  default = {
    health_check = 30
    failover     = 60
    geolocation  = 300
  }
}

# Cost Optimization
variable "enable_regional_cost_optimization" {
  description = "Enable cost optimization features per region"
  type        = bool
  default     = true
}

variable "secondary_region_spot_percentage" {
  description = "Percentage of capacity to run on Spot instances in secondary regions"
  type        = number
  default     = 30

  validation {
    condition     = var.secondary_region_spot_percentage >= 0 && var.secondary_region_spot_percentage <= 100
    error_message = "Spot percentage must be between 0 and 100."
  }
}

# Compliance and Data Residency
variable "data_residency_requirements" {
  description = "Data residency requirements by region"
  type = map(object({
    keep_data_local = bool
    allowed_regions = list(string)
  }))
  default = {
    eu-west-1 = {
      keep_data_local = true
      allowed_regions = ["eu-west-1", "eu-central-1", "eu-west-2"]
    }
    ap-southeast-1 = {
      keep_data_local = false
      allowed_regions = ["ap-southeast-1", "ap-northeast-1", "us-west-2"]
    }
  }
}

variable "enable_gdpr_compliance" {
  description = "Enable GDPR compliance features for EU region"
  type        = bool
  default     = true
}

# Latency Optimization
variable "cloudfront_price_class" {
  description = "CloudFront price class for global distribution"
  type        = string
  default     = "PriceClass_All"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "CloudFront price class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

variable "enable_latency_based_routing" {
  description = "Enable latency-based routing for Route53"
  type        = bool
  default     = true
}

# Security
variable "enable_waf_per_region" {
  description = "Enable WAF in each region"
  type        = bool
  default     = true
}

variable "allowed_countries" {
  description = "List of allowed countries for content access (ISO country codes)"
  type        = list(string)
  default     = []  # Empty list means all countries allowed
}

variable "rate_limit_per_region" {
  description = "Rate limit configuration per region"
  type = map(number)
  default = {
    "us-east-1"      = 2000
    "eu-west-1"      = 1500
    "ap-southeast-1" = 1000
  }
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}