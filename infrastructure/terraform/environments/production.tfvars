# Production Environment Configuration for 1001 Stories S3 Infrastructure

# Environment Configuration
environment = "production"
aws_region  = "us-east-1"
backup_region = "us-west-2"

# Domain Configuration
domain_name = "1001stories.seedsofempowerment.org"
ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"

# Load Balancer (update with actual ALB name)
load_balancer_name = "1001-stories-production-alb"

# Alert Configuration
critical_alert_emails = [
  "admin@seedsofempowerment.org",
  "alerts@1001stories.org"
]

warning_alert_emails = [
  "dev@seedsofempowerment.org",
  "monitoring@1001stories.org"
]

cost_alert_emails = [
  "finance@seedsofempowerment.org",
  "admin@seedsofempowerment.org"
]

# Budget Configuration
monthly_budget_limit = 1000

# Database Configuration
database_backup_retention_days = 30
enable_database_deletion_protection = true

# Application Scaling
app_min_capacity = 3
app_max_capacity = 20
app_target_cpu_utilization = 70
app_target_memory_utilization = 80

# Monitoring Configuration
enable_enhanced_monitoring = true
log_retention_days = 90

# Cost Optimization
enable_spot_instances = false
enable_reserved_capacity = true

# Feature Flags
enable_xray_tracing = true
enable_waf = true
enable_cross_region_backup = true

# Global Configuration
allowed_countries = [] # Empty list means all countries allowed
rate_limit_per_ip = 5000

# Educational Platform Configuration
max_file_size_mb = 100
pdf_processing_timeout = 600
max_concurrent_readers = 500

# Database Configuration
db_parameter_group_family = "aurora-postgresql15"
db_engine_version = "15.4"
enable_performance_insights = true
performance_insights_retention_period = 7

# Redis Configuration
redis_node_type = "cache.r6g.large"
redis_num_cache_nodes = 3
redis_snapshot_retention_limit = 7

# CloudFront Configuration
cloudfront_price_class = "PriceClass_All"
cloudfront_default_ttl = 3600
cloudfront_max_ttl = 86400

# Additional Tags
additional_tags = {
  Project     = "1001-stories"
  Environment = "production"
  Owner       = "seeds-of-empowerment"
  ManagedBy   = "terraform"
  CostCenter  = "education-platform"
  Backup      = "required"
  Monitoring  = "enabled"
  Compliance  = "required"
}