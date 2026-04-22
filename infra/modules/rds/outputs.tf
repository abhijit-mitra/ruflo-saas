output "rds_endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.id
}

output "db_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}
