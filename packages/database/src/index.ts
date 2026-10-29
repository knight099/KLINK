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
      if (fs.existsSync(defaultDbPath)) {
        fs.copyFileSync(defaultDbPath, tmpDbPath);
      }
    }
    dbUrl = `file:${tmpDbPath}`;
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

