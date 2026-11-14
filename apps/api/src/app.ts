import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod';

import { prismaPlugin } from './plugins/prisma';
import { authPlugin } from './plugins/auth';
import { swaggerPlugin } from './plugins/swagger';
import { securityPlugin } from './plugins/security';

import { authRoutes } from './modules/auth/routes';
import { neonAuthRoutes } from './modules/auth/neon-routes';
import { geoRoutes } from './modules/geo/routes';
import { catalogRoutes } from './modules/catalog/routes';
import { marketplaceRoutes } from './modules/marketplace/routes';
import { customerRoutes } from './modules/customer/routes';
import { supplierRoutes } from './modules/supplier/routes';
import { adminRoutes } from './modules/admin/routes';
import { storageRoutes } from './modules/storage/routes';
import { aiGatewayRoutes } from './modules/ai/routes';

export function buildApp() {
  const app = Fastify({
    trustProxy: process.env.TRUST_PROXY === '1' ? (_address: string, hop: number) => hop === 0 : false,
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie']
    }
  }).withTypeProvider<ZodTypeProvider>();

  // Set Zod compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Common plugins
  app.register(cors, {
    origin: (origin, cb) => {
      // In development or server-to-server/curl calls, allow
      if (!origin || process.env.NODE_ENV !== 'production') {
        return cb(null, true);
      }
      const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
      cb(null, allowed.includes(origin));
    },
    credentials: true
  });
  app.register(sensible);

  // Custom infrastructure plugins
  app.register(securityPlugin);
  app.register(prismaPlugin);
  app.register(authPlugin);
  if (process.env.NODE_ENV !== 'production') app.register(swaggerPlugin);

  app.setErrorHandler<import('fastify').FastifyError>((error, request, reply) => {
    const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500;
    if (status === 500) request.log.error({ err: error }, 'Request failed');
    const code = (error as { code?: string }).code;
    if (code === 'P2002') return reply.status(409).send({ error: 'A record with these details already exists' });
    if (code === 'P2025') return reply.status(409).send({ error: 'Record changed or is no longer available' });
    return reply.status(status).send({ error: status === 500 ? 'Internal server error' : error.message });
  });

  const readiness = async (_request: unknown, reply: import('fastify').FastifyReply) => {
    reply.header('Cache-Control', 'no-store');
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'klink-marketplace-api' };
    } catch {
      return reply.status(503).send({ status: 'unavailable', service: 'klink-marketplace-api' });
    }
  };
  app.get('/health', readiness);
  app.get('/api/health', readiness);
  app.get('/api/live', async () => ({ status: 'ok' }));

  // API v1 Domain Routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(neonAuthRoutes, { prefix: '/api/v1/auth/neon' });
  app.register(geoRoutes, { prefix: '/api/v1/geo' });
  app.register(catalogRoutes, { prefix: '/api/v1/catalog' });
  app.register(marketplaceRoutes, { prefix: '/api/v1/marketplace' });
  app.register(customerRoutes, { prefix: '/api/v1/customer' });
  app.register(supplierRoutes, { prefix: '/api/v1/supplier' });
  app.register(adminRoutes, { prefix: '/api/v1/admin' });
  app.register(storageRoutes, { prefix: '/api/v1/storage' });
  app.register(aiGatewayRoutes, { prefix: '/api/v1/ai' });

  return app;
}

