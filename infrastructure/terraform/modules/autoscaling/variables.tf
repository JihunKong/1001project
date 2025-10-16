# Auto-Scaling Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "service_name" {
  description = "Name of the ECS service"
  type        = string
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 50
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage"
  type        = number
  default     = 70
}

variable "memory_target_value" {
  description = "Target memory utilization percentage"
  type        = number
  default     = 80
}

variable "request_count_target_value" {
  description = "Target request count per target"
  type        = number
  default     = 1000
}

variable "scale_out_cooldown" {
  description = "Cooldown period for scale out in seconds"
  type        = number
  default     = 120
}

variable "scale_in_cooldown" {
  description = "Cooldown period for scale in in seconds"
  type        = number
  default     = 300
}

variable "alb_target_group_arn_suffix" {
  description = "ALB target group ARN suffix for scaling metrics"
  type        = string
  default     = ""
}

variable "load_balancer_name" {
  description = "Name of the load balancer"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Aurora Auto Scaling Variables
variable "enable_aurora_autoscaling" {
  description = "Enable Aurora read replica auto scaling"
  type        = bool
  default     = true
}

variable "aurora_cluster_identifier" {
  description = "Aurora cluster identifier"
  type        = string
  default     = ""
}

variable "aurora_min_capacity" {
  description = "Minimum Aurora read replicas"
  type        = number
  default     = 1
}

variable "aurora_max_capacity" {
  description = "Maximum Aurora read replicas"
  type        = number
  default     = 15
}

variable "aurora_cpu_target_value" {
  description = "Target CPU utilization for Aurora read replicas"
  type        = number
  default     = 75
}

# S3 Intelligent Tiering
variable "enable_s3_intelligent_tiering" {
  description = "Enable S3 Intelligent Tiering for cost optimization"
  type        = bool
  default     = true
}

variable "s3_content_bucket_name" {
  description = "S3 content bucket name for intelligent tiering"
  type        = string
  default     = ""
}

# Notification Settings
variable "scaling_notification_emails" {
  description = "Email addresses for scaling notifications"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}