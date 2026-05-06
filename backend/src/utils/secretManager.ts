import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function getSecret(secretId: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID environment variable not set');
  }

  const name = `projects/${projectId}/secrets/${secretId}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const secretValue = version.payload?.data?.toString() || '';
    return secretValue;
  } catch (error) {
    throw new Error(`Failed to retrieve secret ${secretId}: ${error}`);
  }
}

export async function createSecret(secretId: string, secretValue: string): Promise<void> {
  const projectId = process.env.GCP_PROJECT_ID;

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID environment variable not set');
  }

  const parent = `projects/${projectId}`;

  try {
    // Create the secret
    const [secret] = await client.createSecret({
      parent,
      secretId,
      secret: {
        replication: {
          automatic: {},
        },
      },
    });

    // Add the secret version
    await client.addSecretVersion({
      parent: secret.name,
      payload: {
        data: Buffer.from(secretValue, 'utf8'),
      },
    });
  } catch (error) {
    throw new Error(`Failed to create secret ${secretId}: ${error}`);
  }
}
