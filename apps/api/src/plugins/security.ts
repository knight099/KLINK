import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

/**
 * Enterprise Security Headers & In-Memory Rate Limiter Plugin
 * Provides Helmet-grade HTTP headers and sliding-window rate limiting for auth protection.
 */
export const securityPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // 1. Production Security Headers Hook
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
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

  fastify.addHook('onClose', () => {
    clearInterval(cleanupInterval);
  });

  fastify.addHook('onRequest', async (request, reply) => {
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const isAuthRoute = request.url.startsWith('/api/v1/auth/login') || request.url.startsWith('/api/v1/auth/register-customer');

    // Strict limit for sensitive auth endpoints (15 req/min), standard limit for general endpoints (300 req/min)
    const maxRequests = isAuthRoute ? 15 : 300;
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
});

