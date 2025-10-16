# Auto-Scaling Module Outputs

output "autoscaling_target_arn" {
  description = "ARN of the ECS auto scaling target"
  value       = aws_appautoscaling_target.ecs_target.arn
}

output "cpu_scaling_policy_arn" {
  description = "ARN of the CPU-based scaling policy"
  value       = aws_appautoscaling_policy.scale_out_cpu.arn
}

output "memory_scaling_policy_arn" {
  description = "ARN of the memory-based scaling policy"
  value       = aws_appautoscaling_policy.scale_out_memory.arn
}

output "request_count_scaling_policy_arn" {
  description = "ARN of the request count scaling policy"
  value       = aws_appautoscaling_policy.scale_out_requests.arn
}

output "emergency_scaling_policy_arn" {
  description = "ARN of the emergency scaling policy"
  value       = aws_appautoscaling_policy.emergency_scale_out.arn
}

output "aurora_scaling_target_arn" {
  description = "ARN of the Aurora auto scaling target"
  value       = var.enable_aurora_autoscaling ? aws_appautoscaling_target.aurora_read_replica_target[0].arn : ""
}

output "aurora_scaling_policy_arn" {
  description = "ARN of the Aurora scaling policy"
  value       = var.enable_aurora_autoscaling ? aws_appautoscaling_policy.aurora_scaling_policy[0].arn : ""
}

output "scaling_dashboard_url" {
  description = "URL of the auto scaling CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.autoscaling_dashboard.dashboard_name}"
}

output "scaling_notifications_topic_arn" {
  description = "ARN of the scaling notifications SNS topic"
  value       = aws_sns_topic.scaling_notifications.arn
}