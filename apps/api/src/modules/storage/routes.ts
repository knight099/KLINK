import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { storageService } from './service';

export const storageRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Storage health and configuration info
  fastify.get('/status', async () => {
    const configured = storageService.isConfigured();
    return {
      service: 'neon-object-storage',
      bucket: storageService.getBucketName(),
      configured,
      endpoint: process.env.AWS_ENDPOINT_URL_S3 || null,
      region: process.env.AWS_REGION || 'us-east-2'
    };
  });

  // Get presigned upload URL for uploads (e.g. vehicle photos, delivery challans)
  fastify.post(
    '/presign-upload',
    {
      schema: {
        body: z.object({
          filename: z.string().min(1),
          contentType: z.string().default('application/octet-stream'),
          folder: z.enum(['vehicles', 'storefronts', 'challans', 'catalog', 'test']).default('test')
        })
      }
    },
    async (request) => {
      const { filename, contentType, folder } = request.body;
      const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `${folder}/${Date.now()}-${cleanName}`;

      const uploadUrl = await storageService.getPresignedUploadUrl(key, contentType, 600);
      const downloadUrl = await storageService.getPresignedDownloadUrl(key, 3600);

      return {
        key,
        uploadUrl,
        downloadUrl,
        bucket: storageService.getBucketName()
      };
    }
  );

  // List stored objects
  fastify.get('/list', async (request) => {
    const query = request.query as { prefix?: string };
    const objects = await storageService.listObjects(query?.prefix);
    return {
      bucket: storageService.getBucketName(),
      count: objects.length,
      objects: objects.map((obj: any) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified
      }))
    };
  });

  // Test direct upload to Neon Object Storage
  fastify.post('/test-upload', async () => {
    const testContent = Buffer.from(`KLINK Neon Object Storage Verification - ${new Date().toISOString()}`);
    const testKey = `test/ping-${Date.now()}.txt`;
    await storageService.uploadBuffer(testKey, testContent, 'text/plain');

    const downloadUrl = await storageService.getPresignedDownloadUrl(testKey, 1800);
    return {
      status: 'ok',
      message: 'Successfully wrote test file to Neon Object Storage',
      key: testKey,
      downloadUrl
    };
  });
};

