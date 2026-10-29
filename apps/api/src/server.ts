import fs from 'fs';
import path from 'path';

// Automatically load .env.local or .env for standalone server runs
function loadLocalEnv() {
  const candidateDirs = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..')
  ];
  for (const dir of candidateDirs) {
    for (const fileName of ['.env.local', '.env']) {
      const fullPath = path.resolve(dir, fileName);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const rawLine of content.split('\n')) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const eqIdx = line.indexOf('=');
            if (eqIdx !== -1) {
              const key = line.slice(0, eqIdx).trim();
              let val = line.slice(eqIdx + 1).trim();
              if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))
              ) {
                val = val.slice(1, -1);
              }
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }
}

loadLocalEnv();

import { buildApp } from './app';

const server = buildApp();

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

server.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 KLINK Fastify Marketplace API running at: ${address}`);
  console.log(`📚 Swagger OpenAPI Documentation: ${address}/documentation`);
});
