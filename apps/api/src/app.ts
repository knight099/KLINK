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
import { geoRoutes } from './modules/geo/routes';
import { catalogRoutes } from './modules/catalog/routes';
import { marketplaceRoutes } from './modules/marketplace/routes';
import { customerRoutes } from './modules/customer/routes';
import { supplierRoutes } from './modules/supplier/routes';
import { adminRoutes } from './modules/admin/routes';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info'
    }
  }).withTypeProvider<ZodTypeProvider>();

  // Set Zod compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Common plugins
  app.register(cors, {
    origin: true,
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
    return {
      status: 'ok',
      service: 'klink-marketplace-api',
      time: new Date().toISOString()
    };
  });

  // API v1 Domain Routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(geoRoutes, { prefix: '/api/v1/geo' });
  app.register(catalogRoutes, { prefix: '/api/v1/catalog' });
  app.register(marketplaceRoutes, { prefix: '/api/v1/marketplace' });
  app.register(customerRoutes, { prefix: '/api/v1/customer' });
  app.register(supplierRoutes, { prefix: '/api/v1/supplier' });
  app.register(adminRoutes, { prefix: '/api/v1/admin' });

  return app;
}

