variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "ecs_sg_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the ALB target group"
  type        = string
}

variable "ecs_cpu" {
  description = "CPU units for the ECS task"
  type        = number
}

variable "ecs_memory" {
  description = "Memory (MiB) for the ECS task"
  type        = number
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

variable "container_port" {
  description = "Port the backend container listens on"
  type        = number
}

variable "backend_image" {
  description = "Docker image URI for the backend container"
  type        = string
}

variable "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  type        = string
}
