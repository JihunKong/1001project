# Cost Optimization Module Outputs

output "spot_fleet_id" {
  description = "ID of the Spot Fleet request"
  value       = var.enable_spot_instances ? aws_spot_fleet_request.dev_workloads[0].id : ""
}

output "cost_optimization_sns_topic_arn" {
  description = "ARN of the cost optimization SNS topic"
  value       = aws_sns_topic.cost_optimization_alerts.arn
}

output "cost_budget_name" {
  description = "Name of the cost budget"
  value       = var.enable_cost_budgets ? aws_budgets_budget.monthly_cost_budget[0].name : ""
}

output "cost_anomaly_detector_arn" {
  description = "ARN of the cost anomaly detector"
  value       = var.enable_cost_anomaly_detection ? aws_cost_anomaly_detector.ri_recommendations[0].arn : ""
}

output "cost_optimizer_function_arn" {
  description = "ARN of the cost optimizer Lambda function"
  value       = var.enable_cost_optimizer_lambda ? aws_lambda_function.cost_optimizer[0].arn : ""
}

output "cost_optimization_dashboard_url" {
  description = "URL of the cost optimization CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.cost_optimization_dashboard.dashboard_name}"
}

output "s3_lifecycle_configuration_id" {
  description = "ID of the S3 lifecycle configuration"
  value       = var.enable_s3_lifecycle ? aws_s3_bucket_lifecycle_configuration.content_lifecycle[0].id : ""
}

output "fargate_spot_capacity_provider_name" {
  description = "Name of the Fargate Spot capacity provider"
  value       = var.enable_fargate_spot ? aws_ecs_capacity_provider.fargate_spot[0].name : ""
}

output "cost_optimization_schedule_rule_arn" {
  description = "ARN of the cost optimization schedule rule"
  value       = var.enable_cost_optimizer_lambda ? aws_cloudwatch_event_rule.cost_optimization_schedule[0].arn : ""
}

# Cost Projections (Estimated Values)
output "estimated_monthly_savings_spot" {
  description = "Estimated monthly savings from Spot instances"
  value       = var.enable_spot_instances ? var.spot_target_capacity * 0.5 * 24 * 30 * 0.7 : 0
}

output "estimated_monthly_savings_lifecycle" {
  description = "Estimated monthly savings from S3 lifecycle policies"
  value       = var.enable_s3_lifecycle ? "500-2000" : "0"
}

output "estimated_annual_savings_reserved" {
  description = "Estimated annual savings potential from Reserved Instances"
  value       = var.enable_reserved_instances ? "15000-45000" : "0"
}

# Log Group Names for Reference
output "cost_optimized_log_groups" {
  description = "Map of cost-optimized log group names and their retention periods"
  value = {
    for name, config in var.log_group_configs :
    name => {
      retention_days = config.retention_days
      log_type      = config.log_type
    }
  }
}