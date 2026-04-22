locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# VPC
# =============================================================================
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

# =============================================================================
# Subnets — 3 public + 3 private across AZs
# =============================================================================

# Public subnets — used by ALB and NAT Gateway
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-public-${data.aws_availability_zones.available.names[count.index]}"
    Tier = "public"
  }
}

# Private subnets — used by ECS tasks and RDS
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${local.name_prefix}-private-${data.aws_availability_zones.available.names[count.index]}"
    Tier = "private"
  }
}

# =============================================================================
# Internet Gateway — public subnet internet access
# =============================================================================
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

# =============================================================================
# NAT Gateway — private subnet outbound internet access
# Using a single NAT Gateway to reduce cost. For production HA, deploy one
# NAT Gateway per AZ (3 total) and create per-AZ private route tables.
# =============================================================================
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-nat-eip"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${local.name_prefix}-nat"
  }

  depends_on = [aws_internet_gateway.main]
}

# =============================================================================
# Route Tables
# =============================================================================

# Public route table — routes to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${local.name_prefix}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route table — routes to NAT Gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${local.name_prefix}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# =============================================================================
# VPC Flow Logs (optional)
# =============================================================================
resource "aws_flow_log" "vpc" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.flow_log[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-flow-log"
  }
}

resource "aws_cloudwatch_log_group" "flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name              = "/vpc/${local.name_prefix}/flow-logs"
  retention_in_days = 30

  tags = {
    Name = "${local.name_prefix}-flow-log-group"
  }
}

resource "aws_iam_role" "flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = "${local.name_prefix}-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = "${local.name_prefix}-flow-log-policy"
  role = aws_iam_role.flow_log[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# =============================================================================
# Security Groups
# =============================================================================

# ALB Security Group — accepts HTTP/HTTPS from the internet
# Cross-SG references use standalone rules to avoid circular dependencies.
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  description = "Security group for the Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB -> ECS egress (standalone rule to avoid circular reference)
resource "aws_security_group_rule" "alb_to_ecs" {
  type                     = "egress"
  from_port                = var.container_port
  to_port                  = var.container_port
  protocol                 = "tcp"
  security_group_id        = aws_security_group.alb.id
  source_security_group_id = aws_security_group.ecs.id
  description              = "To ECS tasks on container port"
}

# ECS Security Group — accepts traffic only from ALB
resource "aws_security_group" "ecs" {
  name_prefix = "${local.name_prefix}-ecs-"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound (ECR pulls, Secrets Manager, etc.)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-ecs-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB -> ECS ingress (standalone rule to avoid circular reference)
resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  from_port                = var.container_port
  to_port                  = var.container_port
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs.id
  source_security_group_id = aws_security_group.alb.id
  description              = "From ALB on container port"
}

# RDS Security Group — accepts connections only from ECS tasks
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  # No egress rules — RDS does not need outbound access

  tags = {
    Name = "${local.name_prefix}-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}
