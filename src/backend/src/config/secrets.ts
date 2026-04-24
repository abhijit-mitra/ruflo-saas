import dotenv from 'dotenv';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

dotenv.config();

interface DbSecret {
  username: string;
  password: string;
  host: string;
  port: string;
  dbname: string;
}

/**
 * Loads database credentials from AWS Secrets Manager and sets DATABASE_URL.
 * Falls back to existing DATABASE_URL env var if secret name is not configured.
 */
export async function loadSecrets(): Promise<void> {
  const secretName = process.env.DB_SECRET_NAME;

  if (!secretName) {
    if (process.env.DATABASE_URL) {
      console.log('[Secrets] Using DATABASE_URL from environment');
      return;
    }
    throw new Error('Neither DB_SECRET_NAME nor DATABASE_URL is configured');
  }

  console.log(`[Secrets] Loading database credentials from AWS Secrets Manager: ${secretName}`);

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-2',
  });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  if (!response.SecretString) {
    throw new Error(`Secret ${secretName} has no string value`);
  }

  const secret: DbSecret = JSON.parse(response.SecretString);

  process.env.DATABASE_URL = `postgresql://${secret.username}:${encodeURIComponent(secret.password)}@${secret.host}:${secret.port}/${secret.dbname}?schema=public`;

  console.log(`[Secrets] DATABASE_URL loaded from Secrets Manager (host: ${secret.host})`);
}
