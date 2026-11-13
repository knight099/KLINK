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
declare module '@fastify/jwt' { interface FastifyJWT { user: AuthTokenPayload; } }

export const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  await fastify.register(fastifyJwt, { secret });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try { await request.jwtVerify(); }
    catch { return reply.status(401).send({ error: 'Unauthorized: Invalid or missing token' }); }
    const claims = request.user;
    const user = await fastify.prisma.user.findUnique({ where: { id: claims.id }, include: { supplier: true, customer: true } });
    if (!user || claims.sessionVersion !== user.sessionVersion || claims.role !== user.role ||
        claims.supplierId !== (user.supplier?.id ?? undefined) || claims.customerId !== (user.customer?.id ?? undefined)) {
      return reply.status(401).send({ error: 'Session expired. Please sign in again.' });
    }
    if ((user.role === 'SUPPLIER' && (!user.supplier || user.supplier.status !== 'ACTIVE')) ||
        (user.role === 'CUSTOMER' && !user.customer)) {
      return reply.status(403).send({ error: 'Account is not active or has no valid profile' });
    }
    request.user = { id: user.id, phone: user.phone, role: user.role as UserRole,
      name: user.supplier?.businessName || user.customer?.fullName || 'Platform Admin',
      supplierId: user.supplier?.id, customerId: user.customer?.id,
      mustChangePassword: user.mustChangePassword, sessionVersion: user.sessionVersion };
    const path = request.routeOptions.url;
    if (user.mustChangePassword && path !== '/api/v1/auth/change-password' && path !== '/api/v1/auth/me') {
      return reply.status(403).send({ error: 'Change your temporary password before continuing' });
    }
  });
  fastify.decorate('requireRole', (...roles: UserRole[]) => async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.authenticate(request, reply);
    if (reply.sent) return;
    if (!roles.includes(request.user.role)) return reply.status(403).send({ error: 'Forbidden: account role is not permitted' });
  });
});
