import { PrismaClient } from '@prisma/client';
import path from 'path';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const defaultDbPath = path.resolve(__dirname, '../prisma/dev.db');
const dbUrl = process.env.DATABASE_URL || `file:${defaultDbPath}`;

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

