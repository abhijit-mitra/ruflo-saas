provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# -----------------------------------------------------------------------------
# Networking — VPC, subnets, gateways, security groups
# -----------------------------------------------------------------------------
module "networking" {
  source = "./modules/networking"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  container_port       = var.container_port
  enable_vpc_flow_logs = var.enable_vpc_flow_logs
}

# -----------------------------------------------------------------------------
# Secrets — Secrets Manager for application configuration
# -----------------------------------------------------------------------------
module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  environment  = var.environment
}

# -----------------------------------------------------------------------------
# RDS — PostgreSQL database in private subnets
# -----------------------------------------------------------------------------
module "rds" {
  source = "./modules/rds"

  project_name     = var.project_name
  environment      = var.environment
  vpc_id           = module.networking.vpc_id
  private_subnets  = module.networking.private_subnet_ids
  rds_sg_id        = module.networking.rds_sg_id
  db_instance_class = var.db_instance_class
  db_name          = var.db_name
  db_username      = var.db_username
  enable_multi_az  = var.enable_multi_az
  secret_arn       = module.secrets.secret_arn
}

# -----------------------------------------------------------------------------
# ALB — Application Load Balancer in public subnets
# -----------------------------------------------------------------------------
module "alb" {
  source = "./modules/alb"

  project_name    = var.project_name
  environment     = var.environment
  vpc_id          = module.networking.vpc_id
  public_subnets  = module.networking.public_subnet_ids
  alb_sg_id       = module.networking.alb_sg_id
  container_port  = var.container_port
  certificate_arn = var.certificate_arn
}

# -----------------------------------------------------------------------------
# ECS — Fargate service running the backend API
# -----------------------------------------------------------------------------
module "ecs" {
  source = "./modules/ecs"

  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  private_subnets = module.networking.private_subnet_ids
  ecs_sg_id       = module.networking.ecs_sg_id
  target_group_arn = module.alb.target_group_arn
  ecs_cpu         = var.ecs_cpu
  ecs_memory      = var.ecs_memory
  ecs_desired_count = var.ecs_desired_count
  container_port  = var.container_port
  backend_image   = var.backend_image
  secret_arn      = module.secrets.secret_arn
}

# -----------------------------------------------------------------------------
# CDN — CloudFront distribution + S3 bucket for the frontend SPA
# -----------------------------------------------------------------------------
module "cdn" {
  source = "./modules/cdn"

  project_name         = var.project_name
  environment          = var.environment
  frontend_bucket_name = var.frontend_bucket_name
  alb_dns_name         = module.alb.alb_dns_name
  domain_name          = var.domain_name
  certificate_arn      = var.certificate_arn
}
