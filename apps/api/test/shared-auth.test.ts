import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../src/app';
if (!process.env.DATABASE_URL?.includes('/klink_test')) throw new Error('Tests require klink_test');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-more-than-32-characters';

test('login account quota is shared by separate servers and client IPs', async () => {
  const servers = [buildApp(), buildApp()];
  const phone = randomUUID();
  try {
    for (let i = 0; i < 16; i++) {
      const response = await servers[i % 2].inject({ method: 'POST', url: '/api/v1/auth/login', remoteAddress: `192.0.2.${i + 1}`, payload: { phone, password: 'WrongPassword123!' } });
      assert.equal(response.statusCode, i < 15 ? 401 : 429, response.body);
      if (i === 15) assert.ok(Number(response.headers['retry-after']) > 0);
    }
  } finally { for (const server of servers) await server.close(); }
});

test('auth service fails closed when shared limiter storage fails', async () => {
  const server = buildApp();
  await server.ready();
  const original = server.prisma.$queryRaw;
  server.prisma.$queryRaw = async () => { throw new Error('private-db-location'); };
  try {
    const response = await server.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { phone: randomUUID(), password: 'WrongPassword123!' } });
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.includes('private-db-location'), false);
  } finally { server.prisma.$queryRaw = original; await server.close(); }
});

test('parallel requests share one atomic quota and expired windows renew', async () => {
  const { PrismaClient } = await import('@klink/database');
  const { consumeAuthQuota } = await import('../src/lib/auth-rate-limit');
  const clients = [new PrismaClient(), new PrismaClient()];
  const key = randomUUID();
  try {
    const results = await Promise.all(Array.from({length: 24}, (_, i) => consumeAuthQuota(clients[i % 2], 'test', key, 15)));
    assert.equal(results.filter(result => result.allowed).length, 15);
    const { createHmac } = await import('node:crypto');
    const hash = createHmac('sha256', process.env.JWT_SECRET!).update(`test:${key}`).digest('hex');
    await clients[0].$executeRaw`UPDATE "AuthRateLimit" SET "expiresAt" = clock_timestamp() - interval '1 second' WHERE "key"=${hash}`;
    assert.equal((await consumeAuthQuota(clients[1], 'test', key, 15)).remaining, 14);
  } finally { for (const client of clients) await client.$disconnect(); }
});

test('forwarding headers are trusted only inside Vercel', async () => {
  const { authClientIp } = await import('../src/lib/auth-rate-limit');
  delete process.env.VERCEL;
  assert.equal(authClientIp({ ip:'192.0.2.1', headers:{ 'x-vercel-forwarded-for':'198.51.100.1', 'x-forwarded-for':'198.51.100.2' } } as any), '192.0.2.1');
  process.env.VERCEL='1';
  try { assert.equal(authClientIp({ ip:'192.0.2.1', headers:{ 'x-vercel-forwarded-for':'198.51.100.1' } } as any), '198.51.100.1'); }
  finally { delete process.env.VERCEL; }
});
