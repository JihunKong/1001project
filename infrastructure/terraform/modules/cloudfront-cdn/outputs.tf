# Outputs for CloudFront CDN Module

# Distribution Information
output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "distribution_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "distribution_status" {
  description = "CloudFront distribution status"
  value       = aws_cloudfront_distribution.main.status
}

output "distribution_etag" {
  description = "CloudFront distribution ETag"
  value       = aws_cloudfront_distribution.main.etag
}

# URL Information
output "cloudfront_url" {
  description = "Complete CloudFront URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "custom_domain_urls" {
  description = "Custom domain URLs (if aliases are configured)"
  value       = length(var.domain_aliases) > 0 ? [for alias in var.domain_aliases : "https://${alias}"] : []
}

# Cache Policy Information
output "cache_policy_ids" {
  description = "CloudFront cache policy IDs"
  value = {
    long_cache   = aws_cloudfront_cache_policy.long_cache.id
    medium_cache = aws_cloudfront_cache_policy.medium_cache.id
    no_cache     = data.aws_cloudfront_cache_policy.managed_caching_disabled.id
    optimized    = data.aws_cloudfront_cache_policy.managed_caching_optimized.id
  }
}

output "origin_request_policy_id" {
  description = "Educational content origin request policy ID"
  value       = aws_cloudfront_origin_request_policy.educational_content.id
}

output "response_headers_policy_id" {
  description = "Educational security response headers policy ID"
  value       = aws_cloudfront_response_headers_policy.educational_security.id
}

# Function Information
output "url_validation_function_arn" {
  description = "CloudFront URL validation function ARN"
  value       = aws_cloudfront_function.url_validation.arn
}

output "auth_edge_function_arn" {
  description = "Lambda@Edge authentication function ARN"
  value       = var.enable_edge_auth ? aws_lambda_function.auth_edge[0].arn : null
}

output "auth_edge_function_qualified_arn" {
  description = "Lambda@Edge authentication function qualified ARN"
  value       = var.enable_edge_auth ? aws_lambda_function.auth_edge[0].qualified_arn : null
}

# Monitoring Information
output "cloudwatch_alarm_arns" {
  description = "CloudWatch alarm ARNs for monitoring"
  value = var.enable_monitoring ? {
    high_4xx_error_rate  = aws_cloudwatch_metric_alarm.high_4xx_error_rate[0].arn
    high_5xx_error_rate  = aws_cloudwatch_metric_alarm.high_5xx_error_rate[0].arn
    low_cache_hit_rate   = aws_cloudwatch_metric_alarm.low_cache_hit_rate[0].arn
  } : {}
}

# Content Delivery Configuration
output "content_delivery_configuration" {
  description = "Content delivery configuration summary"
  value = {
    price_class             = var.price_class
    ipv6_enabled           = var.enable_ipv6
    compression_enabled    = var.enable_compression
    http_version          = var.http_version
    geo_restriction_type  = var.geo_restriction_type
    ssl_minimum_version   = "TLSv1.2_2021"
    origin_shield_enabled = var.enable_origin_shield
  }
}

# Cache Behavior Summary
output "cache_behaviors" {
  description = "Summary of cache behaviors"
  value = {
    default = {
      target_origin    = "S3-${var.s3_bucket_name}"
      cache_policy     = "medium_cache"
      viewer_protocol  = "redirect-to-https"
      compression      = true
    }
    static_assets = {
      path_pattern     = "/static/*"
      target_origin    = "S3-${var.s3_bucket_name}"
      cache_policy     = "long_cache"
      viewer_protocol  = "redirect-to-https"
      compression      = true
    }
    published_books = {
      path_pattern     = "/books/published/*"
      target_origin    = "S3-${var.s3_bucket_name}"
      cache_policy     = "medium_cache"
      viewer_protocol  = "redirect-to-https"
      compression      = true
      auth_required    = true
    }
    thumbnails = {
      path_pattern     = "/thumbnails/*"
      target_origin    = "S3-${var.s3_bucket_name}"
      cache_policy     = "long_cache"
      viewer_protocol  = "redirect-to-https"
      compression      = true
    }
    audio = {
      path_pattern     = "/audio/*"
      target_origin    = "S3-${var.s3_bucket_name}"
      cache_policy     = "medium_cache"
      viewer_protocol  = "redirect-to-https"
      compression      = false
    }
    submissions = {
      path_pattern     = "/submissions/*"
      target_origin    = "S3-${var.s3_bucket_name}"
      cache_policy     = "no_cache"
      viewer_protocol  = "redirect-to-https"
      compression      = true
      auth_required    = true
    }
  }
}

# Security Configuration
output "security_configuration" {
  description = "Security configuration summary"
  value = {
    ssl_certificate_arn     = var.ssl_certificate_arn
    waf_enabled            = var.waf_web_acl_id != ""
    edge_auth_enabled      = var.enable_edge_auth
    cors_enabled          = true
    security_headers      = true
    field_level_encryption = var.enable_field_level_encryption
    viewer_protocol_policy = "redirect-to-https"
  }
}

# CORS Configuration
output "cors_configuration" {
  description = "CORS configuration details"
  value = {
    allowed_origins      = var.allowed_origins
    allowed_methods      = var.allowed_methods
    allowed_headers      = var.allowed_headers
    credentials_allowed  = true
    max_age_seconds     = 3600
  }
}

# Educational Platform Integration
output "educational_platform_config" {
  description = "Educational platform specific configuration"
  value = {
    role_based_caching    = var.enable_role_based_caching
    allowed_roles        = var.allowed_roles
    learner_cache_ttl    = var.learner_cache_ttl
    teacher_cache_ttl    = var.teacher_cache_ttl
    admin_cache_ttl      = var.admin_cache_ttl
    pdf_cache_ttl        = var.pdf_cache_ttl
    image_cache_ttl      = var.image_cache_ttl
    audio_cache_ttl      = var.audio_cache_ttl
  }
}

# Performance Metrics
output "performance_configuration" {
  description = "Performance optimization configuration"
  value = {
    intelligent_caching_enabled = var.enable_intelligent_caching
    origin_shield_enabled      = var.enable_origin_shield
    origin_shield_region       = var.origin_shield_region
    real_time_logs_enabled     = var.enable_real_time_logs
    global_acceleration        = var.enable_global_acceleration
    preferred_cache_regions    = var.preferred_cache_regions
  }
}

# Integration URLs for Next.js Application
output "nextjs_env_vars" {
  description = "Environment variables for Next.js application"
  value = {
    CLOUDFRONT_DISTRIBUTION_ID     = aws_cloudfront_distribution.main.id
    CLOUDFRONT_DOMAIN_NAME        = aws_cloudfront_distribution.main.domain_name
    CLOUDFRONT_URL                = "https://${aws_cloudfront_distribution.main.domain_name}"
    CLOUDFRONT_ZONE_ID            = aws_cloudfront_distribution.main.hosted_zone_id
    CDN_ENABLED                   = "true"
    CDN_CACHE_ENABLED             = "true"
    CDN_COMPRESSION_ENABLED       = var.enable_compression ? "true" : "false"
  }
  sensitive = false
}

# API Integration Information
output "api_integration" {
  description = "API integration configuration"
  value = {
    api_gateway_origin_enabled = var.api_gateway_domain != ""
    api_gateway_domain        = var.api_gateway_domain
    api_gateway_stage         = var.api_gateway_stage
    signed_url_expiration     = var.signed_url_expiration
  }
}

# Cost Optimization Information
output "cost_optimization" {
  description = "Cost optimization features enabled"
  value = {
    price_class              = var.price_class
    intelligent_caching      = var.enable_intelligent_caching
    compression_enabled      = var.enable_compression
    origin_shield_enabled    = var.enable_origin_shield
    cache_hit_optimization   = true
    geo_restrictions_enabled = var.geo_restriction_type != "none"
  }
}

# Monitoring and Logging
output "monitoring_configuration" {
  description = "Monitoring and logging configuration"
  value = {
    cloudwatch_monitoring_enabled = var.enable_monitoring
    access_logging_enabled        = var.enable_logging
    real_time_logs_enabled        = var.enable_real_time_logs
    alarm_actions                 = var.alarm_actions
    error_4xx_threshold           = var.error_4xx_threshold
    error_5xx_threshold           = var.error_5xx_threshold
    cache_hit_rate_threshold      = var.cache_hit_rate_threshold
  }
}

# Origin Configuration
output "origin_configuration" {
  description = "Origin configuration summary"
  value = {
    s3_origin = {
      bucket_name    = var.s3_bucket_name
      domain_name    = var.s3_bucket_domain_name
      access_method  = "origin-access-identity"
      custom_headers = {
        "X-Educational-Platform" = "1001-stories"
      }
    }
    api_gateway_origin = var.api_gateway_domain != "" ? {
      domain_name       = var.api_gateway_domain
      stage            = var.api_gateway_stage
      protocol_policy  = "https-only"
      ssl_protocols    = ["TLSv1.2"]
    } : null
  }
}

# Function Configuration
output "function_configuration" {
  description = "CloudFront Functions and Lambda@Edge configuration"
  value = {
    cloudfront_functions_enabled = var.enable_cloudfront_functions
    lambda_edge_enabled         = var.enable_lambda_edge
    url_validation_function     = {
      name = aws_cloudfront_function.url_validation.name
      arn  = aws_cloudfront_function.url_validation.arn
      event_type = "viewer-request"
    }
    auth_edge_function = var.enable_edge_auth ? {
      name = aws_lambda_function.auth_edge[0].function_name
      arn  = aws_lambda_function.auth_edge[0].qualified_arn
      event_type = "viewer-request"
    } : null
  }
}

# Error Page Configuration
output "error_page_configuration" {
  description = "Error page configuration"
  value = {
    custom_error_pages = var.custom_error_pages
    default_error_pages = [
      {
        error_code            = 403
        response_code         = 404
        response_page_path    = "/404.html"
        error_caching_min_ttl = 10
      },
      {
        error_code            = 404
        response_code         = 404
        response_page_path    = "/404.html"
        error_caching_min_ttl = 10
      },
      {
        error_code            = 500
        response_code         = 500
        response_page_path    = "/500.html"
        error_caching_min_ttl = 0
      }
    ]
  }
}

# Distribution Invalidation Information
output "invalidation_configuration" {
  description = "Information for cache invalidation"
  value = {
    distribution_id = aws_cloudfront_distribution.main.id
    common_invalidation_paths = [
      "/index.html",
      "/books/*",
      "/api/*",
      "/static/css/*",
      "/static/js/*"
    ]
    invalidation_command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.main.id} --paths '/*'"
  }
}