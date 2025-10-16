# Outputs for IAM Publishing Module

# User Role ARNs
output "user_role_arns" {
  description = "ARNs of IAM roles for each user type"
  value = {
    for role_name, role in aws_iam_role.user_roles : role_name => role.arn
  }
}

output "user_role_names" {
  description = "Names of IAM roles for each user type"
  value = {
    for role_name, role in aws_iam_role.user_roles : role_name => role.name
  }
}

# Individual Role ARNs for easy reference
output "learner_role_arn" {
  description = "ARN of the learner IAM role"
  value       = aws_iam_role.user_roles["learner"].arn
}

output "teacher_role_arn" {
  description = "ARN of the teacher IAM role"
  value       = aws_iam_role.user_roles["teacher"].arn
}

output "volunteer_role_arn" {
  description = "ARN of the volunteer IAM role"
  value       = aws_iam_role.user_roles["volunteer"].arn
}

output "story_manager_role_arn" {
  description = "ARN of the story manager IAM role"
  value       = aws_iam_role.user_roles["story_manager"].arn
}

output "book_manager_role_arn" {
  description = "ARN of the book manager IAM role"
  value       = aws_iam_role.user_roles["book_manager"].arn
}

output "content_admin_role_arn" {
  description = "ARN of the content admin IAM role"
  value       = aws_iam_role.user_roles["content_admin"].arn
}

output "admin_role_arn" {
  description = "ARN of the admin IAM role"
  value       = aws_iam_role.user_roles["admin"].arn
}

# Application Roles
output "app_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.app_execution_role.arn
}

output "app_task_role_arn" {
  description = "ARN of the ECS task role for S3 operations"
  value       = aws_iam_role.app_task_role.arn
}

output "lambda_processing_role_arn" {
  description = "ARN of the Lambda processing role"
  value       = aws_iam_role.lambda_processing_role.arn
}

# Policy ARNs
output "user_policy_arns" {
  description = "ARNs of IAM policies for each user type"
  value = {
    learner       = aws_iam_policy.learner_policy.arn
    teacher       = aws_iam_policy.teacher_policy.arn
    volunteer     = aws_iam_policy.volunteer_policy.arn
    story_manager = aws_iam_policy.story_manager_policy.arn
    book_manager  = aws_iam_policy.book_manager_policy.arn
    content_admin = aws_iam_policy.content_admin_policy.arn
    admin         = aws_iam_policy.admin_policy.arn
  }
}

output "app_s3_policy_arn" {
  description = "ARN of the application S3 policy"
  value       = aws_iam_policy.app_s3_policy.arn
}

output "lambda_processing_policy_arn" {
  description = "ARN of the Lambda processing policy"
  value       = aws_iam_policy.lambda_processing_policy.arn
}

# Role Assumption Information
output "role_assumption_commands" {
  description = "AWS CLI commands for role assumption"
  value = {
    for role_name, role in aws_iam_role.user_roles : role_name =>
    "aws sts assume-role --role-arn ${role.arn} --role-session-name ${role_name}-session --external-id ${var.name_prefix}-${role_name}-external-id"
  }
  sensitive = false
}

# External IDs for secure role assumption
output "external_ids" {
  description = "External IDs for role assumption security"
  value = {
    for role_name in keys(local.user_roles) : role_name => "${var.name_prefix}-${role_name}-external-id"
  }
  sensitive = true
}

# Permission Summaries
output "permission_summary" {
  description = "Summary of permissions for each role"
  value = {
    learner = {
      description = "Read access to assigned published books only"
      s3_permissions = ["GetObject on published books with learner tag"]
      workflow_stage = "content-consumption"
    }
    teacher = {
      description = "Assign books, submit content, manage class assignments"
      s3_permissions = ["Read published content", "Submit to pending", "Tag assignments"]
      workflow_stage = "content-assignment-and-submission"
    }
    volunteer = {
      description = "Submit stories and contribute content"
      s3_permissions = ["Read published/templates", "Submit to pending", "Upload temp files"]
      workflow_stage = "content-creation"
    }
    story_manager = {
      description = "Review submissions and manage approval workflow"
      s3_permissions = ["Review submissions", "Move between workflow stages", "Provide feedback"]
      workflow_stage = "content-review"
    }
    book_manager = {
      description = "Format decisions and book production"
      s3_permissions = ["Access approved content", "Manage book drafts", "AI content generation"]
      workflow_stage = "book-production"
    }
    content_admin = {
      description = "Final approval and publication authority"
      s3_permissions = ["Full content access", "Publish to library", "Manage policies"]
      workflow_stage = "final-approval-and-publication"
    }
    admin = {
      description = "Full system administration"
      s3_permissions = ["Complete S3 access", "KMS operations", "CloudWatch access"]
      workflow_stage = "system-administration"
    }
  }
}

# Access Patterns for Application Integration
output "access_patterns" {
  description = "Access patterns for application integration"
  value = {
    signed_url_generation = {
      role = aws_iam_role.app_task_role.arn
      permissions = ["s3:GetObject", "s3:PutObject"]
      use_case = "Generate signed URLs for secure content access"
    }
    content_processing = {
      role = aws_iam_role.lambda_processing_role.arn
      permissions = ["s3:GetObject", "s3:PutObject", "s3:PutObjectTagging"]
      use_case = "Process uploaded content (PDF, images, audio)"
    }
    role_assumption = {
      role = aws_iam_role.app_task_role.arn
      permissions = ["sts:AssumeRole"]
      use_case = "Assume user roles for specific operations"
    }
  }
}

# Security Configuration Summary
output "security_configuration" {
  description = "Security configuration summary"
  value = {
    encryption_required = true
    ssl_only           = true
    public_access_blocked = true
    mfa_enabled        = var.enable_mfa_requirement
    cross_account_access = var.enable_cross_account_access
    audit_logging      = var.enable_cloudtrail_logging
    ip_restrictions    = var.ip_restriction_enabled
  }
}

# Integration Information for Next.js Application
output "nextjs_env_vars" {
  description = "Environment variables for Next.js application"
  value = {
    # Application role ARNs
    AWS_APP_EXECUTION_ROLE_ARN = aws_iam_role.app_execution_role.arn
    AWS_APP_TASK_ROLE_ARN     = aws_iam_role.app_task_role.arn

    # User role ARNs for dynamic role assumption
    AWS_LEARNER_ROLE_ARN       = aws_iam_role.user_roles["learner"].arn
    AWS_TEACHER_ROLE_ARN       = aws_iam_role.user_roles["teacher"].arn
    AWS_VOLUNTEER_ROLE_ARN     = aws_iam_role.user_roles["volunteer"].arn
    AWS_STORY_MANAGER_ROLE_ARN = aws_iam_role.user_roles["story_manager"].arn
    AWS_BOOK_MANAGER_ROLE_ARN  = aws_iam_role.user_roles["book_manager"].arn
    AWS_CONTENT_ADMIN_ROLE_ARN = aws_iam_role.user_roles["content_admin"].arn
    AWS_ADMIN_ROLE_ARN         = aws_iam_role.user_roles["admin"].arn

    # Lambda processing role
    AWS_LAMBDA_PROCESSING_ROLE_ARN = aws_iam_role.lambda_processing_role.arn
  }
  sensitive = false
}

# Role Mapping for Database Integration
output "role_database_mapping" {
  description = "Mapping of database user roles to IAM roles"
  value = {
    LEARNER       = aws_iam_role.user_roles["learner"].arn
    TEACHER       = aws_iam_role.user_roles["teacher"].arn
    VOLUNTEER     = aws_iam_role.user_roles["volunteer"].arn
    STORY_MANAGER = aws_iam_role.user_roles["story_manager"].arn
    BOOK_MANAGER  = aws_iam_role.user_roles["book_manager"].arn
    CONTENT_ADMIN = aws_iam_role.user_roles["content_admin"].arn
    ADMIN         = aws_iam_role.user_roles["admin"].arn
  }
}

# CloudFormation Outputs for Cross-Stack References
output "cloudformation_outputs" {
  description = "Outputs formatted for CloudFormation cross-stack references"
  value = {
    UserRoleArns = {
      for role_name, role in aws_iam_role.user_roles : title(role_name) => role.arn
    }
    AppExecutionRoleArn = aws_iam_role.app_execution_role.arn
    AppTaskRoleArn      = aws_iam_role.app_task_role.arn
    LambdaProcessingRoleArn = aws_iam_role.lambda_processing_role.arn
  }
}

# Monitoring and Alerting Information
output "monitoring_configuration" {
  description = "Monitoring and alerting configuration"
  value = {
    cloudwatch_log_group = var.cloudwatch_log_group
    log_retention_days   = var.log_retention_days
    cost_center         = var.cost_center
    audit_enabled       = var.enable_cloudtrail_logging
    metrics_enabled     = true
  }
}

# Compliance Information
output "compliance_configuration" {
  description = "Compliance and governance configuration"
  value = {
    data_encryption_at_rest = true
    data_encryption_in_transit = true
    access_logging_enabled = var.enable_cloudtrail_logging
    least_privilege_access = true
    role_based_access_control = true
    audit_trail_enabled = var.enable_cloudtrail_logging
    backup_enabled = var.enable_backup_access
    compliance_mode = var.enable_compliance_mode
  }
}