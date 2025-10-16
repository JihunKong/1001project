# CloudFront CDN Module for 1001 Stories
# Global content delivery with role-based access and caching optimization

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data sources
data "aws_cloudfront_cache_policy" "managed_caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "managed_caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "managed_cors_s3origin" {
  name = "Managed-CORS-S3Origin"
}

data "aws_cloudfront_response_headers_policy" "managed_security_headers" {
  name = "Managed-SecurityHeadersPolicy"
}

locals {
  # Cache behaviors for different content types
  cache_behaviors = {
    # Static assets - long cache
    static_assets = {
      path_pattern    = "/static/*"
      ttl_default     = 86400    # 1 day
      ttl_max         = 31536000 # 1 year
      compress        = true
      viewer_protocol = "redirect-to-https"
    }

    # Published books - medium cache with auth
    published_books = {
      path_pattern    = "/books/published/*"
      ttl_default     = 3600     # 1 hour
      ttl_max         = 86400    # 1 day
      compress        = true
      viewer_protocol = "redirect-to-https"
    }

    # Thumbnails - long cache
    thumbnails = {
      path_pattern    = "/thumbnails/*"
      ttl_default     = 86400    # 1 day
      ttl_max         = 2592000  # 30 days
      compress        = true
      viewer_protocol = "redirect-to-https"
    }

    # AI generated content - medium cache
    ai_content = {
      path_pattern    = "/ai-generated/*"
      ttl_default     = 7200     # 2 hours
      ttl_max         = 86400    # 1 day
      compress        = true
      viewer_protocol = "redirect-to-https"
    }

    # Templates - long cache
    templates = {
      path_pattern    = "/templates/*"
      ttl_default     = 86400    # 1 day
      ttl_max         = 604800   # 1 week
      compress        = true
      viewer_protocol = "redirect-to-https"
    }

    # Submissions - no cache (dynamic content)
    submissions = {
      path_pattern    = "/submissions/*"
      ttl_default     = 0
      ttl_max         = 0
      compress        = true
      viewer_protocol = "redirect-to-https"
    }

    # Audio files - medium cache
    audio = {
      path_pattern    = "/audio/*"
      ttl_default     = 3600     # 1 hour
      ttl_max         = 86400    # 1 day
      compress        = false    # Audio files shouldn't be compressed
      viewer_protocol = "redirect-to-https"
    }
  }

  # Custom cache policy IDs
  cache_policies = {
    long_cache    = aws_cloudfront_cache_policy.long_cache.id
    medium_cache  = aws_cloudfront_cache_policy.medium_cache.id
    no_cache      = data.aws_cloudfront_cache_policy.managed_caching_disabled.id
    optimized     = data.aws_cloudfront_cache_policy.managed_caching_optimized.id
  }
}

# Custom Cache Policies
resource "aws_cloudfront_cache_policy" "long_cache" {
  name        = "${var.name_prefix}-long-cache-policy"
  comment     = "Long cache policy for static educational content"
  default_ttl = 86400  # 1 day
  max_ttl     = 31536000 # 1 year
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["CloudFront-Viewer-Country", "Accept", "Accept-Language"]
      }
    }

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["v", "version", "role"] # Allow versioning and role-based access
      }
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

resource "aws_cloudfront_cache_policy" "medium_cache" {
  name        = "${var.name_prefix}-medium-cache-policy"
  comment     = "Medium cache policy for dynamic educational content"
  default_ttl = 3600  # 1 hour
  max_ttl     = 86400 # 1 day
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = [
          "CloudFront-Viewer-Country",
          "Accept",
          "Accept-Language",
          "Authorization",
          "X-User-Role"
        ]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }

    cookies_config {
      cookie_behavior = "whitelist"
      cookies {
        items = ["auth-token", "user-role"]
      }
    }
  }
}

# Origin Request Policy for Educational Content
resource "aws_cloudfront_origin_request_policy" "educational_content" {
  name    = "${var.name_prefix}-educational-content-policy"
  comment = "Origin request policy for educational content with role-based access"

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Authorization",
        "X-User-Role",
        "X-User-ID",
        "CloudFront-Viewer-Country"
      ]
    }
  }

  query_strings_config {
    query_string_behavior = "all"
  }

  cookies_config {
    cookie_behavior = "whitelist"
    cookies {
      items = [
        "auth-token",
        "user-role",
        "session-id"
      ]
    }
  }
}

# Response Headers Policy for Security and CORS
resource "aws_cloudfront_response_headers_policy" "educational_security" {
  name    = "${var.name_prefix}-educational-security-policy"
  comment = "Security headers policy for educational platform"

  cors_config {
    access_control_allow_credentials = true

    access_control_allow_headers {
      items = [
        "Accept",
        "Accept-Language",
        "Authorization",
        "CloudFront-Forwarded-Proto",
        "Content-Type",
        "Origin",
        "Referer",
        "User-Agent",
        "X-Forwarded-For",
        "X-User-Role"
      ]
    }

    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS", "POST", "PUT"]
    }

    access_control_allow_origins {
      items = var.allowed_origins
    }

    access_control_expose_headers {
      items = ["Date", "ETag", "X-Amz-Request-Id"]
    }

    access_control_max_age_sec = 3600
    origin_override           = false
  }

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = false
    }

    content_type_options {
      override = false
    }

    frame_options {
      frame_option = "DENY"
      override     = false
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = false
    }
  }

  custom_headers_config {
    dynamic "items" {
      for_each = var.custom_headers
      content {
        header   = items.value.name
        value    = items.value.value
        override = items.value.override
      }
    }
  }
}

# Function for signed URL validation (Edge)
resource "aws_cloudfront_function" "url_validation" {
  name    = "${var.name_prefix}-url-validation"
  runtime = "cloudfront-js-1.0"
  comment = "Validate signed URLs and user roles for educational content access"
  publish = true

  code = templatefile("${path.module}/functions/url-validation.js", {
    allowed_roles = var.allowed_roles
  })
}

# Lambda@Edge function for authentication
resource "aws_lambda_function" "auth_edge" {
  count = var.enable_edge_auth ? 1 : 0

  filename         = "${path.module}/functions/auth-edge.zip"
  function_name    = "${var.name_prefix}-auth-edge"
  role            = aws_iam_role.lambda_edge[0].arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  memory_size     = 128
  publish         = true

  tags = var.tags
}

# IAM role for Lambda@Edge
resource "aws_iam_role" "lambda_edge" {
  count = var.enable_edge_auth ? 1 : 0
  name  = "${var.name_prefix}-lambda-edge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_edge_execution" {
  count      = var.enable_edge_auth ? 1 : 0
  role       = aws_iam_role.lambda_edge[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "1001 Stories Educational Content CDN"
  default_root_object = "index.html"
  price_class         = var.price_class
  web_acl_id          = var.waf_web_acl_id

  # Aliases (custom domains)
  aliases = var.domain_aliases

  # S3 Origin for content
  origin {
    domain_name = var.s3_bucket_domain_name
    origin_id   = "S3-${var.s3_bucket_name}"

    s3_origin_config {
      origin_access_identity = var.origin_access_identity_path
    }

    custom_header {
      name  = "X-Educational-Platform"
      value = "1001-stories"
    }
  }

  # API Gateway Origin for dynamic content
  dynamic "origin" {
    for_each = var.api_gateway_domain != "" ? [1] : []
    content {
      domain_name = var.api_gateway_domain
      origin_id   = "API-Gateway"
      origin_path = var.api_gateway_stage != "" ? "/${var.api_gateway_stage}" : ""

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }

      custom_header {
        name  = "X-Forwarded-Proto"
        value = "https"
      }
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods            = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods            = ["GET", "HEAD", "OPTIONS"]
    target_origin_id          = "S3-${var.s3_bucket_name}"
    compress                  = true
    viewer_protocol_policy    = "redirect-to-https"

    cache_policy_id           = local.cache_policies.medium_cache
    origin_request_policy_id  = aws_cloudfront_origin_request_policy.educational_content.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.educational_security.id

    # CloudFront Functions
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_validation.arn
    }

    # Lambda@Edge for authentication
    dynamic "lambda_function_association" {
      for_each = var.enable_edge_auth ? [1] : []
      content {
        event_type   = "viewer-request"
        lambda_arn   = aws_lambda_function.auth_edge[0].qualified_arn
        include_body = false
      }
    }
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern             = "/static/*"
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "S3-${var.s3_bucket_name}"
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"

    cache_policy_id          = local.cache_policies.long_cache
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.managed_cors_s3origin.id
  }

  # Cache behavior for published books
  ordered_cache_behavior {
    path_pattern             = "/books/published/*"
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "S3-${var.s3_bucket_name}"
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"

    cache_policy_id           = local.cache_policies.medium_cache
    origin_request_policy_id  = aws_cloudfront_origin_request_policy.educational_content.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.educational_security.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_validation.arn
    }
  }

  # Cache behavior for thumbnails
  ordered_cache_behavior {
    path_pattern             = "/thumbnails/*"
    allowed_methods          = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "S3-${var.s3_bucket_name}"
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"

    cache_policy_id          = local.cache_policies.long_cache
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.managed_cors_s3origin.id
  }

  # Cache behavior for audio files
  ordered_cache_behavior {
    path_pattern             = "/audio/*"
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "S3-${var.s3_bucket_name}"
    compress                 = false
    viewer_protocol_policy   = "redirect-to-https"

    cache_policy_id           = local.cache_policies.medium_cache
    origin_request_policy_id  = aws_cloudfront_origin_request_policy.educational_content.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.educational_security.id
  }

  # Cache behavior for API requests (no cache)
  dynamic "ordered_cache_behavior" {
    for_each = var.api_gateway_domain != "" ? [1] : []
    content {
      path_pattern             = "/api/*"
      allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods           = ["GET", "HEAD"]
      target_origin_id         = "API-Gateway"
      compress                 = true
      viewer_protocol_policy   = "redirect-to-https"

      cache_policy_id           = local.cache_policies.no_cache
      origin_request_policy_id  = aws_cloudfront_origin_request_policy.educational_content.id
      response_headers_policy_id = aws_cloudfront_response_headers_policy.educational_security.id
    }
  }

  # Cache behavior for submissions (no cache, auth required)
  ordered_cache_behavior {
    path_pattern             = "/submissions/*"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "S3-${var.s3_bucket_name}"
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"

    cache_policy_id           = local.cache_policies.no_cache
    origin_request_policy_id  = aws_cloudfront_origin_request_policy.educational_content.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.educational_security.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_validation.arn
    }
  }

  # Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  # SSL/TLS configuration
  viewer_certificate {
    acm_certificate_arn            = var.ssl_certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = var.ssl_certificate_arn == "" ? true : false
  }

  # Logging configuration
  dynamic "logging_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      include_cookies = false
      bucket         = var.logs_bucket_domain_name
      prefix         = "cloudfront-logs/"
    }
  }

  # Error pages
  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 500
    response_code         = 500
    response_page_path    = "/500.html"
  }

  tags = var.tags
}

# CloudFront monitoring alarms
resource "aws_cloudwatch_metric_alarm" "high_4xx_error_rate" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name          = "${var.name_prefix}-cloudfront-high-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront 4xx error rate"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_error_rate" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name          = "${var.name_prefix}-cloudfront-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "low_cache_hit_rate" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name          = "${var.name_prefix}-cloudfront-low-cache-hit-rate"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CacheHitRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors CloudFront cache hit rate"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = var.tags
}