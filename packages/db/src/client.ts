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

const getRealClient = () => {
  const globalForPrisma = globalThis as PrismaGlobal;
  if (!globalForPrisma.__titrraPrisma) {
    globalForPrisma.__titrraPrisma = createPrismaClient();
  }
  return globalForPrisma.__titrraPrisma;
};

// Lazy construction: `next build` collects page data by EVALUATING route
// modules, and auth.ts calls getDb() at module scope (PrismaAdapter). The
// client must therefore not require DATABASE_URL until a query actually
// runs, or an env-less CI build fails at module evaluation. (Same
// lazily-constructed-client pattern as the other Chewy Bytes apps.)
const lazyDb = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getRealClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

export const getDb = (): PrismaClient => lazyDb;
