# Outputs for S3 Publishing Module

# S3 Bucket Information
output "content_bucket_id" {
  description = "ID of the main content bucket"
  value       = aws_s3_bucket.content.id
}

output "content_bucket_arn" {
  description = "ARN of the main content bucket"
  value       = aws_s3_bucket.content.arn
}

output "content_bucket_domain_name" {
  description = "Domain name of the content bucket"
  value       = aws_s3_bucket.content.bucket_domain_name
}

output "content_bucket_regional_domain_name" {
  description = "Regional domain name of the content bucket"
  value       = aws_s3_bucket.content.bucket_regional_domain_name
}

output "backup_bucket_id" {
  description = "ID of the backup bucket"
  value       = var.enable_cross_region_replication ? aws_s3_bucket.backup[0].id : null
}

output "backup_bucket_arn" {
  description = "ARN of the backup bucket"
  value       = var.enable_cross_region_replication ? aws_s3_bucket.backup[0].arn : null
}

output "logs_bucket_id" {
  description = "ID of the access logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "ARN of the access logs bucket"
  value       = aws_s3_bucket.logs.arn
}

output "temp_uploads_bucket_id" {
  description = "ID of the temporary uploads bucket"
  value       = aws_s3_bucket.temp_uploads.id
}

output "temp_uploads_bucket_arn" {
  description = "ARN of the temporary uploads bucket"
  value       = aws_s3_bucket.temp_uploads.arn
}

# KMS Information
output "kms_key_id" {
  description = "ID of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_encryption.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_encryption.arn
}

output "kms_alias_name" {
  description = "Name of the KMS key alias"
  value       = aws_kms_alias.s3_encryption.name
}

# CloudFront Information
output "cloudfront_oai_id" {
  description = "CloudFront Origin Access Identity ID"
  value       = aws_cloudfront_origin_access_identity.content.id
}

output "cloudfront_oai_iam_arn" {
  description = "CloudFront Origin Access Identity IAM ARN"
  value       = aws_cloudfront_origin_access_identity.content.iam_arn
}

output "cloudfront_oai_s3_canonical_user_id" {
  description = "CloudFront Origin Access Identity S3 canonical user ID"
  value       = aws_cloudfront_origin_access_identity.content.s3_canonical_user_id
}

# Replication Information
output "replication_role_arn" {
  description = "ARN of the cross-region replication IAM role"
  value       = var.enable_cross_region_replication ? aws_iam_role.replication[0].arn : null
}

# Content Paths (for application use)
output "content_paths" {
  description = "Standard content organization paths"
  value = {
    books       = "books/"
    submissions = "submissions/"
    ai_generated = "ai-generated/"
    templates   = "templates/"
    thumbnails  = "thumbnails/"
    audio       = "audio/"
    temp        = "temp/"
  }
}

# Bucket URLs for application integration
output "bucket_urls" {
  description = "Complete bucket URLs for application use"
  value = {
    content_https = "https://${aws_s3_bucket.content.bucket_domain_name}"
    content_s3    = "s3://${aws_s3_bucket.content.id}"
    backup_s3     = var.enable_cross_region_replication ? "s3://${aws_s3_bucket.backup[0].id}" : null
    logs_s3       = "s3://${aws_s3_bucket.logs.id}"
    temp_s3       = "s3://${aws_s3_bucket.temp_uploads.id}"
  }
}

# AWS Region Information
output "primary_region" {
  description = "Primary AWS region"
  value       = data.aws_region.current.name
}

output "backup_region" {
  description = "Backup AWS region (if cross-region replication is enabled)"
  value       = var.enable_cross_region_replication ? var.backup_region : null
}

# Security Configuration
output "encryption_configuration" {
  description = "Encryption configuration details"
  value = {
    kms_key_id       = aws_kms_key.s3_encryption.id
    kms_key_arn      = aws_kms_key.s3_encryption.arn
    kms_alias        = aws_kms_alias.s3_encryption.name
    algorithm        = "aws:kms"
    bucket_key_enabled = true
  }
  sensitive = false
}

# Bucket Configuration Summary
output "bucket_configuration" {
  description = "Summary of bucket configuration"
  value = {
    versioning_enabled    = var.enable_versioning
    replication_enabled   = var.enable_cross_region_replication
    public_access_blocked = true
    ssl_only             = true
    encryption_enabled   = true
    logging_enabled      = true
    lifecycle_configured = true
  }
}

# Publishing Workflow Paths
output "publishing_paths" {
  description = "Specific paths for publishing workflow"
  value = {
    # Book publishing paths
    published_books     = "books/published/"
    draft_books         = "books/drafts/"
    book_covers         = "books/covers/"
    book_thumbnails     = "thumbnails/books/"

    # Submission workflow paths
    pending_submissions = "submissions/pending/"
    under_review        = "submissions/under-review/"
    approved           = "submissions/approved/"
    rejected           = "submissions/rejected/"
    revisions          = "submissions/revisions/"

    # AI generated content paths
    ai_images          = "ai-generated/images/"
    ai_audio           = "ai-generated/audio/"
    ai_thumbnails      = "ai-generated/thumbnails/"

    # Template and asset paths
    book_templates     = "templates/books/"
    cover_templates    = "templates/covers/"
    layout_templates   = "templates/layouts/"

    # Processing paths
    temp_processing    = "temp/processing/"
    temp_uploads       = "temp/uploads/"
    temp_conversions   = "temp/conversions/"
  }
}

# Role-Based Access Paths
output "role_access_patterns" {
  description = "Access patterns by user role"
  value = {
    learner = {
      read_paths = ["books/published/*"]
      write_paths = []
    }
    teacher = {
      read_paths = ["books/published/*", "books/covers/*", "thumbnails/books/*"]
      write_paths = ["submissions/pending/*"]
    }
    volunteer = {
      read_paths = ["books/published/*", "templates/*"]
      write_paths = ["submissions/pending/*", "temp/uploads/*"]
    }
    story_manager = {
      read_paths = ["submissions/*", "books/*", "templates/*"]
      write_paths = ["submissions/under-review/*", "submissions/approved/*", "submissions/rejected/*"]
    }
    book_manager = {
      read_paths = ["submissions/approved/*", "books/*", "templates/*", "ai-generated/*"]
      write_paths = ["books/drafts/*", "ai-generated/*", "temp/processing/*"]
    }
    content_admin = {
      read_paths = ["*"]
      write_paths = ["books/published/*", "templates/*"]
    }
    admin = {
      read_paths = ["*"]
      write_paths = ["*"]
    }
  }
}

# CloudWatch Metrics Names
output "cloudwatch_metrics" {
  description = "CloudWatch metrics for monitoring"
  value = {
    bucket_size_bytes = "AWS/S3/BucketSizeBytes"
    number_of_objects = "AWS/S3/NumberOfObjects"
    all_requests     = "AWS/S3/AllRequests"
    get_requests     = "AWS/S3/GetRequests"
    put_requests     = "AWS/S3/PutRequests"
    delete_requests  = "AWS/S3/DeleteRequests"
    bytes_downloaded = "AWS/S3/BytesDownloaded"
    bytes_uploaded   = "AWS/S3/BytesUploaded"
    errors_4xx       = "AWS/S3/4xxErrors"
    errors_5xx       = "AWS/S3/5xxErrors"
  }
}

# Integration Information for Next.js Application
output "nextjs_env_vars" {
  description = "Environment variables for Next.js application"
  value = {
    AWS_S3_BUCKET_NAME     = aws_s3_bucket.content.id
    AWS_S3_REGION          = data.aws_region.current.name
    AWS_S3_BACKUP_BUCKET   = var.enable_cross_region_replication ? aws_s3_bucket.backup[0].id : ""
    AWS_S3_TEMP_BUCKET     = aws_s3_bucket.temp_uploads.id
    AWS_KMS_KEY_ID         = aws_kms_key.s3_encryption.id
    S3_CLOUDFRONT_OAI      = aws_cloudfront_origin_access_identity.content.id
  }
  sensitive = false
}