import { buildApp } from '../apps/api/src/app';

let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    app = buildApp();
    await app.ready();
  }
  app.server.emit('request', req, res);
}
