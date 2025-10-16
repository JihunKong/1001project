# S3 Publishing System for 1001 Stories
# Comprehensive content management with role-based access control

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Random suffix for unique bucket names
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  # S3 bucket names (globally unique)
  content_bucket_name = "${var.name_prefix}-content-${random_string.bucket_suffix.result}"
  backup_bucket_name  = "${var.name_prefix}-backup-${random_string.bucket_suffix.result}"
  logs_bucket_name    = "${var.name_prefix}-logs-${random_string.bucket_suffix.result}"
  temp_bucket_name    = "${var.name_prefix}-temp-${random_string.bucket_suffix.result}"

  # Content structure paths
  content_paths = {
    books       = "books/"
    submissions = "submissions/"
    ai_generated = "ai-generated/"
    templates   = "templates/"
    thumbnails  = "thumbnails/"
    audio       = "audio/"
  }
}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for 1001 Stories S3 bucket encryption"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-s3-encryption-key"
  })
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${var.name_prefix}-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# Main Content Bucket
resource "aws_s3_bucket" "content" {
  bucket        = local.content_bucket_name
  force_destroy = var.environment != "production"

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-content-bucket"
    Purpose = "primary-content-storage"
  })
}

# Content Bucket Configuration
resource "aws_s3_bucket_versioning" "content" {
  bucket = aws_s3_bucket.content.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "content" {
  bucket = aws_s3_bucket.content.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "content" {
  bucket = aws_s3_bucket.content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Content Bucket Lifecycle Rules
resource "aws_s3_bucket_lifecycle_configuration" "content" {
  count  = length(var.lifecycle_rules) > 0 ? 1 : 0
  bucket = aws_s3_bucket.content.id

  # Published Books - Keep forever with intelligent tiering
  rule {
    id     = "published-books-lifecycle"
    status = "Enabled"

    filter {
      prefix = local.content_paths.books
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
  }

  # Submissions - Aggressive lifecycle for cost optimization
  rule {
    id     = "submissions-lifecycle"
    status = "Enabled"

    filter {
      prefix = local.content_paths.submissions
    }

    transition {
      days          = 7
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    # Delete old submission versions after approval
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  # Temporary files - Auto cleanup
  rule {
    id     = "temp-files-cleanup"
    status = "Enabled"

    filter {
      prefix = "temp/"
    }

    expiration {
      days = 1
    }
  }

  # AI Generated content - Moderate lifecycle
  rule {
    id     = "ai-generated-lifecycle"
    status = "Enabled"

    filter {
      prefix = local.content_paths.ai_generated
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }
  }
}

# Backup Bucket (Cross-Region)
resource "aws_s3_bucket" "backup" {
  count         = var.enable_cross_region_replication ? 1 : 0
  provider      = aws.backup_region
  bucket        = local.backup_bucket_name
  force_destroy = var.environment != "production"

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-backup-bucket"
    Purpose = "cross-region-backup"
    Region  = var.backup_region
  })
}

resource "aws_s3_bucket_versioning" "backup" {
  count    = var.enable_cross_region_replication ? 1 : 0
  provider = aws.backup_region
  bucket   = aws_s3_bucket.backup[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  count    = var.enable_cross_region_replication ? 1 : 0
  provider = aws.backup_region
  bucket   = aws_s3_bucket.backup[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Access Logs Bucket
resource "aws_s3_bucket" "logs" {
  bucket        = local.logs_bucket_name
  force_destroy = true

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-access-logs"
    Purpose = "s3-access-logging"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Logs lifecycle - Delete after 90 days
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-cleanup"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# Content Bucket Logging
resource "aws_s3_bucket_logging" "content" {
  bucket = aws_s3_bucket.content.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "access-logs/"
}

# Cross-Region Replication IAM Role
resource "aws_iam_role" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0
  name  = "${var.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0
  name  = "${var.name_prefix}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.content.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.content.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.backup[0].arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  count      = var.enable_cross_region_replication ? 1 : 0
  role       = aws_iam_role.replication[0].name
  policy_arn = aws_iam_policy.replication[0].arn
}

# Cross-Region Replication Configuration
resource "aws_s3_bucket_replication_configuration" "content" {
  count  = var.enable_cross_region_replication ? 1 : 0
  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.content.id

  rule {
    id     = "replicate-all-content"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.backup[0].arn
      storage_class = "STANDARD_IA"

      # Encrypt in backup region
      encryption_configuration {
        replica_kms_key_id = "alias/aws/s3"
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.content]
}

# Temporary Upload Bucket for processing
resource "aws_s3_bucket" "temp_uploads" {
  bucket        = local.temp_bucket_name
  force_destroy = true

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-temp-uploads"
    Purpose = "temporary-file-processing"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "temp_uploads" {
  bucket = aws_s3_bucket.temp_uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "temp_uploads" {
  bucket = aws_s3_bucket.temp_uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Temp uploads auto-cleanup after 24 hours
resource "aws_s3_bucket_lifecycle_configuration" "temp_uploads" {
  bucket = aws_s3_bucket.temp_uploads.id

  rule {
    id     = "temp-upload-cleanup"
    status = "Enabled"

    expiration {
      days = 1
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# CloudFront Origin Access Identity for secure content delivery
resource "aws_cloudfront_origin_access_identity" "content" {
  comment = "OAI for ${var.name_prefix} content bucket"
}

# S3 Bucket Policy for CloudFront Access
resource "aws_s3_bucket_policy" "content" {
  bucket = aws_s3_bucket.content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.content.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.content.arn}/*"
      },
      {
        Sid    = "DenyDirectPublicAccess"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
        Condition = {
          StringNotEquals = {
            "AWS:SourceArn" = aws_cloudfront_origin_access_identity.content.iam_arn
          }
        }
      }
    ]
  })
}