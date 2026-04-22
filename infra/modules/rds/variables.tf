variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the RDS instance will be created"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "rds_sg_id" {
  description = "Security group ID for the RDS instance"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "secret_arn" {
  description = "ARN of the Secrets Manager secret to store the DATABASE_URL"
  type        = string
}
