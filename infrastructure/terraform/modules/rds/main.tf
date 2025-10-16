# RDS Module - Optimized for 1001 Stories Complex Schema
# Includes Aurora PostgreSQL with read replicas and performance optimization

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS cluster encryption"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# DB Parameter Group optimized for 1001 Stories workload
resource "aws_rds_cluster_parameter_group" "main" {
  family = "aurora-postgresql15"
  name   = "${var.name_prefix}-cluster-params"

  # Optimizations for complex queries and multi-role workflow
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,pg_hint_plan"
  }

  parameter {
    name  = "max_connections"
    value = "300"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory/2}"
  }

  parameter {
    name  = "work_mem"
    value = "32768"  # 32MB for complex queries
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "524288"  # 512MB for index operations
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1"  # SSD optimization
  }

  parameter {
    name  = "effective_io_concurrency"
    value = "200"  # SSD optimization
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "16384"  # 16MB
  }

  parameter {
    name  = "default_statistics_target"
    value = "100"
  }

  # Enable query performance tracking
  parameter {
    name  = "track_activity"
    value = "1"
  }

  parameter {
    name  = "track_counts"
    value = "1"
  }

  parameter {
    name  = "track_io_timing"
    value = "1"
  }

  parameter {
    name  = "track_functions"
    value = "all"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries taking more than 1 second
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "log_checkpoints"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  # Auto vacuum settings for high write workload
  parameter {
    name  = "autovacuum"
    value = "1"
  }

  parameter {
    name  = "autovacuum_max_workers"
    value = "3"
  }

  parameter {
    name  = "autovacuum_naptime"
    value = "30"  # 30 seconds
  }

  parameter {
    name  = "autovacuum_vacuum_scale_factor"
    value = "0.1"
  }

  parameter {
    name  = "autovacuum_analyze_scale_factor"
    value = "0.05"
  }

  tags = var.tags
}

# DB Instance Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "aurora-postgresql15"
  name   = "${var.name_prefix}-instance-params"

  parameter {
    name  = "log_rotation_age"
    value = "1440"  # 24 hours
  }

  parameter {
    name  = "log_rotation_size"
    value = "102400"  # 100MB
  }

  tags = var.tags
}

# Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.name_prefix}-cluster"
  engine             = "aurora-postgresql"
  engine_version     = "15.4"
  database_name      = "stories_db"
  master_username    = "stories_admin"
  master_password    = var.master_password

  # Network and Security
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids

  # Backup Configuration
  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "Sun:04:00-Sun:05:00"
  copy_tags_to_snapshot       = true

  # Encryption
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn

  # Performance and Monitoring
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # High Availability
  deletion_protection = var.deletion_protection
  skip_final_snapshot = !var.deletion_protection

  final_snapshot_identifier = var.deletion_protection ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Point-in-time recovery
  backup_retention_period = var.backup_retention_period

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-cluster"
  })

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
    ]
  }
}

# Primary Instance (Writer)
resource "aws_rds_cluster_instance" "primary" {
  identifier                = "${var.name_prefix}-primary"
  cluster_identifier        = aws_rds_cluster.main.id
  instance_class           = var.instance_class
  engine                   = aws_rds_cluster.main.engine
  engine_version           = aws_rds_cluster.main.engine_version
  db_parameter_group_name  = aws_db_parameter_group.main.name

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  performance_insights_retention_period = 7

  # Enhanced Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Backup
  auto_minor_version_upgrade = false

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-primary"
    Role = "writer"
  })
}

# Read Replica 1 (for dashboard queries)
resource "aws_rds_cluster_instance" "replica_1" {
  identifier                = "${var.name_prefix}-replica-1"
  cluster_identifier        = aws_rds_cluster.main.id
  instance_class           = var.replica_instance_class
  engine                   = aws_rds_cluster.main.engine
  engine_version           = aws_rds_cluster.main.engine_version
  db_parameter_group_name  = aws_db_parameter_group.main.name

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  performance_insights_retention_period = 7

  # Enhanced Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Backup
  auto_minor_version_upgrade = false

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-replica-1"
    Role = "reader"
    Purpose = "dashboard-queries"
  })
}

# Read Replica 2 (for analytics and reporting)
resource "aws_rds_cluster_instance" "replica_2" {
  identifier                = "${var.name_prefix}-replica-2"
  cluster_identifier        = aws_rds_cluster.main.id
  instance_class           = var.replica_instance_class
  engine                   = aws_rds_cluster.main.engine
  engine_version           = aws_rds_cluster.main.engine_version
  db_parameter_group_name  = aws_db_parameter_group.main.name

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  performance_insights_retention_period = 7

  # Enhanced Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Backup
  auto_minor_version_upgrade = false

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-replica-2"
    Role = "reader"
    Purpose = "analytics-reporting"
  })
}

# Read Replica 3 (for public library access - conditional on environment)
resource "aws_rds_cluster_instance" "replica_3" {
  count = var.environment == "production" ? 1 : 0

  identifier                = "${var.name_prefix}-replica-3"
  cluster_identifier        = aws_rds_cluster.main.id
  instance_class           = var.replica_instance_class
  engine                   = aws_rds_cluster.main.engine
  engine_version           = aws_rds_cluster.main.engine_version
  db_parameter_group_name  = aws_db_parameter_group.main.name

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  performance_insights_retention_period = 7

  # Enhanced Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Backup
  auto_minor_version_upgrade = false

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-replica-3"
    Role = "reader"
    Purpose = "public-library"
  })
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.name_prefix}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS Proxy for connection pooling
resource "aws_db_proxy" "main" {
  name                   = "${var.name_prefix}-proxy"
  engine_family         = "POSTGRESQL"
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_secretsmanager_secret.db_credentials.arn
  }

  role_arn               = aws_iam_role.proxy.arn
  vpc_subnet_ids         = var.private_subnet_ids
  vpc_security_group_ids = var.security_group_ids

  target {
    db_cluster_identifier = aws_rds_cluster.main.cluster_identifier
  }

  # Connection pooling settings optimized for Next.js serverless
  idle_client_timeout    = 1800  # 30 minutes
  max_connections_percent = 100
  max_idle_connections_percent = 50

  require_tls = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-proxy"
  })
}

# IAM Role for RDS Proxy
resource "aws_iam_role" "proxy" {
  name = "${var.name_prefix}-rds-proxy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "proxy" {
  name = "${var.name_prefix}-rds-proxy-policy"
  role = aws_iam_role.proxy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      }
    ]
  })
}

# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.name_prefix}/rds/credentials"
  description             = "Database credentials for 1001 Stories"
  recovery_window_in_days = 0  # Allow immediate deletion in non-prod

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = aws_rds_cluster.main.master_username
    password = var.master_password
  })
}

# CloudWatch Log Group for PostgreSQL logs
resource "aws_cloudwatch_log_group" "postgresql" {
  name              = "/aws/rds/cluster/${aws_rds_cluster.main.cluster_identifier}/postgresql"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# Database initialization script
resource "aws_ssm_document" "db_init" {
  name          = "${var.name_prefix}-db-initialization"
  document_type = "Command"
  document_format = "YAML"

  content = <<DOC
schemaVersion: '2.2'
description: Initialize 1001 Stories database with optimized indexes
mainSteps:
- action: aws:runShellScript
  name: initializeDatabase
  inputs:
    runCommand:
    - |
      # Connect to database and create optimized indexes
      export PGPASSWORD="${var.master_password}"

      # Create indexes for frequently queried tables
      psql -h ${aws_rds_cluster.main.endpoint} -U ${aws_rds_cluster.main.master_username} -d stories_db -c "
      -- User management indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_school ON users(school_id);

      -- Publishing workflow indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_volunteer_submissions_status ON volunteer_submissions(status);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_volunteer_submissions_reviewer ON volunteer_submissions(reviewer_id);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_volunteer_submissions_workflow ON volunteer_submissions(status, priority, created_at);

      -- Reading progress indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_progress_user_story ON reading_progress(user_id, story_id);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_progress_last_read ON reading_progress(last_read_at DESC);

      -- Book and content indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_published ON books(is_published, created_at);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_language ON books(language, is_published);

      -- Entitlement indexes for access control
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_entitlements ON entitlements(user_id, book_id) WHERE is_active = true;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entitlements_expiry ON entitlements(expires_at) WHERE expires_at IS NOT NULL;

      -- Review system indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_reviews_pending ON submission_reviews(status, created_at) WHERE status = 'PENDING';
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_reviews_reviewer ON submission_reviews(reviewer_id, status);

      -- Class and education indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id, status);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_class_enrollments_class ON class_enrollments(class_id, status);

      -- Notification indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

      -- Activity log indexes for analytics
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity, entity_id);

      -- Create pg_stat_statements extension for query analysis
      CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

      -- Create additional useful extensions
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS uuid-ossp;
      "
DOC

  tags = var.tags
}