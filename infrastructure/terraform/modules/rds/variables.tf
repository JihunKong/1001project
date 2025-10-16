# RDS Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where RDS will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS deployment"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs to attach to RDS"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class for primary instance"
  type        = string
  default     = "db.r6g.large"
}

variable "replica_instance_class" {
  description = "RDS instance class for read replicas"
  type        = string
  default     = "db.r6g.large"
}

variable "master_password" {
  description = "Master password for RDS cluster"
  type        = string
  sensitive   = true
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}