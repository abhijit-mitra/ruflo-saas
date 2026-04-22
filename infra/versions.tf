terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Uncomment and configure for remote state management.
  # Create the S3 bucket and DynamoDB table first:
  #   aws s3api create-bucket --bucket <your-bucket> --region us-east-1
  #   aws dynamodb create-table --table-name terraform-locks \
  #     --attribute-definitions AttributeName=LockID,AttributeType=S \
  #     --key-schema AttributeName=LockID,KeyType=HASH \
  #     --billing-mode PAY_PER_REQUEST

  # backend "s3" {
  #   bucket         = "ruflo-saas-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}
