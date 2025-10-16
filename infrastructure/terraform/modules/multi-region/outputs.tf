# Multi-Region Deployment Outputs

# Regional Infrastructure Outputs
output "primary_region" {
  description = "Primary region infrastructure details"
  value = {
    region                = "us-east-1"
    load_balancer_dns     = module.primary_region.load_balancer_dns_name
    database_endpoint     = module.primary_region.database_endpoint
    ecs_cluster_name      = module.primary_region.ecs_cluster_name
    ecs_service_name      = module.primary_region.ecs_service_name
    content_bucket_name   = module.primary_region.content_bucket_name
    health_check_id       = aws_route53_health_check.primary_region_health.id
  }
}

output "europe_region" {
  description = "Europe region infrastructure details"
  value = {
    region                = "eu-west-1"
    load_balancer_dns     = module.europe_region.load_balancer_dns_name
    database_endpoint     = module.europe_region.database_endpoint
    ecs_cluster_name      = module.europe_region.ecs_cluster_name
    ecs_service_name      = module.europe_region.ecs_service_name
    content_bucket_name   = module.europe_region.content_bucket_name
    health_check_id       = aws_route53_health_check.europe_region_health.id
  }
}

output "asia_region" {
  description = "Asia Pacific region infrastructure details"
  value = {
    region                = "ap-southeast-1"
    load_balancer_dns     = module.asia_region.load_balancer_dns_name
    database_endpoint     = module.asia_region.database_endpoint
    ecs_cluster_name      = module.asia_region.ecs_cluster_name
    ecs_service_name      = module.asia_region.ecs_service_name
    content_bucket_name   = module.asia_region.content_bucket_name
    health_check_id       = aws_route53_health_check.asia_region_health.id
  }
}

output "disaster_recovery_region" {
  description = "Disaster recovery region infrastructure details"
  value = {
    region                = var.backup_region
    load_balancer_dns     = module.disaster_recovery_region.load_balancer_dns_name
    database_endpoint     = module.disaster_recovery_region.database_endpoint
    ecs_cluster_name      = module.disaster_recovery_region.ecs_cluster_name
    ecs_service_name      = module.disaster_recovery_region.ecs_service_name
    content_bucket_name   = module.disaster_recovery_region.content_bucket_name
  }
}

# DNS and Global Routing
output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route53 name servers for DNS delegation"
  value       = aws_route53_zone.main.name_servers
}

output "global_domain" {
  description = "Global domain name with Route53 routing"
  value       = var.domain_name
}

# Health Check URLs
output "health_check_urls" {
  description = "Health check endpoints for monitoring"
  value = {
    primary_region = "https://${module.primary_region.load_balancer_dns_name}/api/health"
    europe_region  = "https://${module.europe_region.load_balancer_dns_name}/api/health"
    asia_region    = "https://${module.asia_region.load_balancer_dns_name}/api/health"
  }
}

# Disaster Recovery Information
output "disaster_recovery_orchestrator" {
  description = "Disaster recovery orchestrator details"
  value = {
    function_arn           = aws_lambda_function.disaster_recovery_orchestrator.arn
    function_name          = aws_lambda_function.disaster_recovery_orchestrator.function_name
    sns_topic_arn          = aws_sns_topic.disaster_recovery_alerts.arn
    multi_region_alarm_arn = aws_cloudwatch_metric_alarm.multi_region_health.arn
  }
}

# Cross-Region Replication
output "s3_replication_configuration" {
  description = "S3 cross-region replication details"
  value = {
    replication_role_arn = aws_iam_role.replication_role.arn
    source_bucket       = module.primary_region.content_bucket_name
    destination_buckets = [
      module.europe_region.content_bucket_name,
      module.asia_region.content_bucket_name,
      module.disaster_recovery_region.content_bucket_name
    ]
  }
}

# Monitoring and Dashboards
output "multi_region_dashboard_url" {
  description = "CloudWatch dashboard URL for multi-region monitoring"
  value       = "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${aws_cloudwatch_dashboard.multi_region_dashboard.dashboard_name}"
}

# RTO/RPO Targets
output "disaster_recovery_targets" {
  description = "Disaster recovery objectives and targets"
  value = {
    rto_target_minutes = var.rto_target_minutes
    rpo_target_minutes = var.rpo_target_minutes
    rto_target_seconds = local.rto_target_seconds
    rpo_target_seconds = local.rpo_target_seconds

    automatic_failover_enabled     = var.enable_automatic_failover
    failover_threshold_minutes     = var.failover_threshold_minutes
    cross_region_replication_enabled = var.enable_cross_region_replication
  }
}

# Regional Capacity Information
output "regional_capacity" {
  description = "Current capacity configuration by region"
  value = {
    primary_region = var.primary_region_capacity
    europe_region  = var.secondary_region_capacity
    asia_region    = var.secondary_region_capacity
    dr_region      = var.disaster_recovery_capacity
  }
}

# Traffic Distribution
output "traffic_distribution" {
  description = "Configured traffic distribution percentages"
  value       = var.traffic_distribution
}

# Failover Commands
output "disaster_recovery_commands" {
  description = "Commands for manual disaster recovery operations"
  value = {
    manual_failover = {
      command = "aws lambda invoke --function-name ${aws_lambda_function.disaster_recovery_orchestrator.function_name} --payload '{\"action\":\"failover\",\"confirmation_token\":\"CONFIRM_MANUAL_FAILOVER\"}' /tmp/response.json"
      description = "Trigger manual failover to disaster recovery region"
    }

    failback = {
      command = "aws lambda invoke --function-name ${aws_lambda_function.disaster_recovery_orchestrator.function_name} --payload '{\"action\":\"failback\"}' /tmp/response.json"
      description = "Failback to primary region after recovery"
    }

    dr_test = {
      command = "aws lambda invoke --function-name ${aws_lambda_function.disaster_recovery_orchestrator.function_name} --payload '{\"action\":\"test\"}' /tmp/response.json"
      description = "Run disaster recovery readiness test"
    }

    status_check = {
      command = "aws lambda invoke --function-name ${aws_lambda_function.disaster_recovery_orchestrator.function_name} --payload '{}' /tmp/response.json"
      description = "Check current disaster recovery status"
    }
  }
}

# Cost Optimization Information
output "regional_cost_optimization" {
  description = "Cost optimization features enabled by region"
  value = {
    secondary_regions_spot_enabled = var.enable_regional_cost_optimization
    spot_percentage = var.secondary_region_spot_percentage
    replication_storage_classes = {
      secondary_regions = var.replication_storage_class
      dr_region        = var.dr_storage_class
    }
  }
}

# Compliance and Data Residency
output "data_residency_configuration" {
  description = "Data residency and compliance configuration"
  value = {
    data_residency_requirements = var.data_residency_requirements
    gdpr_compliance_enabled     = var.enable_gdpr_compliance
    allowed_countries          = var.allowed_countries
  }
}

# Security Configuration
output "security_configuration" {
  description = "Security configuration across regions"
  value = {
    waf_per_region_enabled = var.enable_waf_per_region
    rate_limits_per_region = var.rate_limit_per_region
    cross_region_encryption_enabled = true
  }
}