# Enhanced Auto-Scaling Module for 1001 Stories
# Supports 50K concurrent users with intelligent scaling policies

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Application Auto Scaling Target
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${var.cluster_name}/${var.service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = var.tags
}

# CPU-based scaling policy (Scale Out)
resource "aws_appautoscaling_policy" "scale_out_cpu" {
  name               = "${var.name_prefix}-scale-out-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.cpu_target_value
    scale_out_cooldown = var.scale_out_cooldown
    scale_in_cooldown  = var.scale_in_cooldown
  }

  depends_on = [aws_appautoscaling_target.ecs_target]
}

# Memory-based scaling policy (Scale Out)
resource "aws_appautoscaling_policy" "scale_out_memory" {
  name               = "${var.name_prefix}-scale-out-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.memory_target_value
    scale_out_cooldown = var.scale_out_cooldown
    scale_in_cooldown  = var.scale_in_cooldown
  }

  depends_on = [aws_appautoscaling_target.ecs_target]
}

# Custom ALB Request Count scaling policy for burst traffic
resource "aws_appautoscaling_policy" "scale_out_requests" {
  name               = "${var.name_prefix}-scale-out-requests"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label        = var.alb_target_group_arn_suffix
    }
    target_value       = var.request_count_target_value
    scale_out_cooldown = 60  # Faster response to traffic spikes
    scale_in_cooldown  = 300 # Conservative scale-in for cost optimization
  }

  depends_on = [aws_appautoscaling_target.ecs_target]
}

# Step Scaling Policy for Emergency Scale-Out
resource "aws_appautoscaling_policy" "emergency_scale_out" {
  name               = "${var.name_prefix}-emergency-scale-out"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown               = 60
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 50
      scaling_adjustment          = 2
    }

    step_adjustment {
      metric_interval_lower_bound = 50
      scaling_adjustment          = 5
    }
  }

  depends_on = [aws_appautoscaling_target.ecs_target]
}

# CloudWatch Alarm for Emergency Scale-Out (High CPU)
resource "aws_cloudwatch_metric_alarm" "high_cpu_emergency" {
  alarm_name          = "${var.name_prefix}-high-cpu-emergency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "This metric monitors ecs cpu utilization for emergency scaling"
  alarm_actions       = [aws_appautoscaling_policy.emergency_scale_out.arn]

  dimensions = {
    ServiceName = var.service_name
    ClusterName = var.cluster_name
  }

  tags = var.tags
}

# Database Auto Scaling (Aurora Read Replicas)
resource "aws_appautoscaling_target" "aurora_read_replica_target" {
  count              = var.enable_aurora_autoscaling ? 1 : 0
  max_capacity       = var.aurora_max_capacity
  min_capacity       = var.aurora_min_capacity
  resource_id        = "cluster:${var.aurora_cluster_identifier}"
  scalable_dimension = "rds:cluster:ReadReplicaCount"
  service_namespace  = "rds"

  tags = var.tags
}

resource "aws_appautoscaling_policy" "aurora_scaling_policy" {
  count              = var.enable_aurora_autoscaling ? 1 : 0
  name               = "${var.name_prefix}-aurora-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.aurora_read_replica_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.aurora_read_replica_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.aurora_read_replica_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageCPUUtilization"
    }
    target_value       = var.aurora_cpu_target_value
    scale_out_cooldown = 300
    scale_in_cooldown  = 300
  }

  depends_on = [aws_appautoscaling_target.aurora_read_replica_target]
}

# S3 Intelligent Tiering Configuration for Cost Optimization
resource "aws_s3_bucket_intelligent_tiering_configuration" "content_bucket" {
  count  = var.enable_s3_intelligent_tiering ? 1 : 0
  bucket = var.s3_content_bucket_name
  name   = "EntireBucket"

  filter {
    prefix = ""
  }

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 125
  }

  optional_fields = ["BucketKeyStatus", "AccessPointArn"]
}

# CloudWatch Dashboard for Auto Scaling Metrics
resource "aws_cloudwatch_dashboard" "autoscaling_dashboard" {
  dashboard_name = "${var.name_prefix}-autoscaling-metrics"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.service_name, "ClusterName", var.cluster_name],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", var.service_name, "ClusterName", var.cluster_name],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.load_balancer_name],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.load_balancer_name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Service Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "ServiceDesiredCount", "ServiceName", var.service_name, "ClusterName", var.cluster_name],
            ["AWS/ECS", "ServiceRunningCount", "ServiceName", var.service_name, "ClusterName", var.cluster_name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Service Scaling"
        }
      }
    ]
  })

  tags = var.tags
}

# SNS Topic for Scaling Notifications
resource "aws_sns_topic" "scaling_notifications" {
  name = "${var.name_prefix}-scaling-notifications"
  tags = var.tags
}

resource "aws_sns_topic_subscription" "scaling_email_notifications" {
  count     = length(var.scaling_notification_emails)
  topic_arn = aws_sns_topic.scaling_notifications.arn
  protocol  = "email"
  endpoint  = var.scaling_notification_emails[count.index]
}

# CloudWatch Alarm for Scale-Out Events
resource "aws_cloudwatch_metric_alarm" "scale_out_notification" {
  alarm_name          = "${var.name_prefix}-scaling-activity"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ServiceDesiredCount"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.min_capacity + 1
  alarm_description   = "This alarm monitors ECS service scaling activity"
  alarm_actions       = [aws_sns_topic.scaling_notifications.arn]
  ok_actions          = [aws_sns_topic.scaling_notifications.arn]

  dimensions = {
    ServiceName = var.service_name
    ClusterName = var.cluster_name
  }

  tags = var.tags
}