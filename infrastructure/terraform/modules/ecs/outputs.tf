# ECS Module Outputs

output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "service_name" {
  description = "ECS service name (active slot)"
  value       = var.blue_green_deployment ? aws_ecs_service.app_green.name : aws_ecs_service.app_blue.name
}

output "service_arn" {
  description = "ECS service ARN (active slot)"
  value       = var.blue_green_deployment ? aws_ecs_service.app_green.service_registries : aws_ecs_service.app_blue.service_registries
}

output "task_definition_arn" {
  description = "ECS task definition ARN"
  value       = aws_ecs_task_definition.app.arn
}

output "task_definition_family" {
  description = "ECS task definition family"
  value       = aws_ecs_task_definition.app.family
}

output "task_definition_revision" {
  description = "ECS task definition revision"
  value       = aws_ecs_task_definition.app.revision
}

# Load Balancer Outputs
output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_arn_suffix" {
  description = "Application Load Balancer ARN suffix for CloudWatch metrics"
  value       = aws_lb.main.arn_suffix
}

# Target Group Outputs
output "target_group_blue_arn" {
  description = "Blue target group ARN"
  value       = aws_lb_target_group.app_blue.arn
}

output "target_group_green_arn" {
  description = "Green target group ARN"
  value       = aws_lb_target_group.app_green.arn
}

output "active_target_group_arn" {
  description = "Active target group ARN"
  value       = var.blue_green_deployment ? aws_lb_target_group.app_green.arn : aws_lb_target_group.app_blue.arn
}

output "inactive_target_group_arn" {
  description = "Inactive target group ARN"
  value       = var.blue_green_deployment ? aws_lb_target_group.app_blue.arn : aws_lb_target_group.app_green.arn
}

# Listener Outputs
output "https_listener_arn" {
  description = "HTTPS listener ARN"
  value       = aws_lb_listener.https.arn
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

# IAM Role Outputs
output "execution_role_arn" {
  description = "ECS execution role ARN"
  value       = aws_iam_role.ecs_execution.arn
}

output "task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

# CloudWatch Outputs
output "log_group_name" {
  description = "CloudWatch log group name for application logs"
  value       = aws_cloudwatch_log_group.app.name
}

output "log_group_arn" {
  description = "CloudWatch log group ARN for application logs"
  value       = aws_cloudwatch_log_group.app.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.ecs.dashboard_name}"
}

# Service Discovery Outputs
output "service_discovery_namespace_id" {
  description = "Service discovery namespace ID"
  value       = var.enable_service_discovery ? aws_service_discovery_private_dns_namespace.main[0].id : null
}

output "service_discovery_service_arn" {
  description = "Service discovery service ARN"
  value       = var.enable_service_discovery ? aws_service_discovery_service.app[0].arn : null
}

# Security Outputs
output "kms_key_id" {
  description = "KMS key ID for ECS encryption"
  value       = aws_kms_key.ecs.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for ECS encryption"
  value       = aws_kms_key.ecs.arn
}

# S3 Outputs
output "alb_logs_bucket_name" {
  description = "S3 bucket name for ALB access logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "alb_logs_bucket_arn" {
  description = "S3 bucket ARN for ALB access logs"
  value       = aws_s3_bucket.alb_logs.arn
}

# Blue-Green Deployment Outputs
output "blue_service_name" {
  description = "Blue ECS service name"
  value       = aws_ecs_service.app_blue.name
}

output "green_service_name" {
  description = "Green ECS service name"
  value       = aws_ecs_service.app_green.name
}

output "active_slot" {
  description = "Currently active deployment slot"
  value       = var.blue_green_deployment ? "green" : "blue"
}

output "inactive_slot" {
  description = "Currently inactive deployment slot"
  value       = var.blue_green_deployment ? "blue" : "green"
}

# Capacity and Scaling Outputs
output "current_desired_count" {
  description = "Current desired count for active service"
  value       = var.blue_green_deployment ? aws_ecs_service.app_green.desired_count : aws_ecs_service.app_blue.desired_count
}

output "current_running_count" {
  description = "Current running count for active service"
  value       = var.blue_green_deployment ? aws_ecs_service.app_green.running_count : aws_ecs_service.app_blue.running_count
}

output "current_pending_count" {
  description = "Current pending count for active service"
  value       = var.blue_green_deployment ? aws_ecs_service.app_green.pending_count : aws_ecs_service.app_blue.pending_count
}

# Health and Status Outputs
output "target_group_health_check_path" {
  description = "Health check path for target groups"
  value       = var.health_check_path
}

output "health_check_url" {
  description = "Full health check URL"
  value       = "https://${aws_lb.main.dns_name}${var.health_check_path}"
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information for monitoring and automation"
  value = {
    cluster_name = aws_ecs_cluster.main.name
    service_blue = {
      name         = aws_ecs_service.app_blue.name
      desired_count = aws_ecs_service.app_blue.desired_count
      target_group = aws_lb_target_group.app_blue.arn
    }
    service_green = {
      name         = aws_ecs_service.app_green.name
      desired_count = aws_ecs_service.app_green.desired_count
      target_group = aws_lb_target_group.app_green.arn
    }
    active_slot = var.blue_green_deployment ? "green" : "blue"
    load_balancer = {
      dns_name = aws_lb.main.dns_name
      zone_id  = aws_lb.main.zone_id
    }
  }
}