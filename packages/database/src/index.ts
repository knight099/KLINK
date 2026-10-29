import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Automatically resolve environment variables from .env.local or .env if not yet injected
function loadLocalEnv() {
  if (process.env.DATABASE_URL) return;

  const candidateDirs = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '../../..')
  ];

  const envFileNames = ['.env.local', '.env'];

  for (const dir of candidateDirs) {
    for (const fileName of envFileNames) {
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
          // ignore read error
        }
      }
    }
    if (process.env.DATABASE_URL) break;
  }
}

loadLocalEnv();

const dbUrl = process.env.DATABASE_URL;

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export * from '@prisma/client';
export { PrismaClient };
