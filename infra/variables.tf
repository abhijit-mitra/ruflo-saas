variable "project_name" {
  description = "Name of the project, used as prefix for all resources"
  type        = string
  default     = "ruflo-saas"
}

variable "environment" {
  description = "Deployment environment (production, staging, dev)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "dev"], var.environment)
    error_message = "Environment must be one of: production, staging, dev."
  }
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "ruflo"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "ruflo_admin"
}

variable "ecs_cpu" {
  description = "CPU units for the ECS task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "Memory (MiB) for the ECS task"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 3
}

variable "container_port" {
  description = "Port the backend container listens on"
  type        = number
  default     = 4000
}

variable "domain_name" {
  description = "Custom domain name (optional). Leave empty to use CloudFront/ALB defaults."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional). Must be in us-east-1 for CloudFront."
  type        = string
  default     = ""
}

variable "backend_image" {
  description = "Docker image URI for the backend container (e.g., 123456789.dkr.ecr.us-east-1.amazonaws.com/ruflo-api:latest)"
  type        = string
}

variable "frontend_bucket_name" {
  description = "S3 bucket name for the frontend SPA assets. Must be globally unique."
  type        = string
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs to CloudWatch"
  type        = bool
  default     = false
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}
