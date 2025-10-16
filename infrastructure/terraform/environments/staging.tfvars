# Staging Environment Configuration for 1001 Stories S3 Infrastructure

# Environment Configuration
environment = "staging"
aws_region  = "us-east-1"
backup_region = "us-west-2"

# Domain Configuration
domain_name = "staging.1001stories.seedsofempowerment.org"
ssl_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/STAGING_CERTIFICATE_ID"

# Load Balancer (update with actual ALB name)
load_balancer_name = "1001-stories-staging-alb"

# Alert Configuration
critical_alert_emails = [
  "dev@seedsofempowerment.org"
]

warning_alert_emails = [
  "dev@seedsofempowerment.org"
]

cost_alert_emails = [
  "dev@seedsofempowerment.org"
]

# Budget Configuration
monthly_budget_limit = 200

# Database Configuration
database_backup_retention_days = 7
enable_database_deletion_protection = false

# Application Scaling
app_min_capacity = 1
app_max_capacity = 5
app_target_cpu_utilization = 70
app_target_memory_utilization = 80

# Monitoring Configuration
enable_enhanced_monitoring = false
log_retention_days = 30

# Cost Optimization
enable_spot_instances = true
enable_reserved_capacity = false

# Feature Flags
enable_xray_tracing = true
enable_waf = true
enable_cross_region_backup = false

# Global Configuration
allowed_countries = [] # Empty list means all countries allowed
rate_limit_per_ip = 1000

# Educational Platform Configuration
max_file_size_mb = 50
pdf_processing_timeout = 300
max_concurrent_readers = 100

# Database Configuration
db_parameter_group_family = "aurora-postgresql15"
db_engine_version = "15.4"
enable_performance_insights = false
performance_insights_retention_period = 7

# Redis Configuration
redis_node_type = "cache.t3.medium"
redis_num_cache_nodes = 2
redis_snapshot_retention_limit = 3

# CloudFront Configuration
cloudfront_price_class = "PriceClass_100"
cloudfront_default_ttl = 1800
cloudfront_max_ttl = 43200

# Additional Tags
additional_tags = {
  Project     = "1001-stories"
  Environment = "staging"
  Owner       = "seeds-of-empowerment"
  ManagedBy   = "terraform"
  CostCenter  = "education-platform-staging"
  Backup      = "optional"
  Monitoring  = "basic"
  Compliance  = "testing"
}