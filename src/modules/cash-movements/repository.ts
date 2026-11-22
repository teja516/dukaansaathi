
import { and, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cashMovements } from '@/db/schema';

export type CashMovementRow = typeof cashMovements.$inferSelect;
export type NewCashMovementRow = typeof cashMovements.$inferInsert;

export type CashDirection = 'inflow' | 'outflow';
export type CashPaymentMethod = 'cash' | 'upi' | 'bank';

export interface ListCashMovementsFilters {
  shopId: string;
  direction?: CashDirection;
  paymentMethod?: CashPaymentMethod;
  from?: string;
  to?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function listCashMovements(
  filters: ListCashMovementsFilters,
): Promise<CashMovementRow[]> {
  const conditions: SQL[] = [eq(cashMovements.shopId, filters.shopId)];

  if (filters.direction) {
    conditions.push(eq(cashMovements.direction, filters.direction));
  }
  if (filters.paymentMethod) {
    conditions.push(eq(cashMovements.paymentMethod, filters.paymentMethod));
  }
  if (filters.from) {
    conditions.push(gte(cashMovements.movementDate, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(cashMovements.movementDate, filters.to));
  }

  const requested = filters.limit ?? DEFAULT_LIMIT;
  const limit = Math.min(Math.max(Math.floor(requested), 1), MAX_LIMIT);

  return db
    .select()
    .from(cashMovements)
    .where(and(...conditions))
    .orderBy(desc(cashMovements.movementDate), desc(cashMovements.createdAt))
    .limit(limit);
}

export async function getCashMovementById(
  id: string,
  shopId?: string,
): Promise<CashMovementRow | null> {
  const rows = await db
    .select()
    .from(cashMovements)
    .where(
      and(
        eq(cashMovements.id, id),
        shopId ? eq(cashMovements.shopId, shopId) : undefined,
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function createCashMovement(
  data: NewCashMovementRow,
): Promise<CashMovementRow> {
  const rows = await db.insert(cashMovements).values(data).returning();
  return rows[0];
}

export async function updateCashMovement(
  id: string,
  shopId: string,
  patch: Partial<Omit<NewCashMovementRow, 'id' | 'shopId' | 'createdAt'>>,
): Promise<CashMovementRow | null> {
  const rows = await db
    .update(cashMovements)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(cashMovements.id, id), eq(cashMovements.shopId, shopId)))
    .returning();

  return rows[0] ?? null;
}

export async function deleteCashMovement(
  id: string,
  shopId?: string,
): Promise<CashMovementRow | null> {
  const rows = await db
    .delete(cashMovements)
    .where(
      and(
        eq(cashMovements.id, id),
        shopId ? eq(cashMovements.shopId, shopId) : undefined,
      ),
    )
    .returning();

  return rows[0] ?? null;
}