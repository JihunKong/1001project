# 1001 Stories - Main Terraform Configuration
# Scalable infrastructure for global education platform

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  backend "s3" {
    bucket         = "1001-stories-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "1001-stories"
      Environment = var.environment
      ManagedBy   = "terraform"
      CostCenter  = "education-platform"
    }
  }
}

# Secondary region for disaster recovery
provider "aws" {
  alias  = "backup_region"
  region = var.backup_region

  default_tags {
    tags = {
      Project     = "1001-stories"
      Environment = var.environment
      ManagedBy   = "terraform"
      CostCenter  = "education-platform"
      Purpose     = "disaster-recovery"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Random string for unique resource naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Random passwords for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "nextauth_secret" {
  length  = 64
  special = true
}

# Local values for common configurations
locals {
  name_prefix = "1001-stories"

  common_tags = {
    Project     = "1001-stories"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Database configuration
  db_config = {
    instance_class          = var.environment == "production" ? "db.r6g.large" : "db.t3.medium"
    backup_retention_period = var.environment == "production" ? 30 : 7
    multi_az               = var.environment == "production" ? true : false
    deletion_protection    = var.environment == "production" ? true : false
  }

  # Application configuration
  app_config = {
    cpu    = var.environment == "production" ? 1024 : 512
    memory = var.environment == "production" ? 2048 : 1024
    count  = var.environment == "production" ? 3 : 2
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  cidr_block        = var.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)

  tags = local.common_tags
}

# Security Groups
module "security_groups" {
  source = "./modules/security"

  vpc_id      = module.vpc.vpc_id
  name_prefix = local.name_prefix

  tags = local.common_tags
}

# Database
module "database" {
  source = "./modules/rds"

  name_prefix                = local.name_prefix
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  security_group_ids        = [module.security_groups.rds_security_group_id]

  instance_class            = local.db_config.instance_class
  backup_retention_period   = local.db_config.backup_retention_period
  multi_az                  = local.db_config.multi_az
  deletion_protection       = local.db_config.deletion_protection

  master_password = random_password.db_password.result

  tags = local.common_tags
}

# ElastiCache Redis
module "redis" {
  source = "./modules/elasticache"

  name_prefix        = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.redis_security_group_id]

  node_type     = var.environment == "production" ? "cache.t3.medium" : "cache.t3.micro"
  num_cache_nodes = var.environment == "production" ? 3 : 2

  tags = local.common_tags
}

# S3 Publishing System
module "s3_publishing" {
  source = "./modules/s3-publishing"

  name_prefix                     = local.name_prefix
  environment                     = var.environment
  enable_versioning              = true
  enable_cross_region_replication = var.enable_cross_region_backup
  backup_region                  = var.backup_region

  tags = local.common_tags

  providers = {
    aws.backup_region = aws.backup_region
  }
}

# IAM for Publishing System
module "iam_publishing" {
  source = "./modules/iam-publishing"

  name_prefix        = local.name_prefix
  environment        = var.environment
  content_bucket_arn = module.s3_publishing.content_bucket_arn
  backup_bucket_arn  = module.s3_publishing.backup_bucket_arn
  temp_bucket_arn    = module.s3_publishing.temp_uploads_bucket_arn
  kms_key_arn        = module.s3_publishing.kms_key_arn

  tags = local.common_tags
}

# CloudFront CDN
module "cloudfront_cdn" {
  source = "./modules/cloudfront-cdn"

  name_prefix                   = local.name_prefix
  environment                   = var.environment
  s3_bucket_name               = module.s3_publishing.content_bucket_id
  s3_bucket_domain_name        = module.s3_publishing.content_bucket_domain_name
  origin_access_identity_path  = module.s3_publishing.cloudfront_oai_s3_canonical_user_id

  # Domain configuration
  domain_aliases       = var.domain_name != "" ? [var.domain_name] : []
  ssl_certificate_arn = var.ssl_certificate_arn

  # Educational platform configuration
  allowed_origins = ["https://${var.domain_name}"]
  enable_edge_auth = false # Can be enabled for additional security

  tags = local.common_tags
}

# Monitoring and Alerting
module "monitoring" {
  source = "./modules/monitoring-alerts"

  name_prefix                   = local.name_prefix
  environment                   = var.environment
  s3_bucket_name               = module.s3_publishing.content_bucket_id
  cloudfront_distribution_id   = module.cloudfront_cdn.distribution_id
  application_log_group        = "/aws/ecs/${local.name_prefix}"
  load_balancer_name           = var.load_balancer_name

  # Alert configuration
  critical_alert_emails = var.critical_alert_emails
  warning_alert_emails  = var.warning_alert_emails
  cost_alert_emails     = var.cost_alert_emails
  monthly_budget_limit  = var.monthly_budget_limit

  tags = local.common_tags
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"

  name_prefix           = local.name_prefix
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  public_subnet_ids    = module.vpc.public_subnet_ids
  security_group_ids   = [module.security_groups.app_security_group_id]

  # Application configuration
  cpu          = local.app_config.cpu
  memory       = local.app_config.memory
  desired_count = local.app_config.count

  # Environment variables
  environment_variables = {
    NODE_ENV                = var.environment
    DATABASE_URL           = module.database.connection_string
    REDIS_URL              = module.redis.primary_endpoint
    NEXTAUTH_URL           = "https://${var.domain_name}"
    NEXTAUTH_SECRET        = random_password.nextauth_secret.result
    AWS_REGION             = var.aws_region
    CLOUDFRONT_DOMAIN      = module.cdn.cloudfront_domain
    S3_BUCKET_NAME         = module.cdn.s3_bucket_name
  }

  # Secrets from AWS Secrets Manager
  secrets = {
    OPENAI_API_KEY  = var.openai_api_key_secret_arn
    SMTP_PASSWORD   = var.smtp_password_secret_arn
  }

  tags = local.common_tags
}

# Monitoring and Alerting
module "monitoring" {
  source = "./modules/monitoring"

  name_prefix    = local.name_prefix
  cluster_name   = module.ecs.cluster_name
  service_name   = module.ecs.service_name
  database_id    = module.database.cluster_identifier

  # Alert notification email
  alert_email = var.alert_email

  tags = local.common_tags
}

# Backup and Disaster Recovery
module "backup" {
  source = "./modules/backup"

  name_prefix           = local.name_prefix
  database_arn         = module.database.cluster_arn
  s3_bucket_arn        = module.cdn.s3_bucket_arn

  # Cross-region backup configuration
  backup_region = var.backup_region

  tags = local.common_tags
}

# WAF for security
module "waf" {
  source = "./modules/waf"

  name_prefix        = local.name_prefix
  cloudfront_arn     = module.cdn.cloudfront_arn

  # Rate limiting configuration
  rate_limit = var.environment == "production" ? 2000 : 1000

  tags = local.common_tags
}

# Auto Scaling
module "autoscaling" {
  source = "./modules/autoscaling"

  cluster_name        = module.ecs.cluster_name
  service_name        = module.ecs.service_name

  min_capacity = var.environment == "production" ? 2 : 1
  max_capacity = var.environment == "production" ? 10 : 4

  tags = local.common_tags
}