import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = process.env.NEON_STORAGE_BUCKET || 'assets';

function getS3Client(): any {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-2';

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    forcePathStyle: true
  });
}

export const storageService = {
  isConfigured(): boolean {
    return !!(
      process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    );
  },

  getBucketName(): string {
    return BUCKET_NAME;
  },

  async uploadBuffer(key: string, body: Buffer | Uint8Array, contentType: string = 'application/octet-stream') {
    const client = getS3Client();
    if (!client) throw new Error('Neon Object Storage credentials not configured');

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType
    });

    return await client.send(command);
  },

  async getPresignedUploadUrl(key: string, contentType: string = 'application/octet-stream', expiresIn = 900) {
    const client = getS3Client();
    if (!client) throw new Error('Neon Object Storage credentials not configured');

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    return await getSignedUrl(client, command, { expiresIn });
  },

  async getPresignedDownloadUrl(key: string, expiresIn = 3600) {
    const client = getS3Client();
    if (!client) throw new Error('Neon Object Storage credentials not configured');

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    return await getSignedUrl(client, command, { expiresIn });
  },

  async listObjects(prefix?: string) {
    const client = getS3Client();
    if (!client) throw new Error('Neon Object Storage credentials not configured');

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix
    });

    const response = await client.send(command);
    return response.Contents || [];
  }
};

