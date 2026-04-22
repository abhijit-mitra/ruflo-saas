locals {
  name_prefix    = "${var.project_name}-${var.environment}"
  container_name = "${var.project_name}-api"
}

data "aws_caller_identity" "current" {}

# =============================================================================
# CloudWatch Log Group
# =============================================================================
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.name_prefix}"
  retention_in_days = 30

  tags = {
    Name = "${local.name_prefix}-ecs-logs"
  }
}

# =============================================================================
# ECS Cluster
# =============================================================================
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${local.name_prefix}-cluster"
  }
}

# =============================================================================
# IAM — Execution Role (used by ECS agent to pull images, read secrets, write logs)
# =============================================================================
data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${local.name_prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = {
    Name = "${local.name_prefix}-ecs-execution-role"
  }
}

# Managed policy for ECR pull and CloudWatch logs
resource "aws_iam_role_policy_attachment" "execution_ecr_logs" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Grant read access to Secrets Manager for container secrets
resource "aws_iam_role_policy" "execution_secrets" {
  name = "${local.name_prefix}-ecs-read-secrets"
  role = aws_iam_role.execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
      ]
      Resource = [var.secret_arn]
    }]
  })
}

# =============================================================================
# IAM — Task Role (used by the running container; minimal permissions)
# =============================================================================
resource "aws_iam_role" "task" {
  name               = "${local.name_prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = {
    Name = "${local.name_prefix}-ecs-task-role"
  }
}

# Add application-specific permissions to the task role as needed.
# Example: S3 access, SQS, SNS, etc.

# =============================================================================
# ECS Task Definition
# =============================================================================
resource "aws_ecs_task_definition" "main" {
  family                   = "${local.name_prefix}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name  = local.container_name
    image = var.backend_image

    essential = true

    portMappings = [{
      containerPort = var.container_port
      hostPort      = var.container_port
      protocol      = "tcp"
    }]

    # Inject the full secret JSON as individual env vars.
    # The application reads DATABASE_URL, JWT_SECRET, etc. from env.
    secrets = [{
      name      = "APP_SECRETS"
      valueFrom = var.secret_arn
    }]

    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "PORT", value = tostring(var.container_port) },
    ]

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }
  }])

  tags = {
    Name = "${local.name_prefix}-task-def"
  }
}

# =============================================================================
# ECS Service
# =============================================================================
resource "aws_ecs_service" "main" {
  name            = "${local.name_prefix}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"
  platform_version = "LATEST"

  # Place tasks in private subnets
  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }

  # Register tasks with the ALB target group
  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = local.container_name
    container_port   = var.container_port
  }

  # Rolling deployment: keep at least 50% healthy, allow up to 200%
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  # Wait for steady state on create/update
  wait_for_steady_state = false

  # Ensure ALB listener is ready before creating the service
  depends_on = [var.target_group_arn]

  lifecycle {
    ignore_changes = [desired_count] # Managed by auto-scaling
  }

  tags = {
    Name = "${local.name_prefix}-ecs-service"
  }
}

# =============================================================================
# Auto Scaling — target tracking on CPU utilization
# =============================================================================
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.ecs_desired_count * 3
  min_capacity       = var.ecs_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name_prefix}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
