output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cdn.cloudfront_domain
}

output "rds_endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = module.rds.rds_endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend assets"
  value       = module.cdn.s3_bucket_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "secret_arn" {
  description = "ARN of the Secrets Manager secret for application config"
  value       = module.secrets.secret_arn
}
