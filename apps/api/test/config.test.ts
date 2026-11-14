import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app';

test('production refuses absent signing secret', async () => {
  process.env.NODE_ENV = 'production';
  delete process.env.JWT_SECRET;
  process.env.ALLOWED_ORIGINS = 'https://klink.in';
  const app = buildApp();
  await assert.rejects(app.ready(), /JWT_SECRET/);
  await app.close();
});
test('production CORS only accepts exact configured origins', async () => {
  process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
  const app = buildApp();
  try {
    const allowed = await app.inject({ url: '/api/v1/ai/status', headers: { origin: 'https://klink.in' } });
    assert.equal(allowed.headers['access-control-allow-origin'], 'https://klink.in');
    const denied = await app.inject({ url: '/api/v1/ai/status', headers: { origin: 'https://attacker.vercel.app' } });
    assert.equal(denied.headers['access-control-allow-origin'], undefined);
  } finally { await app.close(); }
});
test('unavailable database returns readiness 503 without internal details', async () => {
  const app = buildApp();
  await app.ready();
  app.prisma.$queryRaw = async () => { throw new Error('private-database-host-and-credential'); };
  try {
    const res = await app.inject({ url: '/health' });
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.includes('private-database'), false);
  } finally { await app.close(); }
});
