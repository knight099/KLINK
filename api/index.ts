import { buildApp } from '../apps/api/src/app';
import type { IncomingMessage, ServerResponse } from 'node:http';
let ready: Promise<ReturnType<typeof buildApp>> | undefined;
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    ready ??= (async () => {
      const app = buildApp();
      try { await app.ready(); return app; }
      catch (error) { await app.close(); throw error; }
    })();
    const app = await ready;
    app.server.emit('request', req, res);
  } catch {
    ready = undefined;
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Service unavailable' }));
  }
}
