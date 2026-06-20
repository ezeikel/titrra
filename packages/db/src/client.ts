import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { PrismaClient } from './generated/prisma/client';

neonConfig.webSocketConstructor = ws;

type PrismaGlobal = typeof globalThis & {
  __titrraPrisma?: PrismaClient;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }]
        : undefined,
  });
};

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

export const getDb = () => {
  const globalForPrisma = globalThis as PrismaGlobal;
  if (!globalForPrisma.__titrraPrisma) {
    globalForPrisma.__titrraPrisma = createPrismaClient();
  }
  return globalForPrisma.__titrraPrisma;
};
