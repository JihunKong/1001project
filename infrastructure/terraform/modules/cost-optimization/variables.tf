# Cost Optimization Module Variables

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

# Spot Instance Configuration
variable "enable_spot_instances" {
  description = "Enable Spot instances for cost optimization"
  type        = bool
  default     = false
}

variable "spot_instance_types" {
  description = "List of EC2 instance types for Spot Fleet"
  type        = list(string)
  default     = ["m6i.large", "m6i.xlarge", "m5.large", "m5.xlarge"]
}

variable "spot_target_capacity" {
  description = "Target capacity for Spot Fleet"
  type        = number
  default     = 2
}

variable "max_spot_price" {
  description = "Maximum price for Spot instances (USD per hour)"
  type        = string
  default     = "0.10"
}

variable "spot_fleet_duration" {
  description = "Duration for Spot Fleet request in hours"
  type        = number
  default     = 168  # 1 week
}

variable "ami_id" {
  description = "AMI ID for Spot instances"
  type        = string
  default     = ""
}

variable "key_name" {
  description = "EC2 Key Pair name for Spot instances"
  type        = string
  default     = ""
}

variable "security_group_ids" {
  description = "Security group IDs for Spot instances"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Spot instances"
  type        = list(string)
  default     = []
}

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
  default     = ""
}

# Fargate Spot Configuration
variable "enable_fargate_spot" {
  description = "Enable Fargate Spot for ECS tasks"
  type        = bool
  default     = true
}

variable "fargate_spot_weight" {
  description = "Weight for Fargate Spot capacity provider"
  type        = number
  default     = 50
}

# Reserved Instance Configuration
variable "enable_reserved_instances" {
  description = "Enable Reserved Instance recommendations tracking"
  type        = bool
  default     = true
}

variable "rds_cluster_identifier" {
  description = "RDS cluster identifier for Reserved Instance tracking"
  type        = string
  default     = ""
}

# S3 Lifecycle Management
variable "enable_s3_lifecycle" {
  description = "Enable S3 lifecycle management for cost optimization"
  type        = bool
  default     = true
}

variable "content_bucket_id" {
  description = "S3 content bucket ID"
  type        = string
  default     = ""
}

variable "content_bucket_versioning" {
  description = "S3 bucket versioning configuration dependency"
  type        = any
  default     = null
}

# CloudWatch Logs Configuration
variable "log_group_configs" {
  description = "Configuration for CloudWatch log groups with retention policies"
  type = map(object({
    retention_days = number
    log_type      = string
  }))
  default = {
    "/aws/ecs/1001-stories-app" = {
      retention_days = 30
      log_type      = "application"
    }
    "/aws/rds/1001-stories" = {
      retention_days = 90
      log_type      = "database"
    }
    "/aws/lambda/1001-stories" = {
      retention_days = 14
      log_type      = "function"
    }
  }
}

variable "cloudwatch_logs_kms_key_arn" {
  description = "KMS key ARN for CloudWatch logs encryption"
  type        = string
  default     = ""
}

# Budget Configuration
variable "enable_cost_budgets" {
  description = "Enable AWS Budgets for cost monitoring"
  type        = bool
  default     = true
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 18000  # $216K annual / 12 months
}

variable "cost_alert_emails" {
  description = "Email addresses for cost alert notifications"
  type        = list(string)
  default     = []
}

# Cost Anomaly Detection
variable "enable_cost_anomaly_detection" {
  description = "Enable AWS Cost Anomaly Detection"
  type        = bool
  default     = true
}

variable "cost_optimization_emails" {
  description = "Email addresses for cost optimization notifications"
  type        = list(string)
  default     = []
}

# Lambda Cost Optimizer
variable "enable_cost_optimizer_lambda" {
  description = "Enable Lambda function for cost optimization recommendations"
  type        = bool
  default     = true
}

variable "cost_anomaly_threshold" {
  description = "Cost anomaly threshold for Lambda function"
  type        = number
  default     = 100
}

# Service References
variable "service_name" {
  description = "ECS service name for cost monitoring"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}