import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { AuthTokenPayload, UserRole } from '@klink/shared-types';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthTokenPayload;
  }
}

export const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production!');
  }

  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'klink-darbhanga-secret-key-super-secure-2026'
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized: Invalid or missing token' });
    }
  });

  fastify.decorate('requireRole', (...roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const user = request.user;
        if (!user || !roles.includes(user.role)) {
          return reply.status(403).send({
            error: `Forbidden: requires one of roles [${roles.join(', ')}]`
          });
        }

        // Live Database Status Check: Verify supplier account is still ACTIVE
        if (user.role === 'SUPPLIER' && user.supplierId) {
          const supplier = await fastify.prisma.supplier.findUnique({
            where: { id: user.supplierId },
            select: { status: true, businessName: true }
          });

          if (!supplier || supplier.status !== 'ACTIVE') {
            const statusLabel = supplier?.status === 'PENDING_APPROVAL'
              ? 'pending administrator verification'
              : supplier?.status === 'SUSPENDED'
              ? 'suspended'
              : 'inactive';
            return reply.status(403).send({
              error: `Forbidden: Your yard account (${supplier?.businessName || 'Supplier'}) is currently ${statusLabel}.`
            });
          }
        }
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    };
  });
});

