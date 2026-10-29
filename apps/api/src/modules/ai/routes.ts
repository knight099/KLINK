import { FastifyPluginAsync } from 'fastify';

export const aiGatewayRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/status', async () => {
    const token = process.env.NEON_AI_GATEWAY_TOKEN || null;
    const baseUrl = process.env.NEON_AI_GATEWAY_BASE_URL || 'https://ai-gateway.neon.tech';
    const isConfigured = !!token;

    return {
      service: 'neon-ai-gateway',
      configured: isConfigured,
      baseUrl,
      status: isConfigured ? 'available' : 'plan_upgrade_required',
      note: isConfigured
        ? 'Neon AI Gateway is connected'
        : 'AI Gateway is supported on Neon paid tiers. To enable, upgrade branch to include aiGateway in neon.ts.'
    };
  });
};

