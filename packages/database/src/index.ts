import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const defaultDbPath = path.resolve(__dirname, '../prisma/dev.db');
let dbUrl = process.env.DATABASE_URL || `file:${defaultDbPath}`;

// Resilient handling for Vercel Serverless environment:
// Vercel lambda root is read-only; copy SQLite db to /tmp so writes succeed
if (process.env.VERCEL && dbUrl.startsWith('file:')) {
  try {
    const tmpDbPath = '/tmp/klink.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.resolve(process.cwd(), 'packages/database/prisma/dev.db'),
        path.resolve(__dirname, '../prisma/dev.db'),
        path.resolve(__dirname, '../../packages/database/prisma/dev.db'),
        '/var/task/packages/database/prisma/dev.db'
      ];
      const sourceDb = candidates.find((p) => fs.existsSync(p));
      if (sourceDb) {
        fs.copyFileSync(sourceDb, tmpDbPath);
      }
    }
    if (fs.existsSync(tmpDbPath)) {
      dbUrl = `file:${tmpDbPath}`;
    }
  } catch (err) {
    console.warn('Vercel serverless /tmp database copy notice:', err);
  }
}

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

