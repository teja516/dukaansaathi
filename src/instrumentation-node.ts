import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

/**
 * Opens the database connections up front so the first visitor does not pay for connecting
 * (the first dashboard request used to take almost a second). Node runtime only.
 */
export async function warmDatabase(): Promise<void> {
  try {
    await Promise.all(Array.from({ length: 6 }, () => db.execute(sql`select 1`)));
  } catch (err) {
    // Never block startup: if the database is down, requests will report it themselves.
    console.warn('[startup] database warm-up skipped:', err instanceof Error ? err.message : err);
  }
}
