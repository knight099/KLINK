import { FastifyPluginAsync } from 'fastify';

export const neonAuthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/status', async () => {
    const baseUrl = process.env.NEON_AUTH_BASE_URL || null;
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL || null;

    if (!baseUrl || !jwksUrl) {
      return {
        configured: false,
        service: 'neon-auth',
        status: 'unconfigured',
        message: 'NEON_AUTH_BASE_URL or NEON_AUTH_JWKS_URL is missing'
      };
    }

    try {
      const response = await fetch(jwksUrl);
      if (!response.ok) {
        return {
          configured: true,
          service: 'neon-auth',
          status: 'error',
          httpStatus: response.status,
          message: 'Failed to contact Neon Auth JWKS endpoint'
        };
      }

      const jwks = (await response.json()) as any;
      return {
        configured: true,
        service: 'neon-auth',
        status: 'operational',
        baseUrl,
        jwksUrl,
        keysFound: Array.isArray(jwks.keys) ? jwks.keys.length : 0
      };
    } catch (err: any) {
      return {
        configured: true,
        service: 'neon-auth',
        status: 'unreachable',
        error: err.message
      };
    }
  });
};

