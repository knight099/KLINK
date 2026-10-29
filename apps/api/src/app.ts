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
    trustProxy: true,
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info'
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
      // In production, allow *.vercel.app, klink domains, or explicitly allowed origins
      const allowedPatterns = [
        /\.vercel\.app$/,
        /^https:\/\/.*\.klink\.in$/,
        /^https:\/\/klink\.in$/
      ];
      if (process.env.ALLOWED_ORIGINS) {
        const extra = process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
        if (extra.includes(origin)) return cb(null, true);
      }
      const isMatch = allowedPatterns.some((pattern) => pattern.test(origin));
      cb(null, isMatch);
    },
    credentials: true
  });
  app.register(sensible);

  // Custom infrastructure plugins
  app.register(securityPlugin);
  app.register(prismaPlugin);
  app.register(authPlugin);
  app.register(swaggerPlugin);

  // Health check
  app.get('/health', async () => {
    let dbStatus = 'connected';
    try {
      await app.prisma.$queryRaw`SELECT 1`;
    } catch (e: any) {
      dbStatus = `disconnected: ${e.message}`;
    }

    return {
      status: 'ok',
      service: 'klink-marketplace-api',
      database: dbStatus,
      neon: {
        branch: process.env.NEON_BRANCH || 'production',
        storage: !!process.env.AWS_ENDPOINT_URL_S3,
        auth: !!process.env.NEON_AUTH_BASE_URL
      },
      time: new Date().toISOString()
    };
  });

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

