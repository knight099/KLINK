import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import type { FastifyRequest } from 'fastify';
import type { PrismaClient } from '@klink/database';

export function authClientIp(request: FastifyRequest) {
  // Only trust this header inside Vercel, which overwrites it at ingress.
  const forwarded = process.env.VERCEL === '1' ? request.headers['x-vercel-forwarded-for'] : undefined;
  const ip = typeof forwarded === 'string' ? forwarded.trim() : '';
  return isIP(ip) ? ip : request.ip;
}

export async function consumeAuthQuota(db: PrismaClient, kind: string, identity: string, limit: number) {
  // No phone numbers, IPs or passwords are stored in the shared counters.
  const key = createHmac('sha256', process.env.JWT_SECRET!).update(`${kind}:${identity}`).digest('hex');
  const [row] = await db.$queryRaw<{ count: number; retryAfter: number }[]>`
    INSERT INTO "AuthRateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, clock_timestamp() + interval '60 seconds')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "AuthRateLimit"."expiresAt" <= clock_timestamp() THEN 1 ELSE LEAST("AuthRateLimit"."count" + 1, 1000000) END,
      "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= clock_timestamp() THEN clock_timestamp() + interval '60 seconds' ELSE "AuthRateLimit"."expiresAt" END
    RETURNING "count", GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expiresAt" - clock_timestamp()))))::int AS "retryAfter"
  `;
  return { allowed: row.count <= limit, remaining: Math.max(0, limit - row.count), retryAfter: row.retryAfter, limit };
}
