# IAM Module for 1001 Stories Role-Based Access Control
# Implements 7-tier user role system with S3 publishing workflow permissions

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  # Role definitions matching the application's user roles
  user_roles = {
    learner = {
      description = "Student learners with read access to assigned books only"
      max_session_duration = 3600 # 1 hour
    }
    teacher = {
      description = "Teachers who assign books and submit content"
      max_session_duration = 7200 # 2 hours
    }
    volunteer = {
      description = "Content contributors who submit stories"
      max_session_duration = 7200 # 2 hours
    }
    story_manager = {
      description = "Content reviewers in the publishing workflow"
      max_session_duration = 14400 # 4 hours
    }
    book_manager = {
      description = "Publication format decision makers"
      max_session_duration = 14400 # 4 hours
    }
    content_admin = {
      description = "Final approval authority for content publishing"
      max_session_duration = 28800 # 8 hours
    }
    admin = {
      description = "System administrators with full access"
      max_session_duration = 28800 # 8 hours
    }
  }
}

# IAM Roles for each user type
resource "aws_iam_role" "user_roles" {
  for_each = local.user_roles

  name                 = "${var.name_prefix}-${each.key}-role"
  description          = each.value.description
  max_session_duration = each.value.max_session_duration

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.name_prefix}-${each.key}-external-id"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${each.key}-role"
    Role = each.key
  })
}

# LEARNER Role Policies - Read access to assigned books only
resource "aws_iam_policy" "learner_policy" {
  name        = "${var.name_prefix}-learner-policy"
  description = "Policy for learner access to assigned educational content"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadPublishedBooks"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${var.content_bucket_arn}/books/published/*",
          "${var.content_bucket_arn}/thumbnails/books/*"
        ]
        Condition = {
          StringLike = {
            "s3:ExistingObjectTag/AccessLevel" = "learner"
          }
        }
      },
      {
        Sid    = "ListAssignedContent"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = var.content_bucket_arn
        Condition = {
          StringLike = {
            "s3:prefix" = [
              "books/published/*",
              "thumbnails/books/*"
            ]
          }
        }
      }
    ]
  })

  tags = var.tags
}

# TEACHER Role Policies - Book assignment + content submission
resource "aws_iam_policy" "teacher_policy" {
  name        = "${var.name_prefix}-teacher-policy"
  description = "Policy for teacher access to content management and assignment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadPublishedContent"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Resource = [
          var.content_bucket_arn,
          "${var.content_bucket_arn}/books/published/*",
          "${var.content_bucket_arn}/books/covers/*",
          "${var.content_bucket_arn}/thumbnails/*",
          "${var.content_bucket_arn}/templates/*"
        ]
      },
      {
        Sid    = "SubmitContent"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:PutObjectTagging"
        ]
        Resource = [
          "${var.content_bucket_arn}/submissions/pending/*",
          "${var.temp_bucket_arn}/uploads/*"
        ]
      },
      {
        Sid    = "ManageAssignments"
        Effect = "Allow"
        Action = [
          "s3:PutObjectTagging",
          "s3:GetObjectTagging"
        ]
        Resource = "${var.content_bucket_arn}/books/published/*"
      }
    ]
  })

  tags = var.tags
}

# VOLUNTEER Role Policies - Content contribution
resource "aws_iam_policy" "volunteer_policy" {
  name        = "${var.name_prefix}-volunteer-policy"
  description = "Policy for volunteer content contribution"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadPublishedContent"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${var.content_bucket_arn}/books/published/*",
          "${var.content_bucket_arn}/templates/*"
        ]
      },
      {
        Sid    = "SubmitStories"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:PutObjectTagging",
          "s3:DeleteObject"
        ]
        Resource = [
          "${var.content_bucket_arn}/submissions/pending/*",
          "${var.temp_bucket_arn}/uploads/*"
        ]
      },
      {
        Sid    = "ListTemplates"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = var.content_bucket_arn
        Condition = {
          StringLike = {
            "s3:prefix" = "templates/*"
          }
        }
      },
      {
        Sid    = "UploadAssets"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${var.temp_bucket_arn}/*"
      }
    ]
  })

  tags = var.tags
}

# STORY_MANAGER Role Policies - Review workflow management
resource "aws_iam_policy" "story_manager_policy" {
  name        = "${var.name_prefix}-story-manager-policy"
  description = "Policy for story managers in the review workflow"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReviewSubmissions"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectTagging",
          "s3:PutObjectTagging",
          "s3:ListBucket"
        ]
        Resource = [
          var.content_bucket_arn,
          "${var.content_bucket_arn}/submissions/*"
        ]
      },
      {
        Sid    = "ManageReviewWorkflow"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:CopyObject"
        ]
        Resource = [
          "${var.content_bucket_arn}/submissions/under-review/*",
          "${var.content_bucket_arn}/submissions/approved/*",
          "${var.content_bucket_arn}/submissions/rejected/*",
          "${var.content_bucket_arn}/submissions/revisions/*"
        ]
      },
      {
        Sid    = "AccessTemplatesAndGuidelines"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${var.content_bucket_arn}/templates/*",
          "${var.content_bucket_arn}/books/published/*"
        ]
      },
      {
        Sid    = "ProvideFeedback"
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${var.content_bucket_arn}/submissions/*/feedback/*"
      }
    ]
  })

  tags = var.tags
}

# BOOK_MANAGER Role Policies - Publication format decisions
resource "aws_iam_policy" "book_manager_policy" {
  name        = "${var.name_prefix}-book-manager-policy"
  description = "Policy for book managers handling publication decisions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AccessApprovedSubmissions"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectTagging",
          "s3:ListBucket"
        ]
        Resource = [
          var.content_bucket_arn,
          "${var.content_bucket_arn}/submissions/approved/*",
          "${var.content_bucket_arn}/books/*",
          "${var.content_bucket_arn}/templates/*"
        ]
      },
      {
        Sid    = "ManageBookProduction"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectTagging",
          "s3:DeleteObject",
          "s3:CopyObject"
        ]
        Resource = [
          "${var.content_bucket_arn}/books/drafts/*",
          "${var.content_bucket_arn}/books/covers/*",
          "${var.temp_bucket_arn}/processing/*"
        ]
      },
      {
        Sid    = "ManageAIGeneratedContent"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectTagging"
        ]
        Resource = [
          "${var.content_bucket_arn}/ai-generated/*"
        ]
      },
      {
        Sid    = "ProcessingOperations"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${var.temp_bucket_arn}/*"
      }
    ]
  })

  tags = var.tags
}

# CONTENT_ADMIN Role Policies - Final approval authority
resource "aws_iam_policy" "content_admin_policy" {
  name        = "${var.name_prefix}-content-admin-policy"
  description = "Policy for content administrators with final approval authority"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "FullContentAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectTagging",
          "s3:ListBucket",
          "s3:ListBucketVersions"
        ]
        Resource = [
          var.content_bucket_arn,
          "${var.content_bucket_arn}/*"
        ]
      },
      {
        Sid    = "PublishContent"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectTagging",
          "s3:DeleteObject",
          "s3:CopyObject"
        ]
        Resource = [
          "${var.content_bucket_arn}/books/published/*",
          "${var.content_bucket_arn}/books/drafts/*",
          "${var.content_bucket_arn}/templates/*"
        ]
      },
      {
        Sid    = "ManageContentPolicies"
        Effect = "Allow"
        Action = [
          "s3:PutBucketPolicy",
          "s3:GetBucketPolicy",
          "s3:PutBucketTagging",
          "s3:GetBucketTagging"
        ]
        Resource = var.content_bucket_arn
      },
      {
        Sid    = "ArchiveAndCleanup"
        Effect = "Allow"
        Action = [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion"
        ]
        Resource = [
          "${var.content_bucket_arn}/submissions/*",
          "${var.temp_bucket_arn}/*"
        ]
      }
    ]
  })

  tags = var.tags
}

# ADMIN Role Policies - Full system access
resource "aws_iam_policy" "admin_policy" {
  name        = "${var.name_prefix}-admin-policy"
  description = "Policy for system administrators with full access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "FullS3Access"
        Effect = "Allow"
        Action = "s3:*"
        Resource = [
          var.content_bucket_arn,
          "${var.content_bucket_arn}/*",
          var.backup_bucket_arn != null ? var.backup_bucket_arn : "",
          var.backup_bucket_arn != null ? "${var.backup_bucket_arn}/*" : "",
          var.temp_bucket_arn,
          "${var.temp_bucket_arn}/*"
        ]
      },
      {
        Sid    = "KMSAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_arn
      },
      {
        Sid    = "CloudWatchAccess"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:PutMetricAlarm",
          "cloudwatch:DeleteAlarms",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

# Policy attachments
resource "aws_iam_role_policy_attachment" "learner" {
  role       = aws_iam_role.user_roles["learner"].name
  policy_arn = aws_iam_policy.learner_policy.arn
}

resource "aws_iam_role_policy_attachment" "teacher" {
  role       = aws_iam_role.user_roles["teacher"].name
  policy_arn = aws_iam_policy.teacher_policy.arn
}

resource "aws_iam_role_policy_attachment" "volunteer" {
  role       = aws_iam_role.user_roles["volunteer"].name
  policy_arn = aws_iam_policy.volunteer_policy.arn
}

resource "aws_iam_role_policy_attachment" "story_manager" {
  role       = aws_iam_role.user_roles["story_manager"].name
  policy_arn = aws_iam_policy.story_manager_policy.arn
}

resource "aws_iam_role_policy_attachment" "book_manager" {
  role       = aws_iam_role.user_roles["book_manager"].name
  policy_arn = aws_iam_policy.book_manager_policy.arn
}

resource "aws_iam_role_policy_attachment" "content_admin" {
  role       = aws_iam_role.user_roles["content_admin"].name
  policy_arn = aws_iam_policy.content_admin_policy.arn
}

resource "aws_iam_role_policy_attachment" "admin" {
  role       = aws_iam_role.user_roles["admin"].name
  policy_arn = aws_iam_policy.admin_policy.arn
}

# Application IAM Role for ECS Tasks
resource "aws_iam_role" "app_execution_role" {
  name = "${var.name_prefix}-app-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# ECS Task Execution Policy
resource "aws_iam_role_policy_attachment" "app_execution_role_policy" {
  role       = aws_iam_role.app_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Application IAM Role for S3 operations
resource "aws_iam_role" "app_task_role" {
  name = "${var.name_prefix}-app-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# Application S3 Policy - Can assume user roles for specific operations
resource "aws_iam_policy" "app_s3_policy" {
  name        = "${var.name_prefix}-app-s3-policy"
  description = "Policy for application to manage S3 operations and role assumptions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeUserRoles"
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Resource = [
          for role in aws_iam_role.user_roles : role.arn
        ]
      },
      {
        Sid    = "GenerateSignedUrls"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${var.content_bucket_arn}/*",
          "${var.temp_bucket_arn}/*"
        ]
      },
      {
        Sid    = "KMSOperations"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = var.kms_key_arn
      },
      {
        Sid    = "ListBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          var.content_bucket_arn,
          var.temp_bucket_arn
        ]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ecs/${var.name_prefix}:*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "app_task_role_s3" {
  role       = aws_iam_role.app_task_role.name
  policy_arn = aws_iam_policy.app_s3_policy.arn
}

# Lambda Execution Role for S3 processing
resource "aws_iam_role" "lambda_processing_role" {
  name = "${var.name_prefix}-lambda-processing-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# Lambda Processing Policy
resource "aws_iam_policy" "lambda_processing_policy" {
  name        = "${var.name_prefix}-lambda-processing-policy"
  description = "Policy for Lambda functions processing S3 content"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ProcessingAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectTagging",
          "s3:PutObjectTagging"
        ]
        Resource = [
          "${var.content_bucket_arn}/*",
          "${var.temp_bucket_arn}/*"
        ]
      },
      {
        Sid    = "KMSOperations"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = var.kms_key_arn
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_processing" {
  role       = aws_iam_role.lambda_processing_role.name
  policy_arn = aws_iam_policy.lambda_processing_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_processing_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}