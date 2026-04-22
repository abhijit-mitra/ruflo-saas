locals {
  name_prefix    = "${var.project_name}-${var.environment}"
  has_domain     = var.domain_name != ""
  has_tls_cert   = var.certificate_arn != ""
  s3_origin_id   = "S3-${var.frontend_bucket_name}"
  alb_origin_id  = "ALB-${local.name_prefix}"
}

# =============================================================================
# S3 Bucket — private bucket for React SPA assets
# =============================================================================
resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name

  tags = {
    Name = "${local.name_prefix}-frontend"
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access — CloudFront OAC is the only entry point
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =============================================================================
# CloudFront Origin Access Control — secure S3 access without OAI (legacy)
# =============================================================================
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}-oac"
  description                       = "OAC for ${local.name_prefix} frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy — allow CloudFront to read objects via OAC
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontOAC"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.frontend.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
        }
      }
    }]
  })
}

# =============================================================================
# CloudFront Response Headers Policy — security headers for the SPA
# =============================================================================
resource "aws_cloudfront_response_headers_policy" "security" {
  name = "${local.name_prefix}-security-headers"

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

# =============================================================================
# CloudFront Distribution
# =============================================================================
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name_prefix} frontend distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US, Canada, Europe — cheapest tier

  # Custom domain aliases (only if domain is provided)
  aliases = local.has_domain ? [var.domain_name] : []

  # ---------------------------------------------------------------------------
  # Origin 1: S3 bucket for static frontend assets (default)
  # ---------------------------------------------------------------------------
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = local.s3_origin_id
  }

  # ---------------------------------------------------------------------------
  # Origin 2: ALB for API requests
  # ---------------------------------------------------------------------------
  origin {
    domain_name = var.alb_dns_name
    origin_id   = local.alb_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # ALB terminates TLS; CloudFront -> ALB over HTTP within VPC
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # ---------------------------------------------------------------------------
  # Default cache behavior — S3 origin for the SPA
  # ---------------------------------------------------------------------------
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 0
    default_ttl                = 86400
    max_ttl                    = 31536000
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
  }

  # ---------------------------------------------------------------------------
  # Ordered cache behavior — /api/* routed to ALB with no caching
  # ---------------------------------------------------------------------------
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.alb_origin_id

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Accept", "Host"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0 # No caching for API requests
    compress               = true
  }

  # ---------------------------------------------------------------------------
  # SPA routing — return index.html for 403/404 (React Router handles routing)
  # ---------------------------------------------------------------------------
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # ---------------------------------------------------------------------------
  # TLS configuration
  # ---------------------------------------------------------------------------
  viewer_certificate {
    # Use custom cert if provided, otherwise use CloudFront's default cert
    acm_certificate_arn      = local.has_tls_cert ? var.certificate_arn : null
    ssl_support_method       = local.has_tls_cert ? "sni-only" : null
    minimum_protocol_version = local.has_tls_cert ? "TLSv1.2_2021" : "TLSv1"

    cloudfront_default_certificate = !local.has_tls_cert
  }

  # No geo restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "${local.name_prefix}-cdn"
  }
}
