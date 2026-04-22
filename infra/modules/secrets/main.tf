locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Initial secret structure. Update values via AWS Console or CLI after deploy.
  # NEVER put real secrets in Terraform code — this is a template only.
  initial_secret_value = jsonencode({
    JWT_SECRET              = "CHANGE_ME"
    JWT_REFRESH_SECRET      = "CHANGE_ME"
    GOOGLE_CLIENT_ID        = ""
    GOOGLE_CLIENT_SECRET    = ""
    MICROSOFT_CLIENT_ID     = ""
    MICROSOFT_CLIENT_SECRET = ""
    MICROSOFT_TENANT_ID     = ""
    DATABASE_URL            = ""
  })
}

resource "aws_secretsmanager_secret" "app_config" {
  name        = "${local.name_prefix}/app-config"
  description = "Application configuration secrets for ${var.project_name} (${var.environment})"

  # Secrets Manager charges for 7 days minimum after deletion.
  # Set to 0 for immediate deletion in dev; 30 for production.
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${local.name_prefix}-app-config"
  }
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id     = aws_secretsmanager_secret.app_config.id
  secret_string = local.initial_secret_value

  # Ignore changes to the secret value after initial creation.
  # Secrets are managed operationally, not via Terraform.
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# IAM policy document granting read access to this secret.
# Attach this to the ECS task execution role.
data "aws_iam_policy_document" "read_secret" {
  statement {
    sid    = "ReadAppSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [aws_secretsmanager_secret.app_config.arn]
  }
}

resource "aws_iam_policy" "read_secret" {
  name        = "${local.name_prefix}-read-app-secret"
  description = "Allows reading the application config secret"
  policy      = data.aws_iam_policy_document.read_secret.json
}
