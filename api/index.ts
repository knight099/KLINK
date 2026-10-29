let buildApp: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  buildApp = require('../apps/api/dist/index').buildApp;
} catch {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  buildApp = require('../apps/api/src/app').buildApp;
}

let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    app = buildApp();
    await app.ready();
  }
  app.server.emit('request', req, res);
}
