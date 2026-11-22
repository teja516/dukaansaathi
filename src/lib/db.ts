import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Strip Prisma-style `?schema=public`. postgres-js forwards unknown query
// parameters to the server as startup settings, and Postgres rejects them.
function getConnectionString(): string {
  const raw = process.env.DATABASE_URL ?? '';
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    url.searchParams.delete('schema');
    return url.toString();
  } catch {
    return raw;
  }
}

// Cache the connection on globalThis so Next.js dev hot reloads do not open
// a new pool on every module re-evaluation. This caches the DB pool only;
// it does not hold any user or session state.
const globalForDb = globalThis as unknown as {
  __dukaanPgClient?: ReturnType<typeof postgres>;
};

const connectionString = getConnectionString();

// Hosted databases (Neon, Supabase) are reached through a transaction-mode pooler (PgBouncer).
// It cannot keep prepared statements, and every serverless instance should hold only a few
// connections. Locally (Docker) none of this applies and the settings stay as before.
const pooled = /-pooler\.|pooler\.supabase\./.test(connectionString) || process.env.DATABASE_POOLED === 'true';
const serverless = Boolean(process.env.VERCEL);

const client =
  globalForDb.__dukaanPgClient ??
  postgres(connectionString, {
    max: pooled || serverless ? 5 : 10,
    // Local and long-running servers: 0 = never close idle connections (opening a new one costs
    // ~50ms, which showed up as random slow requests after a pause). Serverless: release them.
    idle_timeout: serverless ? 20 : 0,
    connect_timeout: 10,
    prepare: !pooled,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__dukaanPgClient = client;
}

export const db = drizzle(client, { schema });

export type Db = typeof db;