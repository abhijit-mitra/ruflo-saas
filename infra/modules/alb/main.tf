locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  has_tls_cert = var.certificate_arn != ""
}

# =============================================================================
# Application Load Balancer
# =============================================================================
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnets

  # Enable deletion protection in production
  enable_deletion_protection = var.environment == "production"

  # Drop invalid HTTP headers to prevent header injection
  drop_invalid_header_fields = true

  tags = {
    Name = "${local.name_prefix}-alb"
  }
}

# =============================================================================
# Target Group — IP type for Fargate awsvpc networking
# =============================================================================
resource "aws_lb_target_group" "backend" {
  name        = "${local.name_prefix}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  # Faster deregistration for rolling deployments
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200"
  }

  tags = {
    Name = "${local.name_prefix}-tg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# HTTP Listener — redirect to HTTPS if cert provided, else forward directly
# =============================================================================
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = local.has_tls_cert ? "redirect" : "forward"

    # Redirect to HTTPS when a certificate is provided
    dynamic "redirect" {
      for_each = local.has_tls_cert ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    # Forward directly when no certificate is provided (dev/testing)
    target_group_arn = local.has_tls_cert ? null : aws_lb_target_group.backend.arn
  }
}

# =============================================================================
# HTTPS Listener — only created when a certificate ARN is provided
# =============================================================================
resource "aws_lb_listener" "https" {
  count = local.has_tls_cert ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}
