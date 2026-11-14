import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { authClientIp, consumeAuthQuota } from '../lib/auth-rate-limit';

/**
 * Security headers, shared auth limits and per-instance general traffic limits
 * Provides Helmet-grade HTTP headers and sliding-window rate limiting for auth protection.
 */
export const securityPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // 1. Production Security Headers Hook
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  });

  // 2. In-Memory Sliding-Window Rate Limiter
  interface RateLimitBucket {
    count: number;
    resetTime: number;
  }

  const rateLimitMap = new Map<string, RateLimitBucket>();

  // Periodic cleanup of stale IP buckets every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitMap.entries()) {
      if (now > bucket.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  cleanupInterval.unref();

  fastify.addHook('onClose', async () => {
    clearInterval(cleanupInterval);
  });

  fastify.addHook('onRequest', async (request, reply) => {
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const isAuthRoute = request.url.startsWith('/api/v1/auth/');

    // Strict limit for sensitive auth endpoints (15 req/min), standard limit for general endpoints (300 req/min)
    // Auth writes use the shared database quota below. Auth reads must not consume login attempts.
    if (isAuthRoute) return;
    const maxRequests = 300;
    const windowMs = 60 * 1000;
    const now = Date.now();
    const key = `${ip}:${isAuthRoute ? 'auth' : 'general'}`;

    let bucket = rateLimitMap.get(key);

    if (!bucket || now > bucket.resetTime) {
      bucket = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitMap.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, maxRequests - bucket.count);
    const retryAfter = Math.ceil((bucket.resetTime - now) / 1000);

    reply.header('X-RateLimit-Limit', maxRequests);
    reply.header('X-RateLimit-Remaining', remaining);
    reply.header('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

    if (bucket.count > maxRequests) {
      reply.header('Retry-After', retryAfter);
      return reply.status(429).send({
        error: isAuthRoute
          ? 'Too many login attempts. Please wait 60 seconds before trying again.'
          : 'Rate limit exceeded. Please throttle your requests.'
      });
    }
  });
  let nextCleanupAt = 0;
  fastify.addHook('preValidation', async (request, reply) => {
    if (request.method !== 'POST' || !request.url.split('?')[0].startsWith('/api/v1/auth/')) return;
    try {
      const ipQuota = await consumeAuthQuota(fastify.prisma, 'ip', authClientIp(request), 60);
      const body = request.body as { phone?: unknown } | null;
      const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
      const accountQuota = ipQuota.allowed && phone && phone.length <= 100
        ? await consumeAuthQuota(fastify.prisma, 'account', phone, 15) : undefined;
      const quota = accountQuota || ipQuota;
      reply.header('X-RateLimit-Limit', quota.limit);
      reply.header('X-RateLimit-Remaining', quota.remaining);
      reply.header('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + quota.retryAfter);
      if (!quota.allowed) {
        return reply.header('Retry-After', quota.retryAfter).status(429).send({ error: 'Too many authentication attempts. Please try again shortly.' });
      }
      // Bounded cleanup; correctness never relies on a process timer surviving a cold start.
      if (Date.now() >= nextCleanupAt) {
        nextCleanupAt = Date.now() + 60_000;
        await fastify.prisma.$executeRaw`DELETE FROM "AuthRateLimit" WHERE "key" IN (SELECT "key" FROM "AuthRateLimit" WHERE "expiresAt" < clock_timestamp() - interval '5 minutes' LIMIT 1000)`;
      }
    } catch (error) {
      request.log.error({ err: error }, 'Shared authentication limiter unavailable');
      return reply.header('Retry-After', 30).status(503).send({ error: 'Authentication is temporarily unavailable. Please try again shortly.' });
    }
  });

});

