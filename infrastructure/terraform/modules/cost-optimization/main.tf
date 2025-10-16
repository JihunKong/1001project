# Cost Optimization Module for 1001 Stories
# Targets: $120K-216K annual infrastructure costs scaling to $660K by year 3

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources for cost optimization
data "aws_ec2_instance_type_offerings" "available" {
  filter {
    name   = "instance-type"
    values = var.spot_instance_types
  }
  location_type = "availability-zone"
}

# Spot Fleet for development and non-critical workloads
resource "aws_spot_fleet_request" "dev_workloads" {
  count                      = var.enable_spot_instances ? 1 : 0
  iam_fleet_role            = aws_iam_role.spot_fleet_role[0].arn
  allocation_strategy       = "lowest-price"
  target_capacity          = var.spot_target_capacity
  spot_price               = var.max_spot_price
  valid_until              = timeadd(timestamp(), "${var.spot_fleet_duration}h")
  terminate_instances_with_expiration = true
  type                     = "maintain"

  launch_specification {
    image_id             = var.ami_id
    instance_type        = var.spot_instance_types[0]
    key_name             = var.key_name
    security_groups      = var.security_group_ids
    subnet_id            = var.private_subnet_ids[0]
    availability_zone    = data.aws_availability_zones.available.names[0]

    user_data = base64encode(templatefile("${path.module}/templates/spot-userdata.sh", {
      cluster_name = var.cluster_name
    }))

    tags = merge(var.tags, {
      Name = "${var.name_prefix}-spot-instance"
      Type = "spot"
    })
  }

  launch_specification {
    image_id             = var.ami_id
    instance_type        = var.spot_instance_types[1]
    key_name             = var.key_name
    security_groups      = var.security_group_ids
    subnet_id            = var.private_subnet_ids[1]
    availability_zone    = data.aws_availability_zones.available.names[1]

    user_data = base64encode(templatefile("${path.module}/templates/spot-userdata.sh", {
      cluster_name = var.cluster_name
    }))

    tags = merge(var.tags, {
      Name = "${var.name_prefix}-spot-instance"
      Type = "spot"
    })
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-spot-fleet"
  })
}

# IAM Role for Spot Fleet
resource "aws_iam_role" "spot_fleet_role" {
  count = var.enable_spot_instances ? 1 : 0
  name  = "${var.name_prefix}-spot-fleet-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "spotfleet.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "spot_fleet_policy" {
  count      = var.enable_spot_instances ? 1 : 0
  role       = aws_iam_role.spot_fleet_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2SpotFleetTaggingRole"
}

# RDS Reserved Instance recommendations tracking
resource "aws_cloudwatch_metric_alarm" "rds_reserved_instance_recommendation" {
  count               = var.enable_reserved_instances ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-reserved-instance-opportunity"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "7"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "86400"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "RDS usage indicates opportunity for Reserved Instance purchase"
  alarm_actions       = [aws_sns_topic.cost_optimization_alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.rds_cluster_identifier
  }

  tags = var.tags
}

# ECS Capacity Providers for cost optimization
resource "aws_ecs_capacity_provider" "fargate_spot" {
  count = var.enable_fargate_spot ? 1 : 0
  name  = "${var.name_prefix}-fargate-spot"

  fargate_capacity_provider {
    default_capacity_provider_strategy {
      weight = var.fargate_spot_weight
    }
  }

  tags = var.tags
}

# S3 Lifecycle Management for content archival
resource "aws_s3_bucket_lifecycle_configuration" "content_lifecycle" {
  count  = var.enable_s3_lifecycle ? 1 : 0
  bucket = var.content_bucket_id

  rule {
    id     = "content_lifecycle_rule"
    status = "Enabled"

    filter {
      prefix = "content/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 60
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 2555  # 7 years retention
    }
  }

  rule {
    id     = "temp_uploads_cleanup"
    status = "Enabled"

    filter {
      prefix = "temp/"
    }

    expiration {
      days = 7
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }

  rule {
    id     = "logs_lifecycle"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555  # 7 years retention for audit logs
    }
  }

  depends_on = [var.content_bucket_versioning]
}

# CloudWatch Log Group retention policies
resource "aws_cloudwatch_log_group" "cost_optimized_logs" {
  for_each = var.log_group_configs

  name              = each.key
  retention_in_days = each.value.retention_days
  kms_key_id        = var.cloudwatch_logs_kms_key_arn

  tags = merge(var.tags, {
    LogType = each.value.log_type
  })
}

# Cost Budget with alerts
resource "aws_budgets_budget" "monthly_cost_budget" {
  count        = var.enable_cost_budgets ? 1 : 0
  name         = "${var.name_prefix}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  time_period_start = formatdate("YYYY-MM-01_00:00", timestamp())
  time_period_end   = "2030-12-31_23:59"

  cost_filters = {
    Service = [
      "Amazon Elastic Compute Cloud - Compute",
      "Amazon Relational Database Service",
      "Amazon Simple Storage Service",
      "Amazon CloudFront",
      "Amazon ElastiCache"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = var.cost_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.cost_alert_emails
  }

  tags = var.tags
}

# Reserved Instance Purchase Recommendations
resource "aws_cost_anomaly_detector" "ri_recommendations" {
  count         = var.enable_cost_anomaly_detection ? 1 : 0
  name          = "${var.name_prefix}-ri-recommendations"
  monitor_type  = "DIMENSIONAL"

  specification = jsonencode({
    Dimension = "SERVICE"
    MatchOptions = ["EQUALS"]
    Values = [
      "Amazon Elastic Compute Cloud - Compute",
      "Amazon Relational Database Service"
    ]
  })

  tags = var.tags
}

resource "aws_cost_anomaly_subscription" "ri_notifications" {
  count     = var.enable_cost_anomaly_detection ? 1 : 0
  name      = "${var.name_prefix}-ri-notifications"
  frequency = "WEEKLY"

  monitor_arn_list = [
    aws_cost_anomaly_detector.ri_recommendations[0].arn
  ]

  subscriber {
    type    = "EMAIL"
    address = var.cost_optimization_emails[0]
  }

  threshold_expression {
    and {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
        values        = ["100"]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
  }

  tags = var.tags
}

# SNS Topic for cost optimization alerts
resource "aws_sns_topic" "cost_optimization_alerts" {
  name = "${var.name_prefix}-cost-optimization"
  tags = var.tags
}

resource "aws_sns_topic_subscription" "cost_email_notifications" {
  count     = length(var.cost_optimization_emails)
  topic_arn = aws_sns_topic.cost_optimization_alerts.arn
  protocol  = "email"
  endpoint  = var.cost_optimization_emails[count.index]
}

# CloudWatch Dashboard for cost monitoring
resource "aws_cloudwatch_dashboard" "cost_optimization_dashboard" {
  dashboard_name = "${var.name_prefix}-cost-optimization"

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
            ["AWS/Billing", "EstimatedCharges", "Currency", "USD"],
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.service_name, "ClusterName", var.cluster_name],
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", var.rds_cluster_identifier]
          ]
          period = 86400
          stat   = "Average"
          region = "us-east-1"  # Billing metrics only in us-east-1
          title  = "Cost and Resource Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
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
            ["AWS/S3", "BucketSizeBytes", "BucketName", var.content_bucket_id, "StorageType", "StandardStorage"],
            ["AWS/S3", "BucketSizeBytes", "BucketName", var.content_bucket_id, "StorageType", "StandardIAStorage"],
            ["AWS/S3", "BucketSizeBytes", "BucketName", var.content_bucket_id, "StorageType", "GlacierStorage"]
          ]
          period = 86400
          stat   = "Average"
          region = var.aws_region
          title  = "S3 Storage Cost Optimization"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          query = "SOURCE '/aws/cost/explorer'\n| fields @timestamp, @message\n| filter @message like /Reserved Instance/\n| sort @timestamp desc\n| limit 20"
          region = var.aws_region
          title  = "Reserved Instance Opportunities"
        }
      }
    ]
  })

  tags = var.tags
}

# Lambda function for cost optimization recommendations
resource "aws_lambda_function" "cost_optimizer" {
  count            = var.enable_cost_optimizer_lambda ? 1 : 0
  filename         = data.archive_file.cost_optimizer_zip[0].output_path
  function_name    = "${var.name_prefix}-cost-optimizer"
  role            = aws_iam_role.cost_optimizer_role[0].arn
  handler         = "index.handler"
  runtime         = "python3.11"
  timeout         = 300
  source_code_hash = data.archive_file.cost_optimizer_zip[0].output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN    = aws_sns_topic.cost_optimization_alerts.arn
      ENVIRONMENT      = var.environment
      COST_THRESHOLD   = var.cost_anomaly_threshold
    }
  }

  tags = var.tags
}

data "archive_file" "cost_optimizer_zip" {
  count       = var.enable_cost_optimizer_lambda ? 1 : 0
  type        = "zip"
  output_path = "/tmp/cost_optimizer.zip"

  source {
    content = templatefile("${path.module}/templates/cost_optimizer.py", {
      sns_topic_arn = aws_sns_topic.cost_optimization_alerts.arn
    })
    filename = "index.py"
  }
}

resource "aws_iam_role" "cost_optimizer_role" {
  count = var.enable_cost_optimizer_lambda ? 1 : 0
  name  = "${var.name_prefix}-cost-optimizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cost_optimizer_policy" {
  count = var.enable_cost_optimizer_lambda ? 1 : 0
  name  = "${var.name_prefix}-cost-optimizer-policy"
  role  = aws_iam_role.cost_optimizer_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ce:GetCostAndUsage",
          "ce:GetRightsizingRecommendation",
          "ce:GetReservationPurchaseRecommendation",
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}

# EventBridge rule to trigger cost optimization weekly
resource "aws_cloudwatch_event_rule" "cost_optimization_schedule" {
  count               = var.enable_cost_optimizer_lambda ? 1 : 0
  name                = "${var.name_prefix}-cost-optimization-schedule"
  description         = "Trigger cost optimization analysis weekly"
  schedule_expression = "rate(7 days)"

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "cost_optimizer_target" {
  count     = var.enable_cost_optimizer_lambda ? 1 : 0
  rule      = aws_cloudwatch_event_rule.cost_optimization_schedule[0].name
  target_id = "CostOptimizerTarget"
  arn       = aws_lambda_function.cost_optimizer[0].arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count         = var.enable_cost_optimizer_lambda ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_optimizer[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cost_optimization_schedule[0].arn
}