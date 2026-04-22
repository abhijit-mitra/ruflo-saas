output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_config.arn
}

output "secret_read_policy_arn" {
  description = "ARN of the IAM policy granting read access to the secret"
  value       = aws_iam_policy.read_secret.arn
}
