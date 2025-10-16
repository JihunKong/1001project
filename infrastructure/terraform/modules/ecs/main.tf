# ECS Module - Horizontal Scaling for 1001 Stories
# Optimized for multi-role workflow system and real-time features

# ECS Cluster with Container Insights
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  configuration {
    execute_command_configuration {
      kms_key_id = aws_kms_key.ecs.arn
      logging    = "OVERRIDE"

      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-cluster"
  })
}

# KMS Key for ECS encryption
resource "aws_kms_key" "ecs" {
  description             = "KMS key for ECS cluster encryption"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecs-kms-key"
  })
}

resource "aws_kms_alias" "ecs" {
  name          = "alias/${var.name_prefix}-ecs"
  target_key_id = aws_kms_key.ecs.key_id
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.name_prefix}-app"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/aws/ecs/exec/${var.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "production"

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb"
  })
}

# S3 Bucket for ALB Access Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "${var.name_prefix}-alb-logs-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb-logs"
  })
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "log_lifecycle"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowALBLogs"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

data "aws_elb_service_account" "main" {}
data "aws_caller_identity" "current" {}

# Target Groups for Blue-Green Deployment
resource "aws_lb_target_group" "app_blue" {
  name        = "${var.name_prefix}-app-blue"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  # Sticky sessions for auto-save functionality
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400  # 24 hours
    enabled         = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-blue-tg"
    Slot = "blue"
  })
}

resource "aws_lb_target_group" "app_green" {
  name        = "${var.name_prefix}-app-green"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  # Sticky sessions for auto-save functionality
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400  # 24 hours
    enabled         = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-green-tg"
    Slot = "green"
  })
}

# ALB Listeners
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = var.tags
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.ssl_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_blue.arn
  }

  tags = var.tags
}

# Listener Rules for Role-Based Routing
resource "aws_lb_listener_rule" "admin_priority" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_blue.arn
  }

  condition {
    path_pattern {
      values = ["/admin*", "/dashboard/admin*"]
    }
  }

  tags = merge(var.tags, {
    Purpose = "admin-routing"
  })
}

resource "aws_lb_listener_rule" "api_priority" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_blue.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  # Custom headers for API requests
  condition {
    http_header {
      http_header_name = "Content-Type"
      values          = ["application/json", "multipart/form-data"]
    }
  }

  tags = merge(var.tags, {
    Purpose = "api-routing"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.name_prefix}-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "app"
      image = "${var.ecr_repository_url}:latest"

      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      # Environment variables
      environment = [
        for key, value in var.environment_variables : {
          name  = key
          value = tostring(value)
        }
      ]

      # Secrets from AWS Secrets Manager
      secrets = [
        for key, value in var.secrets : {
          name      = key
          valueFrom = value
        }
      ]

      # Logging configuration with JSON format for better parsing
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
          awslogs-datetime-format = "%Y-%m-%d %H:%M:%S"
        }
      }

      # Health check for container
      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:3000/api/health || exit 1"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      # Resource limits for optimal performance
      memoryReservation = var.memory / 2

      # Mount points for persistent storage
      mountPoints = []

      # Volume configuration for session storage
      volumesFrom = []

      # Linux parameters for performance tuning
      linuxParameters = {
        capabilities = {
          add = []
          drop = [
            "ALL"
          ]
        }
        devices               = []
        initProcessEnabled    = true
        maxSwap              = 0
        sharedMemorySize     = 64
        swappiness           = 0
        tmpfs                = []
      }

      # Security settings
      privileged               = false
      readonlyRootFilesystem  = false
      user                    = "node"

      # Stop timeout for graceful shutdown
      stopTimeout = 30

      # Start timeout
      startTimeout = 120

      # Disable interactive mode
      interactive = false
      pseudoTerminal = false
    }
  ])

  # Volume configuration for shared data
  dynamic "volume" {
    for_each = var.enable_efs_storage ? [1] : []
    content {
      name = "efs-storage"

      efs_volume_configuration {
        file_system_id          = var.efs_file_system_id
        root_directory          = "/"
        transit_encryption      = "ENABLED"
        transit_encryption_port = 2049
        authorization_config {
          access_point_id = var.efs_access_point_id
          iam             = "ENABLED"
        }
      }
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-task-definition"
  })
}

data "aws_region" "current" {}

# ECS Service - Blue Slot
resource "aws_ecs_service" "app_blue" {
  name            = "${var.name_prefix}-app-blue"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.blue_green_deployment ? 0 : var.desired_count
  launch_type     = "FARGATE"
  platform_version = "1.4.0"

  # Deployment configuration for zero downtime
  deployment_configuration {
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  # Network configuration
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false
  }

  # Load balancer configuration
  load_balancer {
    target_group_arn = aws_lb_target_group.app_blue.arn
    container_name   = "app"
    container_port   = 3000
  }

  # Service discovery for internal communication
  dynamic "service_registries" {
    for_each = var.enable_service_discovery ? [1] : []
    content {
      registry_arn = aws_service_discovery_service.app[0].arn
    }
  }

  # Auto scaling integration
  lifecycle {
    ignore_changes = [desired_count]
  }

  # Enable execute command for debugging
  enable_execute_command = true

  # Health check grace period
  health_check_grace_period_seconds = 300

  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy_attachment.ecs_execution,
    aws_iam_role_policy_attachment.ecs_task
  ]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-blue"
    Slot = "blue"
  })
}

# ECS Service - Green Slot
resource "aws_ecs_service" "app_green" {
  name            = "${var.name_prefix}-app-green"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.blue_green_deployment ? var.desired_count : 0
  launch_type     = "FARGATE"
  platform_version = "1.4.0"

  # Deployment configuration for zero downtime
  deployment_configuration {
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  # Network configuration
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false
  }

  # Load balancer configuration
  load_balancer {
    target_group_arn = aws_lb_target_group.app_green.arn
    container_name   = "app"
    container_port   = 3000
  }

  # Service discovery for internal communication
  dynamic "service_registries" {
    for_each = var.enable_service_discovery ? [1] : []
    content {
      registry_arn = aws_service_discovery_service.app[0].arn
    }
  }

  # Auto scaling integration
  lifecycle {
    ignore_changes = [desired_count]
  }

  # Enable execute command for debugging
  enable_execute_command = true

  # Health check grace period
  health_check_grace_period_seconds = 300

  depends_on = [
    aws_lb_listener.https,
    aws_iam_role_policy_attachment.ecs_execution,
    aws_iam_role_policy_attachment.ecs_task
  ]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-app-green"
    Slot = "green"
  })
}

# Service Discovery (optional)
resource "aws_service_discovery_private_dns_namespace" "main" {
  count = var.enable_service_discovery ? 1 : 0

  name        = "${var.name_prefix}.local"
  description = "Service discovery namespace for 1001 Stories"
  vpc         = var.vpc_id

  tags = var.tags
}

resource "aws_service_discovery_service" "app" {
  count = var.enable_service_discovery ? 1 : 0

  name = "app"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main[0].id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_grace_period_seconds = 300

  tags = var.tags
}

# IAM Roles for ECS

# ECS Execution Role
resource "aws_iam_role" "ecs_execution" {
  name = "${var.name_prefix}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional permissions for Secrets Manager and KMS
resource "aws_iam_role_policy" "ecs_execution_additional" {
  name = "${var.name_prefix}-ecs-execution-additional"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = values(var.secrets)
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.ecs.arn,
          "arn:aws:kms:*:*:key/*"
        ]
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.name_prefix}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Task role permissions for application functionality
resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.name_prefix}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.app.arn}:*"
      }
    ]
  })
}

# EFS support for shared storage (optional)
resource "aws_iam_role_policy" "ecs_efs" {
  count = var.enable_efs_storage ? 1 : 0

  name = "${var.name_prefix}-ecs-efs-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticfilesystem:AccessedViaMountTarget",
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
          "elasticfilesystem:ClientRootAccess",
          "elasticfilesystem:DescribeMountTargets",
          "elasticfilesystem:DescribeFileSystems"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Dashboard for ECS monitoring
resource "aws_cloudwatch_dashboard" "ecs" {
  dashboard_name = "${var.name_prefix}-ecs-dashboard"

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
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.app_blue.name, "ClusterName", aws_ecs_cluster.main.name],
            [".", "MemoryUtilization", ".", ".", ".", "."],
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.app_green.name, "ClusterName", aws_ecs_cluster.main.name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ECS Service CPU and Memory Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "RequestCount", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Application Load Balancer Metrics"
          period  = 300
        }
      }
    ]
  })
}