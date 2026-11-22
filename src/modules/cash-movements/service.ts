import { and, desc, eq, gte, lte, lt, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cashMovements } from '@/db/schema';

export async function listCashMovementRecords(
  shopId: string,
  query: {
    direction?: 'inflow' | 'outflow';
    payment_method?: 'cash' | 'upi' | 'bank';
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
  },
) {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  const conds = [eq(cashMovements.shopId, shopId)];
  if (query.direction) conds.push(eq(cashMovements.direction, query.direction));
  if (query.payment_method) conds.push(eq(cashMovements.paymentMethod, query.payment_method));
  if (query.from) conds.push(gte(cashMovements.movementDate, query.from));
  if (query.to) conds.push(lte(cashMovements.movementDate, query.to));
  if (query.cursor) {
    // cursor is "<movementDate>|<id>": rows strictly after it in (date desc, id desc) order.
    const [d, id] = query.cursor.split('|');
    if (d && id) {
      conds.push(or(lt(cashMovements.movementDate, d), and(eq(cashMovements.movementDate, d), lt(cashMovements.id, id)))!);
    }
  }
  const rows = await db
    .select()
    .from(cashMovements)
    .where(and(...conds))
    .orderBy(desc(cashMovements.movementDate), desc(cashMovements.id))
    .limit(limit + 1);
  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  return {
    items,
    next_cursor: rows.length > limit && last ? `${last.movementDate}|${last.id}` : null,
  };
}
