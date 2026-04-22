variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "container_port" {
  description = "Port the backend container listens on"
  type        = number
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs to CloudWatch"
  type        = bool
  default     = false
}
