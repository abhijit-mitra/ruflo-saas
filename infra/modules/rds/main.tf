locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# =============================================================================
# Random password — stored in Secrets Manager, never in state for operators
# =============================================================================
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Exclude characters that cause quoting issues in connection strings
  override_special = "!#$%&*()-_=+[]{}|:;<>?"
}

# =============================================================================
# DB Subnet Group — places RDS in private subnets
# =============================================================================
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet"
  subnet_ids = var.private_subnets

  tags = {
    Name = "${local.name_prefix}-db-subnet-group"
  }
}

# =============================================================================
# Parameter Group — sensible PostgreSQL 15 defaults
# =============================================================================
resource "aws_db_parameter_group" "main" {
  name   = "${local.name_prefix}-pg15-params"
  family = "postgres15"

  # Log slow queries (> 1 second)
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  # Enable pg_stat_statements for query analysis
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "all"
  }

  tags = {
    Name = "${local.name_prefix}-pg15-params"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# RDS PostgreSQL Instance
# =============================================================================
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "15"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Storage
  allocated_storage     = 20
  max_allocated_storage = 100 # Auto-scaling up to 100 GB
  storage_type          = "gp3"
  storage_encrypted     = true

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_sg_id]
  publicly_accessible    = false
  port                   = 5432

  # High availability
  multi_az = var.enable_multi_az

  # Backups
  backup_retention_period = 7
  backup_window           = "03:00-04:00"   # UTC
  maintenance_window      = "mon:04:30-mon:05:30"

  # Parameter group
  parameter_group_name = aws_db_parameter_group.main.name

  # Monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Deletion protection — disable skip_final_snapshot only in dev
  deletion_protection       = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${local.name_prefix}-final-snapshot" : null

  # Avoid downtime on minor version upgrades
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false

  tags = {
    Name = "${local.name_prefix}-postgres"
  }

  lifecycle {
    # Prevent accidental destruction of the database in production.
    # Remove this block only when intentionally decommissioning.
    prevent_destroy = false # Set to true for real production deployments
  }
}

# =============================================================================
# Store DATABASE_URL in Secrets Manager
# Updates the existing secret with the connection string after RDS is created.
# =============================================================================
resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id = var.secret_arn
  secret_string = jsonencode({
    JWT_SECRET              = "CHANGE_ME"
    JWT_REFRESH_SECRET      = "CHANGE_ME"
    GOOGLE_CLIENT_ID        = ""
    GOOGLE_CLIENT_SECRET    = ""
    MICROSOFT_CLIENT_ID     = ""
    MICROSOFT_CLIENT_SECRET = ""
    MICROSOFT_TENANT_ID     = ""
    DATABASE_URL            = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}/${var.db_name}"
  })

  # After initial creation, operators manage secret values directly.
  lifecycle {
    ignore_changes = [secret_string]
  }
}
