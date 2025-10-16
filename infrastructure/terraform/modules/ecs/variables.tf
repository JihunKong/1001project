# ECS Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ECS will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs to attach to ECS tasks"
  type        = list(string)
}

variable "cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "memory" {
  description = "Memory in MB for ECS task"
  type        = number
  default     = 2048
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 3
}

variable "ecr_repository_url" {
  description = "URL of ECR repository containing the application image"
  type        = string
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS listener"
  type        = string
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "blue_green_deployment" {
  description = "Enable blue-green deployment (true = green is active, false = blue is active)"
  type        = bool
  default     = false
}

variable "enable_service_discovery" {
  description = "Enable AWS Cloud Map service discovery"
  type        = bool
  default     = false
}

variable "enable_efs_storage" {
  description = "Enable EFS storage for shared files"
  type        = bool
  default     = false
}

variable "efs_file_system_id" {
  description = "EFS file system ID (required if enable_efs_storage is true)"
  type        = string
  default     = ""
}

variable "efs_access_point_id" {
  description = "EFS access point ID (required if enable_efs_storage is true)"
  type        = string
  default     = ""
}

variable "s3_bucket_name" {
  description = "S3 bucket name for static assets"
  type        = string
}

# Environment Variables for the application
variable "environment_variables" {
  description = "Environment variables to pass to the container"
  type        = map(string)
  default     = {}
}

# Secrets from AWS Secrets Manager
variable "secrets" {
  description = "Secrets from AWS Secrets Manager to pass to the container"
  type        = map(string)
  default     = {}
}

# Auto Scaling Configuration
variable "enable_auto_scaling" {
  description = "Enable auto scaling for ECS service"
  type        = bool
  default     = true
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto scaling"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto scaling"
  type        = number
  default     = 10
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "target_memory_utilization" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 80
}

variable "scale_up_cooldown" {
  description = "Cooldown period in seconds for scale up"
  type        = number
  default     = 300
}

variable "scale_down_cooldown" {
  description = "Cooldown period in seconds for scale down"
  type        = number
  default     = 300
}

# Health Check Configuration
variable "health_check_path" {
  description = "Health check path for ALB target group"
  type        = string
  default     = "/api/health"
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 10
}

variable "healthy_threshold" {
  description = "Number of consecutive successful health checks"
  type        = number
  default     = 2
}

variable "unhealthy_threshold" {
  description = "Number of consecutive failed health checks"
  type        = number
  default     = 3
}

# Load Balancer Configuration
variable "enable_sticky_sessions" {
  description = "Enable sticky sessions for auto-save functionality"
  type        = bool
  default     = true
}

variable "sticky_duration" {
  description = "Sticky session duration in seconds"
  type        = number
  default     = 86400  # 24 hours
}

variable "enable_alb_logs" {
  description = "Enable ALB access logs"
  type        = bool
  default     = true
}

variable "alb_idle_timeout" {
  description = "ALB idle timeout in seconds"
  type        = number
  default     = 60
}

# Security Configuration
variable "enable_execute_command" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = true
}

variable "enable_container_insights" {
  description = "Enable Container Insights for enhanced monitoring"
  type        = bool
  default     = true
}

# Performance Configuration
variable "enable_performance_mode" {
  description = "Enable performance optimizations for high-traffic scenarios"
  type        = bool
  default     = true
}

variable "task_cpu_architecture" {
  description = "CPU architecture for ECS tasks (X86_64 or ARM64)"
  type        = string
  default     = "X86_64"

  validation {
    condition     = contains(["X86_64", "ARM64"], var.task_cpu_architecture)
    error_message = "CPU architecture must be X86_64 or ARM64."
  }
}

variable "enable_fargate_spot" {
  description = "Use Fargate Spot for cost optimization (non-production only)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}